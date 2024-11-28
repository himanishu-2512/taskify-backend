const Joi = require("joi");

const signUpBodyValidation = (body) => {
	const schema = Joi.object({
		name: Joi.string().required(),
		email: Joi.string().email().required(),
		password: Joi.string().required(),
	});
	return schema.validate(body);
};

const logInBodyValidation = (body) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(body);
};

module.exports= {
	signUpBodyValidation,
	logInBodyValidation}