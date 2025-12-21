FROM alpine:latest

RUN apk add --no-cache curl

COPY download.sh /download.sh
RUN chmod +x /download.sh

ENTRYPOINT ["/bin/sh", "/download.sh"]

