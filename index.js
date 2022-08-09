const express = require('express');
const makeResponse = require('./units/makeResponse.js');
const db = require('./adapter/db.js');
const {encryptMD5} = require("./units/user/encrypter");
const {add} = require("nodemon/lib/rules");

require('dotenv').config()
db.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
})

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

// let Post = new db('Post');
// let User = new db('mUser');
// let Comment = new db('Comment');
//
// async function addUser(user) {
//     let avatar = user.avatar;
//     if (avatar) {
//         // 例如 http://thirdqq.qlogo.cn/g?b=oidb&k=ia6f58HrHtRZT4L0pr87Bkw&s=100&t=1649663719
//         // 转 https
//         user.avatar = `https://${avatar.substr(avatar.indexOf('/') + 2)}`;
//         user.nick = user.name;
//         user.name = undefined;
//         user.id = encryptMD5(avatar + new Date().getTime()).substr(0, 8);
//         await User.update({id: user.id}, user);
//     } else {
//         console.log('no avatar');
//     }
// }
//
// Post.query({}, {
//     limit: 10,
//     descending: 'timeCreate',
// }).then(async (posts) => {
//     for (let post of posts) {
//         await addUser(await post.get('user'));
//         post.favorites = post.favorites || post.favs;
//         post.commentsLength = post.get('comments').length;
//         post.comments = undefined;
//         post.userId = post.get('user').id;
//         post.user = undefined;
//         let comments = post.get('comments').data;
//         for (let comment of comments) {
//             await addUser(comment.user);
//             comment.userId = comment.get('user').id;
//             comment.post = post.id;
//             await Comment.update({id: comment.id}, comment);
//             console.log(comment);
//         }
//         await Post.update({id: post.id}, post);
//     }
// });


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
