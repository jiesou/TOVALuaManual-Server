var router = require('express').Router();
var AV = require('leancloud-storage');
var makeResponse = require('../units/makeResponse.js');
var reqParamsParser = require('../units/reqParamsParser.js');

router.get('/list', async (request, response) => {
    let reqBody = reqParamsParser(request);
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
    let posts = new AV.Query('Post');
    makeResponse(response, 0, 'Success.', {
        'cucrrentPage': page,
        'totalPage': ~~(await posts.count() / pageLength),
        // 不需要某些属性
        // 按 timeCreate 倒序
        'posts': await posts
            .select(['-content', '-comments.data', '-objectId', '-createdAt', '-updatedAt'])
            .descending('timeCreate')
            .skip(page * pageLength)
            .limit(pageLength).find(),
    });
});

router.get('/', async (request, response) => {
    let reqBody = reqParamsParser(request);
    // 判断 id 是否合法
    if (/^[\da-f]{1,12}$/.test(String(reqBody.id))) {
        // 在数据库中查找帖子
        let post = await new AV.Query('Item')
            .equalTo('id', reqBody.id)
            .select(['-description', '-objectId', '-createdAt', '-updatedAt']).first();
        if (post) {
            makeResponse(response, 0, 'Success.', post);
        } else {
            makeResponse(response, -41, 'Item not found.');
        }
    } else {
        makeResponse(response, -31, 'Invalid id.');
    }
});


module.exports = router;