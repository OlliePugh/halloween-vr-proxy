FROM nginx
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./content/ /usr/share/nginx/html/