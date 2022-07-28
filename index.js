var express = require('express');
var makeResponse = require('./units/makeResponse.js');
var AV = require('leancloud-storage');

AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
});

var app = express()

app.get('/', (request, response) => {
  makeResponse(response, 0, 'Hello, world!');
})
app.use('/api', require('./routes/api'));
app.use(function (request, response) {
  // 如果没有路由回答就返回 404
  makeResponse(response, -21, 'Not Found');
});

module.exports = app;
// 本地调试用
let port = process.env.PORT || 3000;
app.listen(port, function () {
  console.debug('Server listening on port', port);
});
