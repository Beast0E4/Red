const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastSeen: { type: Date, default: Date.now }
});

userSchema.pre('save', function() {
    const hashedPassword = bcrypt.hashSync(this.password, 11);
    this.password = hashedPassword;
});

const User = mongoose.model('User', userSchema);
module.exports = User;