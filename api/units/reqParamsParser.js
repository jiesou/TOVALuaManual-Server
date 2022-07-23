export default class ReqParamsParser {
    constructor(request) {
        let { body } = request;
        if (body) {
            this.setParams(body);
        } else if (request.query) {
            this.setParams(request.query);
        }
    }
    setParams(params) {
        Object.keys(params).forEach(key => {
            this[key] = params[key];
        });
    }
}