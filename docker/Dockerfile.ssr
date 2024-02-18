FROM node:20-alpine
EXPOSE 4200
ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --chown=node:node ./dist/web ./app

CMD ["node", "app/server/main.js"]
