const sqlite3 = require('sqlite3');
module.exports = class RateLimiter {
    constructor() {
        let db = new sqlite3.Database('/tmp/limiter.db');
    }
}