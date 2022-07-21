import fetch from 'node-fetch';
import AV from 'leancloud-storage';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    // 先获取总页数
    let res = await fetch('https://api.yswy.com/api/v1/news/list?page=1');
    let allPage = await res.json();
    allPage = allPage.per_page

    // 声明 class
    var Item = AV.Object.extend('Item');

    // 遍历每一页
    for (let page = 1; page <= allPage; page++) {
        console.log('pageStart', page)
        // 拼接 API 链接并发出请求
        await fetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
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
                    // 构建新对象
                    item = new Item();
                }
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
                item.set('content', content);
                item.set('description', content.replace(/\s/g, ' ').substring(0, 300));
                item.set('reaction', {
                    like: resItem.manual_up,
                    dislike: resItem.manual_down
                });
                item.set('views', resItem.manual_hits);
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
                item.set('comments', {
                    length: comments.length,
                    data: comments
                });
                // 将对象保存到数据库
                await item.save();
            }
            console.log('pageEnd', page)
        });
    }
    response.send('ok');
}


