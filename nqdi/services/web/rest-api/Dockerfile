FROM golang:1.24.3

WORKDIR /app

COPY go.mod go.sum /app
RUN go mod download


COPY adapters /app/adapters
COPY core /app/core
COPY secrets /app/secrets
COPY *.go /app

RUN ls -lRt /app

RUN CGO_ENABLED=0 GOOS=linux go build -o /rest-api

EXPOSE 80

CMD ["/rest-api"]

## docker build --tag inbrewj/nqdi-rest-api:0.0.6 .

## docker push inbrewj/nqdi-rest-api:0.0.6
