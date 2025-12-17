const express = require('express');
const {
  signup,
  signin,
  refresh,
  getAllUsers
} = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', signup);
router.post('/login', signin);
router.post('/refresh', refresh);
router.get("/", getAllUsers);

module.exports = router;
