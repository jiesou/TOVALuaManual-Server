const router = require('express').Router();
const makeResponse = require("../units/makeResponse");
const authentication = require("../units/user/authenticator");
const AV = require("leancloud-storage");
const reqParameterParser = require("../units/reqParamsParser");
const {encryptMD5, encrypt} = require("../units/user/encrypter");

router.use('/create', require('./user/create'));

router.get('/', async (request, response) => {
    // 在数据库中查找用户
    let user = await authentication(request, response);
    user.set('password', undefined);
    user.set('email', undefined);
    user.set('avatar', `https://cravatar.cn/avatar/${user.get('emailMD5')}`);
    makeResponse(response, 0, 'Success.', user);
})

router.get('/create', async (request, response) => {
    let User = AV.Object.extend('mUser');

    let reqBody = reqParameterParser(request);

    if (!/^.{2,12}$/.test(reqBody.nick)) {
        makeResponse(response, -31, 'Invalid nick.');
        return
    }
    if (!/^.{1,64}?@[^.]{1,63}?(\.[^.]{1,63})+$/.test(request.headers.email)) {
        makeResponse(response, -32, 'Invalid email.');
        return
    }
    if (!/^[\w._+\-?!@#$%^&*()/]{8,64}$/.test(request.headers.password)) {
        makeResponse(response, -33, 'Invalid password.');
        return
    }

    let id = encryptMD5(request.headers.email + new Date().getTime()).substr(0, 8)

    // 检查用户是否已在数据库中
    if (await new AV.Query.or(
        new AV.Query('mUser')
            .equalTo('id', id),
        new AV.Query('mUser')
            .equalTo('email', request.headers.email)
    ).first()) {
        makeResponse(response, -41, 'User already exists.');
        return
    }

    // 构建新对象
    let user = new User();
    user.set('id', id);
    user.set('nick', reqBody.nick);
    user.set('email', request.headers.email);
    user.set('password', encrypt(request.headers.password));
    user.set('emailMD5', encryptMD5(
        request.headers.email
            .trim().toLowerCase()
    ));
    user.set('verifiedEmail', false);
    await user.save();

    makeResponse(response, 0, 'Success, please verify your email.');
});

module.exports = router;
