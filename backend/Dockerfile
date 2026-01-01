# Use R base image
FROM rocker/r-base:latest

# Install Node.js and other dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify R and Rscript are available
RUN which R && which Rscript

# Install R packages
RUN R -e "install.packages('BiocManager', repos='http://cran.rstudio.com/')" \
    && R -e "BiocManager::install(c('sangerseqR', 'Biostrings'))" \
    && R -e "install.packages('gamlss', repos='http://cran.rstudio.com/')"

# Set PATH to ensure Rscript is found
ENV PATH="/usr/local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
