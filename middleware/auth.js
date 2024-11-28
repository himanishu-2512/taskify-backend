require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  // console.log(req.headers)

  
  try {
  const accessToken = req.headers["authorization"].split(" ")[1];
  const refreshToken = req.cookies;
  if (!accessToken) {
    return res.status(401).json({message:"Access Denied. No token provided."});
  }

    // Verify the access token
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_SECRET_KEY
    );
    req.user = decoded.user;
    console.log(decoded, 1);
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.log("Error verifying access token:", error);

      try {
      if (!refreshToken) {
        return res.status(401).json({message:"Access Denied. No refresh token provided."});
      }
      // Verify the refresh token
      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET_KEY
      );

      // Create a new access token using the refresh token
      const newAccessToken = jwt.sign(
        { user: decodedRefresh.user },
        process.env.ACCESS_TOKEN_SECRET_KEY,
        { expiresIn: "5d" }
      );
      req.user = decodedRefresh.user;

      console.log(decodedRefresh.user);

      // Set the new refresh token in the cookie (optional, only if needed)
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: process.env.NODE_ENV === "production", // Only true in production
        maxAge: 60 * 60 * 24 * 7 * 1000, // Optional: Set expiration (1 week)
      });

      // Send the new access token in the response body (not as header)
      return res.json({
        message: "Token refreshed successfully.",
        accessToken: newAccessToken, // Send the new access token to the client
      });

    } catch (error) {
      console.log("Error verifying refresh token:", error);
      return res.status(400).json({message:"Invalid Token."});
    }
  }
};

module.exports = auth;
