FROM node:16

# install dependencies first, in a different location for easier app bind mounting for local development
# due to default /opt permissions we have to create the dir with root and change perms
RUN mkdir /opt/node_app && chown node:node /opt/node_app
WORKDIR /opt/node_app
# the official node image provides an unprivileged user as a security best practice
# but we have to manually enable it. We put it here so npm installs dependencies as the same
# user who runs the app. 
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
USER node
COPY package.json package-lock.json* ./
RUN npm install --no-optional && npm cache clean --force
ENV PATH /opt/node_app/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
WORKDIR /opt/node_app/app
COPY --chown=node:node . .

# Install public dependencies
WORKDIR /opt/node_app/app/public
RUN npm install --no-optional && npm cache clean --force

# Run application
WORKDIR /opt/node_app/app
CMD [ "node", "index.js" ]