import AV from 'leancloud-storage';
import ReqBodyParser from '../../units/reqBodyParser.js';
import makeResponse from '../../units/makeResponse.js';
import encrypt from '../../units/user/encrypter.js';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});

export default async function handler(request, response) {
    let User = AV.Object.extend('User');

    let reqBody = new ReqBodyParser(request);

    if (!/^.{2,12}$/.test(reqBody.nick)) {
        return makeResponse(response, -31, 'Invalid nick.');
    }
    if (!/^[\w\d_\+\-\?!@#\$%^&\*\(\)\/]{8,64}$/.test(reqBody.password)) {
        return makeResponse(response, -32, 'Invalid password.');
    }
    if (!/^.+?@.+?/.test(reqBody.email)) {
        return makeResponse(response, -33, 'Invalid email.');
    }
    // 检查邮箱是否已在数据库中
    if (await new AV.Query('User')
        .equalTo('email', reqBody.email).first()) {
        return makeResponse(response, -34, 'Email already exists.');
    }

    // 构建新对象
    let user = new User();
    user.set('nick', reqBody.nick);
    user.set('email', reqBody.email);
    user.set('password', encrypt(reqBody.password));
    await user.save();

    return makeResponse(response, 0, 'Success, please verify your email.');
}
