var router = require('express').Router();

router.use('/master', require('./master'));
router.use('/item', require('./item'));

module.exports = router;
