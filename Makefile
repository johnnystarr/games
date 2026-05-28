IMAGE_NAME ?= games
PORT ?= 3000

.PHONY: build-xiangqi docker-build docker-run

build-xiangqi:
	npm --prefix xiangqi run build

docker-build: build-xiangqi
	docker build -t $(IMAGE_NAME) .

docker-run: docker-build
	docker run --rm -p $(PORT):3000 $(IMAGE_NAME)