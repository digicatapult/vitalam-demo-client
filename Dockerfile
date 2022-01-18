ARG NODE_VERSION=16.13.2-alpine
FROM node:$NODE_VERSION AS build

ARG REACT_APP_VITALAM_DEMO_PERSONA
ARG REACT_APP_API_HOST
ARG REACT_APP_API_PORT
ARG REACT_APP_SUBSTRATE_HOST
ARG REACT_APP_SUBSTRATE_PORT
ARG REACT_APP_AUTH_CLIENT_ID
ARG REACT_APP_AUTH_CLIENT_SECRET

WORKDIR /vitalam-demo-client

# Install base dependencies
COPY . .
RUN npm ci --production

# RUN Build
RUN npm run build

##################################################################################################

FROM node:$NODE_VERSION AS runtime
WORKDIR /vitalam-demo-client
ENV PORT 3000

COPY --from=build /vitalam-demo-client/build .

RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "/vitalam-demo-client"]
