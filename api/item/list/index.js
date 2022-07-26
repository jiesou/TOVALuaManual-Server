import ReqParameterParser from '../../units/reqParamsParser.js';
import makeResponse from '../../units/makeResponse.js';
import AV from 'leancloud-storage';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
//AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    let reqBody = new ReqParameterParser(request);
    // 获取页数和长度
    let page = ~~reqBody.page | 0;
    if (page < 0) {
        page = 0;
    }
    let pageLength = ~~reqBody.pageLength | 10;
    if (pageLength < 1) {
        pageLength = 1;
    } else if (pageLength > 50) {
        pageLength = 50;
    }
    // 查询
    let items = new AV.Query('Item');
    makeResponse(response, 0, 'Success.', {
        'cucrrentPage': page,
        'totalPage': ~~(await items.count() / pageLength),
        'items': await items
            // 不需要某些属性
            .select(['-content', '-comments.data'])
            // 按 timeCreate 倒序
            .descending('timeCreate')
            .skip(page * pageLength)
            .limit(pageLength).find(),
    });
}
