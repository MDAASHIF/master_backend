import Joi from 'joi'

export const registerSchema = Joi.object({
    name : Joi.string().required(),
    email : Joi.string().email().required(),
    password : Joi.string().min(6).max(100).required(),
    confirmPassword: Joi.any()
        .valid(Joi.ref('password'))
        .required()
        .strict()
        .messages({
            'any.only': 'Passwords do not match'
        })
})

export const loginSchema = Joi.object({
    email : Joi.string().email().required(),
    password : Joi.string().min(6).max(100).required(),
})