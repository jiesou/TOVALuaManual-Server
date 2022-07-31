const crypto = require('crypto');

function encrypt(something) {
    something = crypto.createHash('sha1').update(something).digest('hex');
    something = process.env.PASSWORD_SALT + something;
    something = crypto.createHash('sha1').update(something).digest('hex');
    return something;
}
function encryptMD5(something) {
    something = crypto.createHash('md5').update(something).digest('hex');
    return something;
}

module.exports = { encrypt, encryptMD5 };
