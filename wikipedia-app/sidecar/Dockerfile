FROM alpine:latest

RUN apk add --no-cache curl

COPY update.sh /update.sh
RUN sed -i 's/\r$//' /update.sh && chmod +x /update.sh

ENTRYPOINT ["/bin/sh", "/update.sh"]

