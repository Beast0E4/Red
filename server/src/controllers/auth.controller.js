const {
  createUser,
  validateUser,
  refreshAccessToken,
  getAllUsersService
} = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken')

const signup = async(req,res) =>  {
        const response  = await createUser(req.body);

        if(response.error){
            return res.status(StatusCodes.BAD_REQUEST).send({
                message : "Signup failed",
                error : response.error
            })
        }
        return res.status(StatusCodes.CREATED).send({
            message : "Successfully created the account",
            userdata: response
        })
};

const signin = async(req,res) => {
    const response = await validateUser (req.body.email,req.body.password);
    if(response.error){
        return res.status(StatusCodes.BAD_REQUEST).send({
            message:"Login failed",
            error : response.error
        })
    }

    const token = jwt.sign({id: response.userdata.id} , process.env.JWT_SECRET);; 

    return res.status(StatusCodes.ACCEPTED).json({
        message : "Successfully Login",
        userdata : response.userdata,
        token : token,
    })
}

// Refresh token
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const accessToken = await refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

module.exports = {
  signup,
  signin,
  refresh,
  getAllUsers
};
