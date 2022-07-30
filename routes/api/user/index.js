const router = require('express').Router();
const makeResponse = require("../../../units/makeResponse");
const authentication = require("../../../units/user/authenticator");

router.use('/create', require('./create'));

router.get('/', async (request, response) => {
    // 在数据库中查找用户
    let user = await authentication(request, response);
    user.set('password', undefined);
    user.set('email', undefined);
    user.set('avatar', `https://cravatar.cn/avatar/${user.get('emailMD5')}`);
    makeResponse(response, 0, 'Success.', user);
})

module.exports = router;
