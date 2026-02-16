FROM quay.io/qasimtech/mega-bot:latest

WORKDIR /root/mega-md

RUN git clone https://github.com/Faizan-MD-BOTZ/FAIZAN-XMD . && \
    npm install

EXPOSE 5000

CMD ["npm", "start"]
