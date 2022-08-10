const router = require('express').Router();
const db = require('../../adapter/db.js');
const {default: fetch} = require("node-fetch-cjs");
const makeResponse = require('../../units/makeResponse.js');
const {encryptMD5} = require("../../units/user/encrypter");

// 声明 class
const Post = new db('Post');
const Comment = new db('Comment');
const User = new db('mUser');

async function createPost(data) {
    await Post.update({
        id: String(data.manual_id),
    }, await parserPostData(data));
}

router.get('/', (request, response) => {
    // 只处理第一页
    fetch('https://lua.yswy.top/index/api/manuallist?page=1').then(async res => {
        res = await res.json()
        res = res.data;

        console.log(`all posts ${res.length}`);

        // 遍历前五个帖子(手册项目)
        let finishedPosts = 0;
        let todoPosts = 5;
        for (let i = 0; i < todoPosts; i++) {
            // 多线程并发
            createPost(res[i]).then(() => {
                console.log(`post ${i} finished`);
                finishedPosts++;
                if (finishedPosts >= todoPosts) {
                    makeResponse(response, 0, 'Success.')
                }
            });
        }
    });
});

router.get('/all', async (request, response) => {
    // 先获取总页数
    let res = await fetch('https://lua.yswy.top/index/api/manuallist?page=1');
    let allPage = await res.json();
    allPage = allPage.per_page
    console.log('allPages', allPage);

    console.log('Task started');

    // ceil 向上取整
    let taskPage = Math.ceil(allPage / 3);
    // 把所有页分三份，三个任务
    for (let task = 0; task < 3; task++) {
        // 遍历每一页
        let taskEndPage = (task + 1) * taskPage;
        if (taskEndPage > allPage) {
            taskEndPage = allPage;
        }
        await finishTask(task * taskPage, taskEndPage);
    }
    makeResponse(response, 0, 'Success.')
});

async function finishTask(pageStart, pageEnd) {
    return new Promise(resolve => {
        // 初始化已完成页数
        let finishedPage = 0;
        let allPage = pageEnd - pageStart + 1;
        for (let page = pageStart; page <= pageEnd; page++) {
            console.log('pageStart', page)
            // 拼接 API 链接并在线程中发出请求
            mFetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
                // 初始化所有帖子对象的数组
                let posts = []

                // 遍历每一个帖子(手册项目)
                for (let i = 0; i < res.length; i++) {
                    let data = res[i];
                    console.log(`page ${page} itemStart`, i);
                    posts.push({
                        // id 过滤器，防止文章重复
                        id: String(data.manual_id),
                    }, await parserPostData(data));
                    console.log(`page ${page} itemEnd`, i);
                }
                console.log('pageEnd', page)
                // 保存该页全部到数据库
                await Post.updateAll(posts);
                finishedPage++;
                console.log(`Task${pageStart} ${finishedPage} / ${allPage}`);
                // 如果全部页面完成
                if (finishedPage >= allPage) {
                    console.log('Task finished');
                    resolve();
                }
            });
        }
    });

}


async function mFetch(url) {
    return new Promise(resolve => {
        fetch(url).then(async res => {
            res = await res.json();
            resolve(res.data);
        }).catch(async error => {
            // 失败自动重试
            console.log('sendAsyncFetch ERROR', error);
            await setTimeout(async () => {
                resolve(await mFetch(url));
            }, 500);
        });
    });
}

/**
 *
 * @param data 帖子
 * @param data.manual_id id
 * @param data.manual_name 标题
 * @param data.type_id 类型 id
 * @param data.manual_time_add 添加时间
 * @param data.manual_time 编辑时间
 * @param data.manual_source 来源
 * @param data.user_id 作者 id
 * @param data.user_name 作者名称
 * @param data.user_portrait 作者头像
 * @param data.manual_content 内容
 * @param data.manual_fav 收藏数
 * @param data.manual_up 赞数
 * @param data.manual_down 踩数
 * @param data.manual_hits 点击数
 * @returns {Promise<*>}
 */
async function parserPostData(data) {
    return new Promise(resolve => {
        let finishedTaskData = [];
        // 获取完整内容
        mFetch(`https://lua.yswy.top/index/api/manualdata?manual_id=${data.manual_id}`).then(res => {
            finishedTaskData.content = res;
            let post = generatePost(finishedTaskData, data);
            if (post) {
                resolve(post);
            }
        });

        // 获取评论
        mFetch(`https://lua.yswy.top/index/api/commentlist?page=1&manual_id=${data.manual_id}`).then(async res => {
            let finishedComment = 0;
            let todoComment = res.length;

            let comments = [];
            // 遍历每一条评论
            for (const comment of res) {
                /**
                 * @property comment_id 评论 id
                 * @property comment_content 评论内容
                 * @property comment_time 评论时间
                 */
                comments.push({
                    // id 过滤器，防止评论重复
                    id: String(comment.comment_id),
                }, {
                    id: String(comment.comment_id),
                    timeCreate: new Date(comment.comment_time.replace(/[年月日]/g, '.')).getTime(),
                    content: comment.comment_content,
                    userId: comment.user_id,
                });
                createUser(comment.user_id, comment.user_name, comment.user_portrait).then(() => {
                    finishedComment++;
                    console.log(`Comment createUser ${finishedComment} / ${todoComment}`);
                    if (finishedComment >= todoComment) {
                        finishedTaskData.commentsLength = todoComment;
                        let post = generatePost(finishedTaskData, data);
                        if (post) {
                            resolve(post);
                        }
                    }
                });
            }
            await Comment.updateAll(comments);
            finishedTaskData.commentsLength = res.length;
            let post = generatePost(finishedTaskData, data);
            if (post) {
                resolve(post);
            }
        });


        createUser(data.user_id, data.user_name, data.user_portrait).then(() => {
            finishedTaskData.user = true;
            let post = generatePost(finishedTaskData, data)
            if (post) {
                resolve(post);
            }
        });

    });
}

function generatePost(taskData, data) {
    console.log('generatePost', Object.keys(taskData).length)
    if (Object.keys(taskData).length >= 3) {
        return {
            id: String(data.manual_id),
            title: data.manual_name,
            category: data.type_id,
            timeCreate: new Date(data.manual_time_add).getTime(),
            timeEdit: new Date(data.manual_time).getTime(),
            source: data.manual_source,
            favorites: data.manual_fav || 0,
            userId: data.user_id,
            user: undefined,
            content: taskData.content.manual_content,
            description: taskData.content.manual_content.replace(/\s/g, ' ').substring(0, 300),
            reaction: {
                like: data.manual_up,
                dislike: data.manual_down
            },
            views: data.manual_hits,
            commentsLength: taskData.commentsLength,
        }
    }
}

async function createUser(id, name, avatar) {
    if (avatar) {
        let user = {
            id: encryptMD5(avatar).substr(0, 8),
            nick: name,
            avatar: `https://${avatar.substr(avatar.indexOf('/') + 2)}`,
            email: null
        }
        // 例如 http://thirdqq.qlogo.cn/g?b=oidb&k=ia6f58HrHtRZT4L0pr87Bkw&s=100&t=1649663719
        // 转 https
        await User.update({id: user.id}, user, true);
    }
}

module.exports = router;
