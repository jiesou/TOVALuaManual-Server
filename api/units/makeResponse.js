export default function makeResponse(response, code, message, data) {
    if (data instanceof Array | data instanceof Object) {
        return response.json({
            code: code,
            message: message,
            data: data
        });
    } else {
        return response.json({
            code: code,
            message: message
        });
    }
}