# Use R base image
FROM rocker/r-base:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && node --version

# Install npm globally using npx if needed, or verify npm exists
RUN npm --version || (curl -qL https://www.npmjs.com/install.sh | sh)

# Verify R and Rscript are available
RUN which R && which Rscript

# Install R packages
RUN R -e "install.packages('BiocManager', repos='http://cran.rstudio.com/')" \
    && R -e "BiocManager::install(c('sangerseqR', 'Biostrings'))" \
    && R -e "install.packages(c('gamlss', 'dplyr', 'stringr', 'jsonlite'), repos='http://cran.rstudio.com/')"

# Set PATH to ensure Rscript is found
ENV PATH="/usr/local/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./

# Install Node dependencies
RUN npm install

# Copy backend application files
COPY backend/ .

# Expose port
EXPOSE 10000

# Start the server
CMD ["npm", "start"]
