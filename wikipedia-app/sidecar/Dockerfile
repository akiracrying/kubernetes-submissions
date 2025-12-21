FROM alpine:latest

RUN apk add --no-cache curl

COPY update.sh /update.sh
RUN chmod +x /update.sh

ENTRYPOINT ["/bin/sh", "/update.sh"]

