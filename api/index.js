var express = require('express');
var makeResponse = require('../units/makeResponse.js');

var app = express()

app.get('/', (request, response) => {
  makeResponse(response, 0, 'Hello, world!');
})

module.exports = app;