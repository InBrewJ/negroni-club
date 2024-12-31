FROM golang:1.23.3

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download


COPY adapters ./adapters
COPY core ./core
COPY secrets ./secrets
COPY *.go ./

RUN ls -lRt /app

RUN GOPATH=/app CGO_ENABLED=0 GOOS=linux go build -o /rest-api

EXPOSE 80

CMD ["/rest-api"]

## docker build --tag inbrewj/nqdi-rest-api:0.0.1 .

## docker push inbrewj/nqdi-rest-api:0.0.1
