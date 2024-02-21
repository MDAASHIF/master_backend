import { registerSchema,loginSchema } from "../validations/authValidation.js";
import User from '../models/User.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from 'bcrypt';


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}
    } catch (error) {
        return res.status(400).json(
            new ApiError(500, "Something went wrong while generating referesh and access token")
        )
    }
}

class AuthController{
    static async register(req, res){
        try {
            const body =  req.body;
            const payload = await registerSchema.validateAsync(body);
            const checkEmail = await User.findOne({email : payload.email});
            if(checkEmail) return res.status(400).json(
                new ApiError(400, "Email Already Exist")
            )
            payload.password = await bcrypt.hash(payload.password, 10)
            const user =await User.create(payload)
            return res.status(201).json(
                new ApiResponse(200, [], "Register Successfully")
            )
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error.message)
            )
        }
    }

    static async login(req, res){
        try {
             const body = req.body;
             const payload = await loginSchema.validateAsync(body);
             const checkEmail = await User.findOne({email : payload.email});
             if(!checkEmail) return res.status(400).json(
                new ApiError(400, "Authentication Failed")
            )
             const isPasswordValid = await checkEmail.isPasswordCorrect(payload.password)
             if (!isPasswordValid) return res.status(400).json(
                new ApiError(400, "Authentication Failed")
            )

            const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(checkEmail._id)

            const loggedInUser = await User.findById(checkEmail._id).select("-password -refreshToken")
            const options = {
                httpOnly: true,
                secure: true
            }
        
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {
                        user: loggedInUser, accessToken, refreshToken
                    },
                    "User logged In Successfully"
                )
            )
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error.message)
            )
        }
    }
}

export default AuthController;