FROM node:20-alpine

WORKDIR /app 

CMD [ "/bin/sh", "-c", "node main.js < input.txt > output.txt 2> error.txt" ]