FROM alpine:latest

RUN apk add --no-cache curl

COPY download.sh /download.sh
RUN sed -i 's/\r$//' /download.sh && chmod +x /download.sh

ENTRYPOINT ["/bin/sh", "/download.sh"]

