# Build from the repo root: docker build -f apps/server/Dockerfile -t instantdrop-server .
FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/server/package.json apps/server/package.json
RUN npm install --workspace=@instantdrop/server --include-workspace-root

COPY apps/server apps/server

ENV NODE_ENV=production
EXPOSE 4000
WORKDIR /app/apps/server
CMD ["node", "src/index.js"]
