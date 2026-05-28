FROM nginx:stable-alpine-slim

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY xiangqi/dist/xiangqi.html /usr/share/nginx/html/xiangqi.html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]