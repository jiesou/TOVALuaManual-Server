const router = require('express').Router();

router.use('/master', require('./master'));
router.use('/item', require('./item'));
router.use('/user', require('./user'));

module.exports = router;
