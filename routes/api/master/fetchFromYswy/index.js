const router = require('express').Router();
const db = require('../../../../adapter/leancloud.js');
const {default: fetch} = require("node-fetch-cjs");
const makeResponse = require('../../../../units/makeResponse.js');

// 声明 class
const Post = new db('Post');

async function createPost(data) {
    await Post.update({
        id: String(data.manual_id),
    }, await postDataToObj(data));
}

router.get('/', (request, response) => {
    // 只处理第一页
    fetch('https://lua.yswy.top/index/api/manuallist?page=1').then(async res => {
        res = await res.json()
        res = res.data;

        // 遍历前十个帖子(手册项目)
        let finishedItems = 0;
        for (let i = 0; i < 10; i++) {
            // 多线程 10 条帖子并发
            createPost(res[i]).then(() => {
                finishedItems++;
                if (finishedItems >= 10) {
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

    // 初始化已完成页数
    let finishedPage = 0;

    console.log('Task started');

    // 遍历每一页
    for (let page = 1; page <= allPage; page++) {
        console.log('pageStart', page)

        // 拼接 API 链接并在线程中发出请求
        fetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
            res = await res.json()
            res = res.data;
            // 初始化所有帖子对象的数组
            let posts = []

            // 遍历每一个帖子(手册项目)
            for (let i = 0; i < res.length; i++) {
                let data = res[i];
                console.log(`page ${page} itemStart`, i);
                posts.push({
                    id: String(data.manual_id),
                }, await postDataToObj(data));
                console.log(`page ${page} itemEnd`, i);
            }
            console.log('pageEnd', page)
            // 保存该页全部到数据库
            await Post.updateAll(posts);
            finishedPage++;
            console.log(`Task ${finishedPage} / ${allPage}`);
            // 如果全部页面完成
            if (finishedPage >= allPage) {
                console.log('Task finished');
                return makeResponse(response, 0, 'Success.')
            }
        });
    }
});


async function mFetch(url) {
    try {
        let res = await fetch(url);
        let json = await res.json();
        return json.data;
    } catch (error) {
        // 失败自动重试
        console.log('sendAsyncFetch ERROR', error);
        return await mFetch(url);
    }
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
async function postDataToObj(data) {
    // 获取完整内容
    let resContent = await mFetch(`https://lua.yswy.top/index/api/manualdata?manual_id=${data.manual_id}`);

    // 获取评论
    let resComments = await mFetch(`https://lua.yswy.top/index/api/commentlist?page=1&manual_id=${data.manual_id}`);
    let comments = [];
    // 遍历每一条评论
    resComments.forEach(comment => {
        /**
         * @property comment_id 评论 id
         * @property comment_content 评论内容
         * @property comment_time 评论时间
         */
        comments.push({
            id: String(comment.comment_id),
            timeCreate: new Date(comment.comment_time.replace(/[年月日]/g, '.')).getTime(),
            content: comment.comment_content,
            user: {
                id: comment.user_id,
                name: comment.user_name,
                avatar: comment.user_portrait
            },
        });
    })

    // 对 post 对象赋值
    return {
        id: String(data.manual_id),
        title: data.manual_name,
        category: data.type_id,
        timeCreate: new Date(data.manual_time_add).getTime(),
        timeEdit: new Date(data.manual_time).getTime(),
        source: data.manual_source,
        user: {
            id: data.user_id,
            name: data.user_name,
            avatar: data.user_portrait
        },
        favorites: resContent.manual_fav,
        content: resContent.manual_content,
        description: resContent.manual_content.replace(/\s/g, ' ').substring(0, 300),
        reaction: {
            like: data.manual_up,
            dislike: data.manual_down
        },
        views: data.manual_hits,
        comments: {
            length: comments.length,
            data: comments
        }
    }
}

module.exports = router;
