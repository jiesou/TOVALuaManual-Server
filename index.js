const express = require('express');
const makeResponse = require('./units/makeResponse.js');
const db = require('./adapter/db.js');
const {encryptMD5} = require("./units/user/encrypter");
const {default: fetch} = require("node-fetch-cjs");

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

// 声明 class
// const Post = new db('Post');
// const Comment = new db('Comment');
// const User = new db('mUser');
// setTimeout(async () => {
//     // 先获取总页数
//     let res = await fetch('https://lua.yswy.top/index/api/manuallist?page=1');
//     let allPage = await res.json();
//     allPage = allPage.per_page
//     console.log('allPages', allPage);
//
//     console.log('Task started');
//
//     // ceil 向上取整
//     let taskPage = Math.ceil(allPage / 3);
//     // 把所有页分三份，三个任务
//     for (let task = 0; task < 3; task++) {
//         // 遍历每一页
//         let taskEndPage = (task + 1) * taskPage;
//         if (taskEndPage > allPage) {
//             taskEndPage = allPage;
//         }
//         await finishTask(task * taskPage, taskEndPage);
//     }
//     console.log('Task finished');
// }, 1000)
//
// async function finishTask(pageStart, pageEnd) {
//     return new Promise(resolve => {
//         // 初始化已完成页数
//         let finishedPage = 0;
//         let allPage = pageEnd - pageStart + 1;
//         for (let page = pageStart; page <= pageEnd; page++) {
//             console.log('pageStart', page)
//             // 拼接 API 链接并在线程中发出请求
//             mFetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
//                 // 初始化所有帖子对象的数组
//                 let posts = []
//
//                 // 遍历每一个帖子(手册项目)
//                 for (let i = 0; i < res.length; i++) {
//                     let data = res[i];
//                     console.log(`page ${page} itemStart`, i);
//                     posts.push({
//                         // id 过滤器，防止文章重复
//                         id: String(data.manual_id),
//                     }, await postDataToObj(data));
//                     console.log(`page ${page} itemEnd`, i);
//                 }
//                 console.log('pageEnd', page)
//                 // 保存该页全部到数据库
//                 await Post.updateAll(posts);
//                 finishedPage++;
//                 console.log(`Task${pageStart} ${finishedPage} / ${allPage}`);
//                 // 如果全部页面完成
//                 if (finishedPage >= allPage) {
//                     console.log('Task finished');
//                     resolve();
//                 }
//             });
//         }
//     });
// }
//
// async function mFetch(url) {
//     return new Promise(resolve => {
//         fetch(url).then(async res => {
//             res = await res.json();
//             resolve(res.data);
//         }).catch(async error => {
//             // 失败自动重试
//             console.log('sendAsyncFetch ERROR', error);
//             await setTimeout(async () => {
//                 resolve(await mFetch(url));
//             }, 1000);
//         });
//     });
// }
//
// /**
//  *
//  * @param data 帖子
//  * @param data.manual_id id
//  * @param data.manual_name 标题
//  * @param data.type_id 类型 id
//  * @param data.manual_time_add 添加时间
//  * @param data.manual_time 编辑时间
//  * @param data.manual_source 来源
//  * @param data.user_id 作者 id
//  * @param data.user_name 作者名称
//  * @param data.user_portrait 作者头像
//  * @param data.manual_content 内容
//  * @param data.manual_fav 收藏数
//  * @param data.manual_up 赞数
//  * @param data.manual_down 踩数
//  * @param data.manual_hits 点击数
//  * @returns {Promise<*>}
//  */
// async function postDataToObj(data) {
//     // 获取完整内容
//     let resContent = await mFetch(`https://lua.yswy.top/index/api/manualdata?manual_id=${data.manual_id}`);
//
//     // 获取评论
//     let resComments = await mFetch(`https://lua.yswy.top/index/api/commentlist?page=1&manual_id=${data.manual_id}`);
//     let comments = [];
//     // 遍历每一条评论
//     resComments.forEach(comment => {
//         /**
//          * @property comment_id 评论 id
//          * @property comment_content 评论内容
//          * @property comment_time 评论时间
//          */
//         comments.push({
//             // id 过滤器，防止评论重复
//             id: String(comment.comment_id),
//         }, {
//             id: String(comment.comment_id),
//             timeCreate: new Date(comment.comment_time.replace(/[年月日]/g, '.')).getTime(),
//             content: comment.comment_content,
//             user: {
//                 id: comment.user_id,
//                 name: comment.user_name,
//                 avatar: comment.user_portrait
//             },
//         });
//     })
//     await Comment.updateAll(comments);
//
//     await createUser(data.user_id, data.user_name, data.user_portrait);
//     // 对 post 对象赋值
//     return {
//         id: String(data.manual_id),
//         title: data.manual_name,
//         category: data.type_id,
//         timeCreate: new Date(data.manual_time_add).getTime(),
//         timeEdit: new Date(data.manual_time).getTime(),
//         source: data.manual_source,
//         favorites: data.manual_fav || 0,
//         userId: data.user_id,
//         user: undefined,
//         content: resContent.manual_content,
//         description: resContent.manual_content.replace(/\s/g, ' ').substring(0, 300),
//         reaction: {
//             like: data.manual_up,
//             dislike: data.manual_down
//         },
//         views: data.manual_hits,
//         commentsLength: comments.length,
//     }
// }
//
// async function createUser(id, name, avatar) {
//     if (avatar) {
//         let user = {
//             id: encryptMD5(avatar).substr(0, 8),
//             nick: name,
//             avatar: `https://${avatar.substr(avatar.indexOf('/') + 2)}`,
//             email: null
//         }
//         // 例如 http://thirdqq.qlogo.cn/g?b=oidb&k=ia6f58HrHtRZT4L0pr87Bkw&s=100&t=1649663719
//         // 转 https
//         await User.update({id: user.id}, user, true);
//     }
// }


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
