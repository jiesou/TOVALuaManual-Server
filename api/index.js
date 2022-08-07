const router = require('express').Router();

router.use('/master', require('./master'));
router.use('/post', require('./post'));
router.use('/user', require('./user'));

module.exports = router;
