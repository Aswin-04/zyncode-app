FROM frolvlad/alpine-gxx:latest 

WORKDIR /app

CMD ["/bin/sh", "-c", "g++ -o main main.cpp 2> error.txt && ./main < input.txt > output.txt 2>>error.txt" ]
