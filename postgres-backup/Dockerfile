FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:latest

# Install postgresql client version 16 to match server version
RUN apt-get update && \
    apt-get install -y wget gnupg2 && \
    sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get install -y postgresql-client-16 && \
    apt-get remove -y wget gnupg2 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy backup script
COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

CMD ["/usr/local/bin/backup.sh"]

