import ReqBodyParser from '../units/reqBodyParser.js';
import AV from 'leancloud-storage';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    let reqBody = new ReqBodyParser(request);
    // 构建查询
    let query = new AV.Query('Item')
        // 只需要评论长度
        .select(['id', 'title', 'category', 'time' ,'user','source', 'content', 'reaction', 'comments.length']);
    response.send(reqBody);
}
