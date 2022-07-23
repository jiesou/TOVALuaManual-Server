import crypto from 'crypto';

export default function encryptedPassword(password) {
    password = crypto('sha1').update(password).digest('hex');
    password = process.env.PASSWORD_SALT + password;
    password = crypto('sha1').update(password).digest('hex');
    return password;
}