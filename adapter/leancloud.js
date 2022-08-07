const base = require('./base');
const AV = require('leancloud-storage');

let mTableName = undefined;

// 解析筛选器为 AV.Query 对象
function parseField(field) {
    let query = new AV.Query(mTableName);

    if (!field) {
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
function parseDataWithMustHasObj(data, object) {
    for (let key in data) {
        if (data.length) {
            object[key] = parseDataWithMustHasObj(data[key], object[key]);
        } else if (key !== 'objectId' && key !== 'createdAt' && key !== 'updatedAt') {
            object.set(key, data[key]);
        }
    }
    return object;
}

function parseData(data, object) {
    if (!object) {
        // 自动初始化实例
        object = new AV.Object(mTableName);
    }
    return parseDataWithMustHasObj(data, object);
}

module.exports = class db extends base {
    // 调用初始化数据库密钥
    static init(options) {
        AV.init(options);
    }

    // 构建设置 class
    constructor(tableName) {
        super(tableName);
        mTableName = tableName;
    }

    query(field, limit = 100, offset = 0, descending, select) {
        select = select || [];
        // 排除 LeanCloud 独有的自带字段
        select.push('-objectId');
        select.push('-createdAt');
        select.push('-updatedAt');
        let query = parseField(field)
            .skip(offset)
            .limit(limit)
            .descending(descending)
            .select(select);
        if (limit === 1) {
            // first 方法只获取一个符合条件的对象
            return query.first().toFullJSON();
        } else {
            return query.find();
        }
    }

    count(field) {
        return parseField(field).count();
    }

    put(data) {
        return parseData(data).save();
    }

    putAll(dataArr) {
        let objects = [];
        // 遍历添加全部，然后一次性提交保存数据
        dataArr.forEach(data => {
            objects.push(parseData(data));
        });
        return AV.Object.saveAll(objects);
    }

    update(field, data) {
        let object = parseField(field).first();
        object = parseData(data, object);
        return object.save();
    }

    updateAll(fieldAndDataArr) {
        let objects = [];
        // forEach 是同步方法，不能用 await
        for (let fieldAndData of fieldAndDataArr) {
            let object = parseField(fieldAndData.field).first();
            object = parseData(fieldAndData.data, object);
            objects.push(object);
        }
        return AV.Object.saveAll(objects);
    }
}

