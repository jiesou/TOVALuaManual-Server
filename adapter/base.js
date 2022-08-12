/* eslint-disable no-unused-vars */

module.exports = class db {
    static init(options) {
    }

    constructor(tableName) {
        this.tableName = tableName;
    }

    async query(field, { limit=100, offset=0, descending, select } = {}) {
    }

    async count(field) {
    }

    async put(data) {
    }

    async putAll(dataArr) {
    }

    async delete(field) {
    }

    async update(field, data) {
    }

    async updateAll(fieldAndDataArr) {
    }
}

