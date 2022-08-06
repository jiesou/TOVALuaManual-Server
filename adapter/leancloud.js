const AV = require('leancloud-storage');

let tableName = undefined;

// 解析筛选器为 AV.Query 对象
function parseField(field) {
    let query = new AV.Query(tableName);

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
        } else if (key !== 'objectId' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'ACL') {
            object.set(key, data[key]);
        }
    }
    return object;
}

function parseData(data, object) {
    if (!object) {
        // 自动初始化实例
        object = new AV.Object(tableName);
    }
    return parseDataWithMustHasObj(data, object);
}

module.exports = class db {
    // 调用初始化数据库密钥
    static init(options) {
        AV.init(options);
    }

    // 构建设置 class
    constructor(inTableName) {
        tableName = inTableName;
    }

    async query(field) {
        // first 方法只获取一个符合条件的对象
        return await parseField(field).first().toFullJSON();
    }

    async queryAll(field) {
        return await parseField(field).find().toFullJSON();
    }

    async put(data) {
        return await parseData(data).save();
    }

    async putAll(dataArr) {
        let objects = [];
        // 遍历添加全部，然后一次性提交保存数据
        dataArr.forEach(data => {
            objects.push(parseData(data));
        });
        return await AV.Object.saveAll(objects);
    }

    async update(field, data) {
        let object = await parseField(field).first();
        object = parseData(data, object);
        return await object.save();
    }

    async updateAll(fieldAndDataArr) {
        let objects = [];
        // forEach 是同步方法，不能用 await
        for (let fieldAndData of fieldAndDataArr) {
            let object = await parseField(fieldAndData.field).first();
            object = parseData(fieldAndData.data, object);
            objects.push(object);
        }
        return await AV.Object.saveAll(objects);
    }
}

