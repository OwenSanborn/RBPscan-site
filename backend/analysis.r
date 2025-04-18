suppressPackageStartupMessages({
  library(Biostrings)
  library(dplyr)
  library(gamlss)
  library(stringr)
  library(jsonlite)
  library(sangerseqR)
})

CreateSangs <- function(peakAmp, basecalls){
  sangs <- as.data.frame(peakAmp)
  names(sangs) <- c("A.area","C.area","G.area","T.area")
  sangs <- sangs %>% 
    mutate(Tot.area = A.area + C.area + G.area + T.area,
           A.perc = 100*A.area / Tot.area,
           C.perc = 100*C.area / Tot.area,
           G.perc = 100*G.area / Tot.area,
           T.perc = 100*T.area / Tot.area) 

  sangs$base.call <- strsplit(x = toString(basecalls@primarySeq), split = "") %>%
    unlist
  
  sangs$index <- seq_along(sangs$base.call)
  return(sangs)
}

find_guide_coordinates <- function(filtered_data, guide_seq, anchor = "CCAATTAAA", guide_length = 36) {
  message("Locating guide using anchor: ", anchor)

  # Collapse filtered basecalls to a string
  sequence_str <- paste(filtered_data$base.call, collapse = "")
  
  # Locate the anchor
  anchor_pos <- stringr::str_locate(sequence_str, anchor)[1]

  if (is.na(anchor_pos)) {
    stop("Anchor sequence not found in filtered base calls.")
  }

  # Guide starts immediately after the anchor
  guide_start_str_index <- anchor_pos + nchar(anchor)
  guide_end_str_index <- guide_start_str_index + guide_length - 1

  guide_bases <- substring(sequence_str, guide_start_str_index, guide_end_str_index)

  message("Guide starts at string position: ", guide_start_str_index)
  message("Extracted guide bases: ", guide_bases)

  # Map string index to actual basecall indices
  guide_indices <- filtered_data$index[guide_start_str_index:guide_end_str_index]

  guide_coord <- list(
    start = guide_indices[1],
    end = guide_indices[length(guide_indices)]
  )

  message("Mapped guide coordinates: ", guide_coord$start, " to ", guide_coord$end)
  return(guide_coord)
}



fit_null_model <- function(sangs.filt, guide.coord)
  # this function takes the sangs.filt dataframe, gathers values for the null distribution
  # for each base, and then fits a zero-adjusted gamma distribution to these values
  # it returns a list of data.frames, each with the parameters of a null distribution 
  # for each base
  {

  sangs.filt <- sangs.filt %>% filter(!(index %in% (guide.coord$start:guide.coord$end)) )

  nvals <- list()
  nvals$t <- sangs.filt %>% filter(base.call != "T") %>% select(T.perc) %>% unlist()
  nvals$c <- sangs.filt %>% filter(base.call != "C") %>% select(C.perc) %>% unlist()
  nvals$g <- sangs.filt %>% filter(base.call != "G") %>% select(G.perc) %>% unlist()
  nvals$a <- sangs.filt %>% filter(base.call != "A") %>% select(A.perc) %>% unlist()
  
  # Updated 3.26.19 to account for ultra clean sequencing
  replacement_zaga = c(rep(0, 989), 0.00998720389310502, 0.00998813447664401,0.009992887520785,
                       0.00999585366068316, 0.00999623914632598, 0.00999799013526835, 0.010001499423723,
                       0.0100030237039207, 0.0100045782875701, 0.0100048452355807, 0.0100049548867042)
  
  n.models <- lapply(nvals, FUN = function(x){
    set.seed(1)
    if((unique(x)[1] == 0 & length(unique(x)) == 1) |
       (unique(x)[1] == 0 & length(unique(x)) == 2 & table(x)[2] == 1))
    {x = replacement_zaga; message("Replacement vector used for low noise.")} # add noise if all 0s, or all 0s and one other value.
    tryCatch(gamlss((x)~1, family = ZAGA), error=function(e) # Progressively step up the mu.start if it fails
      tryCatch(gamlss((x)~1, family = ZAGA, mu.start = 1), error=function(e) 
        tryCatch(gamlss((x)~1, family = ZAGA, mu.start = 2), error=function(e) 
          tryCatch(gamlss((x)~1, family = ZAGA, mu.start = 3), error=function(e) # additional step added.
            gamlss((x)~1, family = ZAGA, mu.start = mean(x))
          )
        )
      )
    )
  })
  null.m.params <- lapply(n.models, FUN = function(x){
    mu <- exp(x$mu.coefficients[[1]])
    sigma <- exp(x$sigma.coefficients[[1]])
    nu.logit <- x$nu.coefficients[[1]]
    nu <- exp(nu.logit)/(1+exp(nu.logit))
    fillibens <-cor(as.data.frame(qqnorm(x$residuals, plot = FALSE)))[1,2]
    
    return(data.frame(mu= mu, sigma = sigma, nu = nu, fillibens = fillibens))
  })
  return(null.m.params)
}


