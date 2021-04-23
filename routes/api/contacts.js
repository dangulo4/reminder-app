const express = require('express');
const router = express.Router();

//@route  Get api/contacts
//@desc   Test route
//@access Public
router.get('/', (req, res) => res.send('Contacts route'));

module.exports = router;
