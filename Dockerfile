FROM node:16-alpine
EXPOSE 4200

USER node
WORKDIR /home/node

COPY --chown=node:node ./dist/web ./web
COPY --chown=node:node ./dist/server ./server

EXPOSE 4200

CMD ["node", "server/main.js"]
