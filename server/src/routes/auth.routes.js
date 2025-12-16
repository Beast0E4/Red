const express = require('express');
const {
  signup,
  signin,
  refresh,
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', signup);
router.post('/login', signin);
router.post('/refresh', refresh);

module.exports = router;
