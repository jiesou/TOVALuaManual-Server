const db = require('../adapter/db.js');
const ThreadPool = require('../units/threadPool.js');

require('dotenv').config()
db.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
})

let Post = new db('Post');
let Comment = new db('Comment');
let User = new db('mUser');

// 去重
function unique(DB) {
    DB.query({}, {
        limit: 1000,
        select: ['id'],
        descending: 'timeCreate'
    }).then(async objs => {
        // 创建线程池
        let uniqueTasks = new ThreadPool({
            threads: 12,
            onFinished: () => {
                console.log('All tasks finished.');
            }
        });
        for (let obj of objs) {
            // 遍历添加任务
            uniqueTasks.addTask(obj, async (obj) => {
                let id = obj.get('id');
                let count = await DB.count({
                    id: id,
                });
                console.log(id, count);
                // 遍历把每条都去掉
                for (let i = 1; i < count; i++) {
                    console.log(id, "del")
                    await DB.delete({
                        id: id
                    });
                }
            })
        }
        uniqueTasks.run();
    })
}

unique(Post);
