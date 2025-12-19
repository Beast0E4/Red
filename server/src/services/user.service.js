const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const bcrypt = require ('bcrypt')

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
        console.log (error);
        response.error = error.message;
        return response ; 
    }
};

const validateUser = async (email, password) => {
    const response = {};
    try {
        let res = await User.findOne({ email });
        if (!res) {
            response.error = "Invalid email";
            return response;
        }

        const result = bcrypt.compareSync(password, res.password);
        if (!result) {
            response.error = "Invalid password";
            return response;
        }

        response.userdata = res;

        return response;
    } catch (error) {
        console.log (error.message);
        response.error = error.message;
        return response;
    }
};

const setLastSeen = async ( userId ) => {
    try {
        await User.findByIdAndUpdate (
            userId,
            { $set: { lastSeen: Date.now () } },
            { new: true }
        );
    } catch (error) {
        console.log (error);
    }
};

const getAllUsersService = async () => {
  const users = await User.find({})
    .select("_id username email lastSeen")
    .lean();

  return users;
};


module.exports = {
  createUser,
  validateUser,
  setLastSeen,
  getAllUsersService
};
