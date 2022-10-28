FROM node:16-alpine
EXPOSE 4200
ENV NODE_ENV production

USER node
WORKDIR /home/node

COPY --chown=node:node ./dist/web ./web
COPY --chown=node:node ./dist/server ./server

CMD ["node", "server/main.js"]
