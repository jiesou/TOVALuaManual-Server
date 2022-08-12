const express = require('express');
const makeResponse = require('./units/makeResponse.js');
const db = require('./adapter/db.js');
const {encryptMD5} = require("./units/user/encrypter");
const {default: fetch} = require("node-fetch-cjs");

db.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
})

const app = express();

app.get('/', (request, response) => {
    makeResponse(response, 0, 'Hello, world!');
})
app.use('/api', require('./api'));
app.use(function (request, response) {
    // 如果没有路由回答就返回 404
    makeResponse(response, -41, 'Not Found.');
});

module.exports = app;
// 本地调试用
let port = process.env.PORT || 3000;
app.listen(port, function () {
    console.debug('Server listening on port', port);
});
