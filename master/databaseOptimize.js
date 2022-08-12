const db = require('../adapter/db.js');

require('dotenv').config()
db.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
})

let Post = new db('Post');
let Comment = new db('Comment');
let User = new db('mUser');

// 去重
function unique() {
    Post.query({}, {
        limit: 10,
        select: ['id'],
        descending: 'timeCreate'
    }).then(async posts => {
        for (let post of posts) {
            let postId = post.get('id');
            let count = await Post.count({
                id: postId,
            });
            console.log(postId, count);
            if (count > 1) {
                console.log(postId)
                await Post.delete({
                    id: postId,
                })
            }
        }
    })
}

unique();
