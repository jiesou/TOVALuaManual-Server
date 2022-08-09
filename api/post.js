const router = require('express').Router();
const db = require('../adapter/db.js');
const makeResponse = require('../units/makeResponse.js');
const reqParamsParser = require('../units/reqParamsParser.js');

let Post = new db('Post');

router.get('/list', async (request, response) => {
    let reqBody = reqParamsParser(request);
    /**
     * @preserve reqBody 请求参数
     * @property reqBody.page 页码
     * @property reqBody.pageLength 单页长度
     */
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

    makeResponse(response, 0, 'Success.', {
        'currentPage': page,
        // ~~ 能向下取整
        'totalPage': ~~(await Post.count() / pageLength),
        'posts': await Post.query(
            {},
            {
                limit: pageLength,
                offset: page * pageLength,
                // 按 timeCreate 倒序
                descending: 'timeCreate',
                // 不需要某些属性
                select: ['-content', '-comments.data']
            })
    });
});

router.get('/', async (request, response) => {
    let reqBody = reqParamsParser(request);
    // 判断 id 是否合法
    if (/^[\da-f]{1,12}$/.test(String(reqBody.id))) {
        // 在数据库中查找帖子
        let post = await Post.query({
            id: reqBody.id
        }, {
            limit: 1,
            select: ['-content', '-comments.data']
        });
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
