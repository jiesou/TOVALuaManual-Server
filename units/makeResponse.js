function makeResponse(response, code, message, data) {
    let result = {
        code: code,
        message: message
    }
    if (data instanceof Array | data instanceof Object) {
        result.data = data;
    }
    response.json(result);
}
module.exports = makeResponse;