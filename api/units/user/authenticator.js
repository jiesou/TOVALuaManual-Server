import makeResponse from '../../units/makeResponse.js';
import AV from 'leancloud-storage';
import { encrypt } from './encrypter.js';

export default async function authentication(request, response) {
    let user = await new AV.Query('mUser')
        .equalTo('email', request.headers.email).select(['-objectId', '-createdAt', '-updatedAt']).first()
    if (user && user.get('password') === encrypt(request.headers.password)) {
        return user;
    } else {
        makeResponse(response, -21, 'Authentication failed.');
    }
}