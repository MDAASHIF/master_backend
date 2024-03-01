import { registerSchema,loginSchema } from "../validations/authValidation.js";
import User from '../models/User.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
import {uploadOnCloudinary} from "../utils/cloudinary.js"


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

    static async logoutUser(req, res){
        let user_uuid = req.body.user_id;
        if(user_uuid == "" || user_uuid == undefined){
            return res.status(400).json(
                new ApiError(400, "user_id is required.")
            ) 
        }
        await User.findOneAndUpdate({uuid:user_uuid},{
            $unset :{refreshToken:1}
        },{new:true});
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
    }

    static async refreshAccessToken(req, res){
        try {
            const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if(!incomingRefreshToken) return res.status(400).json(
                new ApiError(400, "Unauthorized Access")
            )
            const decodedToken = jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
            const user = await User.findById(decodedToken?._id)
            if (!user)return res.status(400).json(
                new ApiError(400, "Invalid refresh token")
            )
    
            if (incomingRefreshToken !== user?.refreshToken)return res.status(400).json(
                new ApiError(400, "refresh token expired")
            )
            const options = {
                httpOnly: true,
                secure: true
            }
        
            const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error.message)
            )
        }
    }

    static async changeCurrentPassword(req, res){
        try {
             const {oldPassword, newPassword} = req.body;

             const user = await User.findById(req.user?._id)
             const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
             if(!isPasswordCorrect) return res.status(400).json(
                new ApiError(400, 'Invalid Old Password')
             )
             user.password = await bcrypt.hash(payload.password, 10)
             await user.save()
             return res.status(200).json(
                new ApiResponse(
                    200, 
                    {},
                    "Password changed successfully"
                )
            )
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error.message)
            ) 
        }
    }

    static async updateUserAvatar(req, res){
        try {
             const avatarLocalPath = req.file?.path;
             if(!avatarLocalPath) return res.status(400).json(
                new ApiError(400, 'Avatar file is missing')
            )
            const avatar = await uploadOnCloudinary(avatarLocalPath);
            
            if(!avatar.url) return res.status(400).json(
                new ApiError(400, "Error while uploading on avatar")
            )
            const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $set : {
                        avatar : avatar.url
                    }
                },
                {new: true}
            ).select("-password")
            return res.status(200).json(
                new ApiResponse(200, user, "Avatar image updated successfully")
            )
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error.message)
            ) 
        }
    }
    static async updateUserCoverImage(req, res){
        try {
             const coverImageLocalPath = req.file?.path;
             if(!coverImageLocalPath) return res.status(400).json(
                new ApiError(400, 'Avatar file is missing')
            )
            const coverImage = await uploadOnCloudinary(coverImageLocalPath)
            if(!coverImage.url) return res.status(400).json(
                new ApiError(400, "Error while uploading on avatar")
            )

            const user = await User.findByIdAndUpdate(
                req.user?._id,
                {
                    $set : {
                        coverImage : coverImage.url
                    }
                },
                {new: true}
            ).select("-password")
            return res.status(200).json(
                new ApiResponse(200, user, "Cover image updated successfully")
            )
        } catch (error) {
            return res.status(400).json(
                new ApiError(400, error.message)
            ) 
        }
    }
}

export default AuthController;