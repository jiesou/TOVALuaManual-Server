import AV from 'leancloud-storage';
import encrypt from './encrypter.js';

export default async function checkUserPassword(email, password) {
    let user = await new AV.Query('User')
        .equalTo('email', email).first()
    if (user.get('password')===encrypt(password)) {
        return user;
    } else {
        return false;
    }
}