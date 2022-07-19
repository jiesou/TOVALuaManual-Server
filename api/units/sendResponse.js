export default function sendResponse(response, code, message, data) {
    return response.json({
        code: code,
        message: message,
        data: data
    });
}