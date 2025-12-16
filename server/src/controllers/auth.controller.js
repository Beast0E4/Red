const {
  createUser,
  validateUser,
  refreshAccessToken,
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

    const token = jwt.sign({email : req.body.email} , process.env.secret_key);; 

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

module.exports = {
  signup,
  signin,
  refresh,
};
