const express = require('express');
const makeResponse = require('./units/makeResponse.js');
const AV = require('leancloud-storage');

require('dotenv').config()
AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});

// new AV.Query('Item').limit(1000).find().then(async (oldItems) => {
//     let items = [];
//     let n = 0;
//     for (let post of oldItems) {
//         let oldAvatar = post.get('user').avatar;
//         console.log(oldAvatar);
//         if (oldAvatar) {
//             let newAvatar = `https://${oldAvatar.substr(oldAvatar.indexOf('/') + 2)}`
//             post.set("user.avatar", newAvatar);
//             console.log(newAvatar);
//             items.push(post);
//         }
//         n++;
//     }
//     console.log(n);
//     await AV.Object.saveAll(items)
//     console.log('done');
// })


const app = express();

app.get('/', (request, response) => {
    makeResponse(response, 0, 'Hello, world!');
})
app.use('/api', require('./routes/api'));
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
