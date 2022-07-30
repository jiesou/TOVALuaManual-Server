const router = require('express').Router();
const AV = require('leancloud-storage');
const makeResponse = require("../../../../units/makeResponse");
const ReqParameterParser = require('../../../../units/reqParamsParser.js');
const {encryptMD5, encrypt} = require("../../../../units/user/encrypter");


AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});

router.get('/', async (request, response) => {
    let User = AV.Object.extend('mUser');

    let reqBody = new ReqParameterParser(request);

    if (!/^.{2,12}$/.test(reqBody.nick)) {
        makeResponse(response, -31, 'Invalid nick.');
    }
    if (!/^.{1,64}?@[^.]{1,63}?(\.[^.]{1,63})+$/.test(request.headers.email)) {
        makeResponse(response, -32, 'Invalid email.');
    }
    if (!/^[\w._+\-?!@#$%^&*()/]{8,64}$/.test(request.headers.password)) {
        makeResponse(response, -33, 'Invalid password.');
    }

    let id = encryptMD5(request.headers.email + new Date().getTime()).substr(0, 8)

    // 检查用户是否已在数据库中
    if (await new AV.Query('mUser')
        .equalTo('id', id).first()) {
        makeResponse(response, -34, 'User already exists.');
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
})