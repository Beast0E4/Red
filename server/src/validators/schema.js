const Joi = require('joi');

module.exports.userSchema = Joi.object({
    username: Joi.string()
        .required()
        .pattern(new RegExp('^[a-z0-9]+$'))
        .messages({
            "string.base": "Username must be a text value.",
            "string.empty": "Username cannot be empty.",
            "any.required": "Username is required.",
            "string.pattern.base": "Username can only contain lowercase letters and numbers."
        }),
    password: Joi.string()
        .required()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]+$'))
        .messages({
            "string.base": "Password must be a text value.",
            "string.empty": "Password cannot be empty.",
            "any.required": "Password is required.",
            "string.pattern.base": "Password must have at least one uppercase letter, one lowercase letter, one number, and one special character."
        }),
});
