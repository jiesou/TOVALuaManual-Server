const base = require('./base');
const AV = require('leancloud-storage');

module.exports = class db extends base {
    // 调用初始化数据库密钥
    static init(options) {
        AV.init(options);
    }

    // 构建设置 class
    constructor(tableName) {
        super(tableName);
    }

    // 将筛选器解析为 AV.Query 对象
    _parseField(field) {
        let query = new AV.Query(this.tableName);

        if (!field || field === {}) {
            return query;
        }

        for (let key in field) {
            if (typeof field[key] === 'string') {
                query.equalTo(key, field[key]);
                continue;
            }

            if (field[key] instanceof Array) {
                if (field[key][0]) {
                    //let command = field[key][0];
                }
            }
        }

        return query;
    }

    // 向 AV.Object 对象中添加结构化的 data
    _parseDataWithMustHasObj(data, object) {
        for (let key in data) {
            if (data.length) {
                object[key] = this._parseDataWithMustHasObj(data[key], object[key]);
            } else if (key !== 'objectId' && key !== 'createdAt' && key !== 'updatedAt') {
                object.set(key, data[key]);
            }
        }
        return object;
    }

    _parseData(data, object) {
        if (!object) {
            // 自动初始化实例
            object = new AV.Object(this.tableName);
        }
        return this._parseDataWithMustHasObj(data, object);
    }


    query(field, options) {
        let select = options.select || [];
        // 排除 LeanCloud 独有的自带字段
        select.push('-objectId');
        select.push('-createdAt');
        select.push('-updatedAt');
        let query = this._parseField(field)
            .skip(options.offset || 0)
            .limit(options.limit || 100)
            .select(select);
        if (options.descending) {
            query.descending(options.descending);
        }
        if (options.limit === 1) {
            // first 方法只获取一个符合条件的对象
            return query.first().toFullJSON();
        } else {
            return query.find();
        }
    }

    count(field) {
        return this._parseField(field).count();
    }

    put(data) {
        return this._parseData(data).save();
    }

    putAll(dataArr) {
        let objects = [];
        // 遍历添加全部，然后一次性提交保存数据
        dataArr.forEach(data => {
            objects.push(this._parseData(data));
        });
        return AV.Object.saveAll(objects);
    }

    delete(field) {
        // select 只有 objectId 就是不要数据
        let object = this._parseField(field).select(['objectId']).first();
        return object.destroy();
    }

    async update(field, data, dontOverwrite) {
        let object = await this._parseField(field).select(['objectId']).first();
        if (!object || !dontOverwrite) {
            object = this._parseData(data, object);
        }
        return await object.save();
    }

    async updateAll(fieldAndDataArr) {
        let objects = [];
        // forEach 是同步方法，不能用 await
        for (let fieldAndData of fieldAndDataArr) {
            let object = await this._parseField(fieldAndData.field).select([]).first();
            object = this._parseData(fieldAndData.data, object);
            objects.push(object);
        }
        return await AV.Object.saveAll(objects);
    }
}

