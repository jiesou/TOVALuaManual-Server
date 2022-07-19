import fetch from 'node-fetch';
import AV from 'leancloud-storage';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    // 声明 class
    var Item = AV.Object.extend('Item');

    // 遍历每一页
    // 开发调试中限制只请求一页
    for (let page = 1; page <= 1; page++) {
        console.log('pageStart', page)
        // 拼接 API 链接并发出请求
        fetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
            res = await res.json()
            res = res.data;
            // 遍历每一个帖子(手册项目)
            // 开发调试中限制只解析五条
            for (let i = 0; i < 3; i++) {
                // 构建对象
                let item = new Item();
                // 获取帖子信息
                let resItem = res[i];
                // 对 item 对象赋值
                item.set('id', resItem.manual_id);
                item.set('title', resItem.manual_name);
                item.set('category', resItem.type_id);
                item.set('time', {
                    create: new Date(resItem.manual_time_add).getTime(),
                    edit: new Date(resItem.manual_time).getTime()
                });
                item.set('source', resItem.manual_source);
                item.set('user', {
                    id: resItem.user_id,
                    name: resItem.user_name,
                    avatar: resItem.user_portrait
                });
                item.set('content', resItem.manual_content);
                item.set('reaction', {
                    like: resItem.manual_up,
                    dislike: resItem.manual_down
                });
                // 获取评论

                let resComments = await fetch(`https://lua.yswy.top/index/api/commentlist?page=1&manual_id=${resItem.manual_id}`);
                resComments = await resComments.json();
                resComments = resComments.data
                // 遍历每一条评论
                let comments = [];
                for (let i = 0; i < resComments.length; i++) {
                    let comment = resComments[i];
                    comments.push({
                        id: comment.comment_id,
                        time: new Date(comment.comment_time).getTime(),
                        content: comment.comment_content,
                        user: {
                            id: comment.user_id,
                            name: comment.user_name,
                            avatar: comment.user_portrait
                        },
                    });
                }
                item.set('comments', comments);
                // 将对象保存到数据库
                await item.save();

            }
            response.send('ok');
        });
    }
}


