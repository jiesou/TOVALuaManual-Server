var fetch = require('node-fetch);

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

export default async function itemDataToObj(data, item) {
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