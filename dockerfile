FROM node:20-alpine
COPY ./Backend .
RUN npm install
CMD ["node", "server.js"] 
# docker build -t backend is not supported in my desktop
# here bakcend is the name of the image and we can run it using docker run backend


# Breaking down docker run -p 4000:3000 backend
# 4000 (left side) = the port on your actual machine (or EC2 instance) that you'll use to access the app from outside
# 3000 (right side) = the port your app is listening on inside the container (e.g. your Express server has app.listen(3000))
# backend = the image name you built earlier with docker build -t backend .



# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY ./frontend .
RUN npm install
RUN npm run build   # produces a /app/dist folder

# ---- Stage 2: Final (production) ----
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./public   # only copy the built output
COPY ./backend .
RUN npm install --production
CMD ["node", "server.js"]