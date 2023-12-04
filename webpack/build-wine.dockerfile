FROM electronuserland/builder:wine

COPY /package.json /project/package.json
COPY /package-lock.json /project/package-lock.json
RUN npm i

COPY / /project
