# Stage 1 - the build process
FROM node:16 as build-deps

ARG CONTRACT_NUMBER
ARG API_URL

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn
COPY . ./
RUN REACT_APP_CONTRACT_NUMBER=${CONTRACT_NUMBER} REACT_APP_API_URL=${API_URL} yarn build

# Stage 2 - the production environment
FROM nginx:alpine
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
