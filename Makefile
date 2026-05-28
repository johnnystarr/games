IMAGE_NAME ?= games
PORT ?= 3000

.PHONY: build-xiangqi build-freecell build-games docker-build docker-run up

build-xiangqi:
	npm --prefix xiangqi run build

build-freecell:
	npm --prefix freecell run build

build-games: build-xiangqi build-freecell

docker-build: build-games
	docker build -t $(IMAGE_NAME) .

docker-run: docker-build
	docker run --rm -p $(PORT):3000 $(IMAGE_NAME)

up: build-games docker-build docker-run