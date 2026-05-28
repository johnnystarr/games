FROM nginx:stable-alpine-slim

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY xiangqi/public/svgs/red-wooden-piece-bg.svg /usr/share/nginx/html/assets/
COPY xiangqi/public/svgs/cn-red-horse-dark.svg /usr/share/nginx/html/assets/
COPY lib/cards/assets/xcards/svg/ /usr/share/nginx/html/assets/cards/
COPY xiangqi/dist/xiangqi.html /usr/share/nginx/html/xiangqi.html
COPY freecell/dist/freecell.html /usr/share/nginx/html/freecell.html

EXPOSE 3000