const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  // Get token from cookies or Authorization header (fallback)
  const token = req.cookies.token || (req.header("Authorization")?.startsWith("Bearer ") ? req.header("Authorization").split(" ")[1] : null);

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;
