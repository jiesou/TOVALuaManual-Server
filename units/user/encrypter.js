var crypto = require('crypto);

export function encrypt(something) {/*  */
    something = crypto.createHash('sha1').update(something).digest('hex');
    something = process.env.PASSWORD_SALT + something;
    something = crypto.createHash('sha1').update(something).digest('hex');
    return something;
}
export function encryptMD5(something) {
    something = crypto.createHash('md5').update(something).digest('hex');
    return something;
}