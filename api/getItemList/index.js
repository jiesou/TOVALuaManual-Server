import ReqBodyParser from '../units/reqBodyParser.js';
import sendResponse from '../units/sendResponse.js';
import AV from 'leancloud-storage';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    let reqBody = new ReqBodyParser(request);
    // 获取页面数和长度
    let pageLength = Math.abs(~~reqBody.pageLength) || 10;
    let page = Math.abs(~~reqBody.page) || 0;
    // 查询
    let query = await new AV.Query('Item')
        // 不需要某些属性
        .select(['content', '-comments.d'])
        // 按 timeCreate 降序排列
        .descending('timeCreate')
        .skip(page * pageLength)
        .limit(pageLength).find();
    return sendResponse(response, 0, 'Success', query);
}