calculate_editing_probabilities <- function(filtered_data, guide_coords, guide_seq, null_model_params) {
  message("Calculating editing probabilities...")

  # Subset guide region from filtered chromatogram
  guide.df <- filtered_data[filtered_data$index %in% (guide_coords$start:guide_coords$end), ]

  # Expected guide sequence from input
  expected_guide <- strsplit(toString(DNAString(guide_seq)), "")[[1]]

  # Safely match length
  n <- min(nrow(guide.df), length(expected_guide))
  guide.df$expected_guide <- rep(NA, nrow(guide.df))
  guide.df$expected_guide[1:n] <- expected_guide[1:n]
  guide.df$match <- rep(NA, nrow(guide.df))
  guide.df$match[1:n] <- guide.df$base.call[1:n] == expected_guide[1:n]

  # Positional index within the guide
  guide.df$guide.position <- seq_len(nrow(guide.df))

  # Debug output
  message("Expected guide: ", paste(expected_guide[1:n], collapse = ""))
  message("Base calls at guide positions: ", paste(guide.df$base.call[1:n], collapse = ""))
  message("Match flags: ", paste(guide.df$match[1:n], collapse = ", "))

  # Function to calculate p-values
  calcBaseProb <- function(params, perc) {
    pZAGA(q = perc, mu = params$mu, sigma = params$sigma, nu = params$nu, lower.tail = FALSE)
  }

  # Compute editing probabilities
  guide.df$T.pval <- calcBaseProb(null_model_params$t, guide.df$T.perc)
  guide.df$C.pval <- calcBaseProb(null_model_params$c, guide.df$C.perc)
  guide.df$G.pval <- calcBaseProb(null_model_params$g, guide.df$G.perc)
  guide.df$A.pval <- calcBaseProb(null_model_params$a, guide.df$A.perc)

  message("Editing probabilities calculated.")
  return(guide.df)
}



analyze_parsed_data <- function(parsed_data, guide_seq, groups, replicates, trim5 = NA, trim3 = NA, pvalcutoff = NULL) {
  results_list <- list()

  for (i in seq_along(parsed_data)) {
    message("parsed_data[[", i, "]] = ", parsed_data[[i]])
    message("Processing file ", i, "/", length(parsed_data))
    tryCatch({
      seq <- sangerseq(read.abif(as.character(parsed_data[[i]])))
      if (is.null(seq)) stop("Failed to read sequence file.")

      basecalls <- makeBaseCalls(seq)
      message("Base calls made.")
      peakampmatrix <- peakAmpMatrix(basecalls)
      message("Peak amplitude matrix created.")
      sangs <- CreateSangs(peakampmatrix, basecalls)
      message("Sanger dataframe created.")

      if (!is.na(trim5) & !is.na(trim3)) {
        sangs.filt <- sangs[trim5:trim3, ]
      } else {
        sangs.filt <- sangs %>% filter(index > 20)
        peakTotAreaCutoff <- mean(sangs.filt$Tot.area)/10
        sangs.filt <- sangs.filt %>% filter(Tot.area > peakTotAreaCutoff)
      }
      message("Filtered Sanger dataframe created.")

      guide_coords <- find_guide_coordinates(sangs.filt, guide_seq)
      message("Guide coordinates found.")
      null_model_params <- fit_null_model(sangs.filt, guide_coords)
      editing_df <- calculate_editing_probabilities(sangs.filt, guide_coords, guide_seq, null_model_params)
      message("Editing probabilities calculated.")

      # Calculate editing percentage
      positions <- c(8, 13, 18, 23, 28, 33)
      target_editing_df <- editing_df[editing_df$guide.position %in% positions, ]

      message("Guide bases at selected positions: ", paste(target_editing_df$guide.seq, collapse = ""))
      message("Basecalls at selected positions: ", paste(target_editing_df$base.call, collapse = ""))



      sum_G <- sum(target_editing_df$G.perc, na.rm = TRUE)
      #sum_all <- sum(c(target_editing_df$A.perc, target_editing_df$G.perc), na.rm = TRUE)
      sum_all <- sum(c(target_editing_df$A.perc, target_editing_df$G.perc, target_editing_df$C.perc, target_editing_df$T.perc), na.rm = TRUE)

      message("c: ", paste(target_editing_df$C.perc, collapse = ", "))
      message("g: ", paste(target_editing_df$G.perc, collapse = ", "))
      message("a: ", paste(target_editing_df$A.perc, collapse = ", "))
      message("t: ", paste(target_editing_df$T.perc, collapse = ", "))

       # Calculate mean editing percentage
      mean_edit <- if (sum_all == 0) NA else (100 * sum_G) / sum_all
      message("Mean editing percentage calculated")

       # Create result data frame
      result <- data.frame(
        File = parsed_data[[i]],
        Group = groups[[i]],
        Replicate = replicates[[i]],
        Mean_edit = mean_edit,
        stringsAsFactors = FALSE
      )
      message(print(result))
      results_list[[i]] <- result
    }, error = function(e) {
      message("Error processing file ", i, ": ", e$message)
      results_list[[i]] <- data.frame(
        File = parsed_data[[i]],
        Group = groups[[i]],
        Replicate = replicates[[i]],
        Mean_edit = NA,
        stringsAsFactors = FALSE
      )
    })
  }

  return(do.call(rbind, results_list))
}

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 1) stop("No input provided")
input <- fromJSON(args[1], simplifyVector = FALSE)

results <- analyze_parsed_data(
  parsed_data = input$parsed_data,
  guide_seq = input$guide_seq,
  groups = input$groups,
  replicates = input$replicates,
)

print(results)
cat(toJSON(results, auto_unbox = TRUE))