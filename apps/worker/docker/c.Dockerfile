FROM frolvlad/alpine-gcc:latest

WORKDIR /app

CMD ["/bin/sh", "-c", "gcc -o main main.c 2> error.txt && timeout 5s ./main < input.txt > output.txt 2>> error.txt"]

