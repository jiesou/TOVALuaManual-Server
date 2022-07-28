var AV = require('leancloud-storage);
var makeResponse = require('../units/makeResponse.js);
var authentication = require('../units/user/authenticator.js);

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});

export default async function handler(request, response) {
    // 在数据库中查找用户
    let user = await authentication(request, response);
    user.set('password', undefined);
    user.set('email', undefined);
    user.set('avatar', `https://cravatar.cn/avatar/${user.get('emailMD5')}`);
    makeResponse(response, 0, 'Success.', user);
}
