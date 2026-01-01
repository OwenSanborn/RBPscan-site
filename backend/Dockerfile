# Use R base image
FROM rocker/r-base:latest

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install R packages
RUN R -e "install.packages('BiocManager', repos='http://cran.rstudio.com/')" \
    && R -e "BiocManager::install(c('sangerseqR', 'Biostrings'))" \
    && R -e "install.packages('gamlss', repos='http://cran.rstudio.com/')"

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
