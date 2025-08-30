FROM python:3.12-alpine

WORKDIR /app 

CMD ["/bin/sh", "-c", "python3 -u main.py < input.txt > output.txt 2> error.txt"]