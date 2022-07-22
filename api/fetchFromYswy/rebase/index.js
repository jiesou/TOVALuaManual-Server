import fetch from 'node-fetch';
import AV from 'leancloud-storage';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
//AV.debug.enable();  // 启用调试

async function sendAsyncFetch(url) {
    let json
    try {
        let res = await fetch(url);
        json = await res.json();
    } catch (error) {
        // 失败自动重试
        console.log('sendAsyncFetch ERROR', error);
        return await sendAsyncFetch(url);
    }
    //console.log('sendAsyncFetch', json);
    return json.data;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default async function handler(request, response) {
    // 先获取总页数
    let res = await fetch('https://lua.yswy.top/index/api/manuallist?page=1');
    let allPage = await res.json();
    allPage = allPage.per_page

    // 声明 class
    var Item = AV.Object.extend('Item');

    // 构建线程任务表
    let task = 0;
    console.log('Task Started');
    // 遍历每一页
    for (let page = 1; page >= allPage; page++) {
        // 究极线程管理
        // await sleep(1500 * page);
        console.log('pageStart', page)
        // 拼接 API 链接并在线程中发出请求
        fetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
            res = await res.json()
            res = res.data;
            // 遍历每一个帖子(手册项目)
            for (let i = 0; i < res.length; i++) {
                // 获取帖子信息
                let resItem = res[i];
                // 检查帖子是否已在数据库中
                let item = await new AV.Query('Item')
                    .equalTo('id', resItem.manual_id)
                    .first();
                if (!item) {
                    console.log('page'+ page + ' itemStart' + i);
                    // 构建新对象
                    item = new Item();
                    // 对 item 对象赋值
                    item.set('id', resItem.manual_id);
                    item.set('title', resItem.manual_name);
                    item.set('category', resItem.type_id);
                    item.set('timeCreate', new Date(resItem.manual_time_add).getTime());
                    item.set('timeEdit', new Date(resItem.manual_time).getTime());
                    item.set('source', resItem.manual_source);
                    item.set('user', {
                        id: resItem.user_id,
                        name: resItem.user_name,
                        avatar: resItem.user_portrait
                    });
                    let content = resItem.manual_content;
                    // 获取完整内容
                    let resContent = await sendAsyncFetch(`https://lua.yswy.top/index/api/manualdata?manual_id=${resItem.manual_id}`);
                    item.set('favs', resContent.manual_fav);
                    item.set('content', resContent.manual_content);
                    item.set('description', content.replace(/\s/g, ' ').substring(0, 300));
                    item.set('reaction', {
                        like: resItem.manual_up,
                        dislike: resItem.manual_down
                    });
                    item.set('views', resItem.manual_hits);
                    // 获取评论
                    let resComments = await sendAsyncFetch(`https://lua.yswy.top/index/api/commentlist?page=1&manual_id=${resItem.manual_id}`);
                    // 遍历每一条评论
                    let comments = [];
                    for (let i = 0; i < resComments.length; i++) {
                        let comment = resComments[i];
                        comments.push({
                            id: comment.comment_id,
                            timeCreate: new Date(comment.comment_time).getTime(),
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
                    // 将对象保存到数据库
                    await item.save();
                }
                console.log('page' + page + ' itemEnd' + i);
            }
            console.log('pageEnd', page)
            // 任务标为完成
            task++;
            // 检查是否所有任务都完成
            console.log("Task " + task + " / " + allPage);
            if (task >= allPage) {
                response.send('ok');
            }
        });
    }
}


