import fetch from 'node-fetch';
import AV from 'leancloud-storage';
import makeResponse from '../../../units/makeResponse.js';
import itemDataToObj from '../../units/itemDataToObj.js';

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
});
//AV.debug.enable();  // 启用调试

export default async function handler(request, response) {
    // 先获取总页数
    let res = await fetch('https://lua.yswy.top/index/api/manuallist?page=1');
    let allPage = await res.json();
    allPage = allPage.per_page
    console.log('allPages', allPage);

    // 声明 class
    var Item = AV.Object.extend('Item');

    // 初始化已完成页数
    let finishedPage = 0;
    
    console.log('Task started');
    
    // 遍历每一页
    for (let page = 1; page <= allPage; page++) {
        console.log('pageStart', page)
        
        // 拼接 API 链接并在线程中发出请求
        fetch(`https://lua.yswy.top/index/api/manuallist?page=${page}`).then(async res => {
            res = await res.json()
            res = res.data;
            // 初始化所有帖子对象的数组
            let items = []

            // 遍历每一个帖子(手册项目)
            for (let i=0; i < res.length; i++) {
                let data = res[i]
                // 检查帖子是否已在数据库中
                let item = await new AV.Query('Item')
                    .equalTo('id', String(data.manual_id))
                    .first();
                if (!item) {
                    console.log(`page ${page} itemStart`, i);
                    // 构建新对象
                    item = new Item();
                    item = await itemDataToObj(data, item);
                    items.push(item);
                    console.log(`page ${page} itemEnd`, i);
                }
            }
            console.log('pageEnd', page)
            // 保存该页全部到数据库
            await AV.Object.saveAll(items);
            finishedPage++;
            console.log(`Task ${finishedPage} / ${allPage}`);
            // 如果全部页面完成
            if (finishedPage >= allPage) {
                console.log('Task finished');
                return makeResponse(response, 0, 'Success.')
            }
        });
    }
}


