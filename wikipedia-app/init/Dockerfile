FROM curlimages/curl:latest

COPY download.sh /download.sh
RUN chmod +x /download.sh

ENTRYPOINT ["/download.sh"]

