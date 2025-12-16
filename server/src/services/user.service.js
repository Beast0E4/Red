const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const createUser = async(data) => { 
    const response  = {};

    try {
        let user = await User.findOne({ username: data.username });
        if (user) {
            response.error = "Username already exists";
            return response;
        }

        let res = await User.create(data);
        response.user = res;
        return response;
    } catch (error) {
        response.error = error.message;
        return response ; 
    }
};

const validateUser = async (data, password) => {
    const response = {};
    try {
        let res = await User.findOne({ username: data });
        if (!res) {
            if (!res) {
                response.error = "Invalid username";
                return response;
            }
        }

        const result = bcrypt.compareSync(password, res.password);
        if (!result) {
            response.error = "Invalid password";
            return response;
        }

        response.userdata = res;

        return response;
    } catch (error) {
        response.error = error.message;
        return response;
    }
};

const refreshAccessToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      (err, decoded) => {
        if (err) return reject(new Error('Invalid refresh token'));

        const accessToken = jwt.sign(
          { id: decoded.id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE }
        );

        resolve(accessToken);
      }
    );
  });
};

module.exports = {
  createUser,
  validateUser,
  refreshAccessToken,
};
