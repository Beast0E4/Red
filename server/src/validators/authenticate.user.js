const authMiddleware = require("../middleware/auth.middleware");

const isUserAuthenticated = async (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({
      msg: "Token not provided",
    });
  }

  try {
    // 🔑 Verify token
    const decoded = await authMiddleware.verfiyJwtToken(token);

    if (!decoded) {
      return res.status(401).json({
        msg: "Token not verified",
      });
    }

    // 🔥 ATTACH USER TO REQUEST
    req.user = { id: decoded.id };
    console.log ("-------------->", decoded)

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({
      msg: "Invalid or expired token",
    });
  }
};

module.exports = {
  isUserAuthenticated,
};
