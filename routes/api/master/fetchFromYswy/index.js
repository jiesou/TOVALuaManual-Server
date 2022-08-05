const router = require('express').Router();
const AV = require('leancloud-storage');
const {default: fetch} = require("node-fetch-cjs");
const makeResponse = require('../../../../units/makeResponse.js');

// 声明 class
const Item = AV.Object.extend('Item');


async function createItem(data) {
    // 检查帖子是否已在数据库中
    console.log('createItem');
    let item = await new AV.Query('Item')
        .equalTo('id', String(data.manual_id))
        .first();
    if (!item) {
        item = new Item();
    }
    item = await itemDataToObj(data, item);
    await item.save()
}
router.get('/', (request, response) => {
    // 只处理第一页
    fetch('https://lua.yswy.top/index/api/manuallist?page=1').then(async res => {
        res = await res.json()
        res = res.data;

        // 遍历前十个帖子(手册项目)
        let finishedItems = 0;
        for (let i = 0; i < 10; i++) {
            createItem(res[i]).then(() => {
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
            let items = []

            // 遍历每一个帖子(手册项目)
            for (let i = 0; i < res.length; i++) {
                let data = res[i]
                // 检查帖子是否已在数据库中
                let item = await new AV.Query('Item')
                    .equalTo('id', String(data.manual_id))
                    .first();
                if (!item) {
                    console.log(`page ${page} itemStart`, i);
                    // 构建新对象
                    item = new Item();
                    item = await itemDataToObj(data, item);
                    items.push(item);
                    console.log(`page ${page} itemEnd`, i);
                }
            }
            console.log('pageEnd', page)
            // 保存该页全部到数据库
            await AV.Object.saveAll(items);
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

async function itemDataToObj(data, item) {
    // 对 item 对象赋值
    item.set('id', String(data.manual_id));
    item.set('title', data.manual_name);
    item.set('category', data.type_id);
    item.set('timeCreate', new Date(data.manual_time_add).getTime());
    item.set('timeEdit', new Date(data.manual_time).getTime());
    item.set('source', data.manual_source);
    item.set('user', {
        id: data.user_id,
        name: data.user_name,
        avatar: data.user_portrait
    });
    let content = data.manual_content;
    // 获取完整内容
    let resContent = await mFetch(`https://lua.yswy.top/index/api/manualdata?manual_id=${data.manual_id}`);
    item.set('favs', resContent.manual_fav);
    item.set('content', resContent.manual_content);
    item.set('description', content.replace(/\s/g, ' ').substring(0, 300));
    item.set('reaction', {
        like: data.manual_up,
        dislike: data.manual_down
    });
    item.set('views', data.manual_hits);
    // 获取评论
    let resComments = await mFetch(`https://lua.yswy.top/index/api/commentlist?page=1&manual_id=${data.manual_id}`);
    // 遍历每一条评论
    let comments = [];
    for (let i = 0; i < resComments.length; i++) {
        let comment = resComments[i];
        comments.push({
            id: comment.comment_id,
            timeCreate: new Date(comment.comment_time.replace(/[年月日]/g, '.')).getTime(),
            content: comment.comment_content,
            user: {
                id: comment.user_id,
                name: comment.user_name,
                avatar: comment.user_portrait
            },
        });
    }
    item.set('comments', {
        length: comments.length,
        data: comments
    });
    return item
}

module.exports = router;
