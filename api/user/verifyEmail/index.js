var AV = require('leancloud-storage);
var ReqBodyParser = require('../../units/reqBodyParser.js);
var makeResponse = require('../../units/makeResponse.js);
var userChecker = require('../../units/user/checker.js);

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});

export default async function handler(request, response) {
    let reqBody = new ReqBodyParser(request);
    let user = await userChecker.check(reqBody.email, reqBody.password);
    if (user === false) {
        return makeResponse(response, -21)
    }

    return makeResponse(response, 0, 'Success., please verify your email.');
}
