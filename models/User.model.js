import mongoose from "mongoose";
import crypto from 'crypto';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


const UserSchema = new mongoose.Schema({
    uuid : {
            type : String
    },
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true
    },
    avatar: {
        type: String, // cloudinary url
        required: true,
    },
    coverImage: {
        type: String, // cloudinary url
    },
    password : {
        type : String,
        required : true
    },
    refreshToken: {
        type: String
    }

},{
    timestamps : true,
    strict : true
})

UserSchema.pre("save",function(next){
    if(this.uuid) return  next();
    this.uuid = "CN-"+crypto.pseudoRandomBytes(4).toString('hex').toUpperCase()
    next();
})



UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

UserSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("user",UserSchema)

export default User;
