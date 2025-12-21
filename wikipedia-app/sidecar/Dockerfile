FROM curlimages/curl:latest

COPY update.sh /update.sh
RUN chmod +x /update.sh

ENTRYPOINT ["/update.sh"]

