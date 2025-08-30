FROM alpine:latest

RUN apk update && apk add --no-cache openjdk17

WORKDIR /app  

CMD [ "/bin/sh", "-c", "javac Main.java 2> error.txt && java Main < input.txt > output.txt 2>> error.txt" ]


