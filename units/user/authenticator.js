const makeResponse = require('../../units/makeResponse.js');
const AV = require('leancloud-storage');
const {encrypt} = require('./encrypter.js');

async function authentication(request, response) {
    let user = await new AV.Query('mUser')
        .equalTo('email', request.headers.email).select(['-objectId', '-createdAt', '-updatedAt']).first()
    if (user && user.get('password') === encrypt(request.headers.password)) {
        return user;
    } else {
        makeResponse(response, -21, 'Authentication failed.');
    }
}

module.exports = authentication;
