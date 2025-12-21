FROM alpine:latest

RUN apk add --no-cache curl bash

COPY update.sh /update.sh
RUN chmod +x /update.sh

ENTRYPOINT ["/update.sh"]

