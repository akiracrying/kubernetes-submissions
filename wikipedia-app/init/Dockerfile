FROM alpine:latest

RUN apk add --no-cache curl bash

COPY download.sh /download.sh
RUN chmod +x /download.sh

ENTRYPOINT ["/download.sh"]

