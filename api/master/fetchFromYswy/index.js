var fetch = require('node-fetch);
var AV = require('leancloud-storage);
var makeResponse = require('../../units/makeResponse.js);
var itemDataToObj = require('../units/itemDataToObj.js);

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
//AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    // 初始化所有帖子对象的数组
    let items = []

    // 声明 class
    var Item = AV.Object.extend('Item');

    // 只处理第一页
    await fetch('https://lua.yswy.top/index/api/manuallist?page=1').then(async res => {
        res = await res.json()
        res = res.data;

        // 遍历前十个帖子(手册项目)
        for (let i = 0; i < 10; i++) {
            let data = res[i]
            // 检查帖子是否已在数据库中
            let item = await new AV.Query('Item')
                .equalTo('id', String(data.manual_id))
                .first();
            if (item) {
                // 有重复说明已同步到上次的位置
                // 保存全部到数据库
                await AV.Object.saveAll(items);
                return makeResponse(response, 0, 'Success.')
            } else {
                // 构建新对象
                item = new Item();
                item = await itemDataToObj(data, item);
                items.push(item);
            }
        }
    });
}
