require("dotenv").config()
const jwt=require("jsonwebtoken");

const generateTokens = async (user) => {
	try {
		const payload = { _id: user._id, email: user.email,role:user.userRole };
		const accessToken = jwt.sign(
			{user:payload},
			process.env.ACCESS_TOKEN_SECRET_KEY,
			{ expiresIn: "5d" }
		);
		const refreshToken = jwt.sign(
			{user:payload},
			process.env.REFRESH_TOKEN_SECRET_KEY,
			{ expiresIn: "5d" }
		);

		return Promise.resolve({ accessToken, refreshToken });

	} catch (err) {
		return Promise.reject(err);
	}
};

module.exports= generateTokens;