const axios = require("axios");
const jwt = require("jsonwebtoken");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Not authorized" });
  }

  // Bearer
  const token = authorization.split(" ")[1];

  try {
    const { email } = jwt.verify(token, process.env.SECRET);

    req.user = await axios({
      method: "get",
      url: `${process.env.dbURL}/user`,
      data: { email },
    });

    next();
  } catch (error) {
    res.status(401).json({ error: "Not authorized" });
  }
};

module.exports = requireAuth;
