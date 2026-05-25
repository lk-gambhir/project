import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import  { ApiResponse } from "../utils/ApiResponse.js";

const generateaccessandrefreshtoken = async (userid) => {
    try {
        const user = await User.findById(userid)
        const accesstoken = user.generateAccesstoken()
        const refreshtoken = user.generateRefreshtoken()

        user.refreshtokens = refreshtoken
        await user.save({ validateBeforeSave: false })

        return { accesstoken, refreshtoken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registeruser = asyncHandler(async (req,res) => {
    const { fullname,username,email,password } = req.body
    console.log("Name :", fullname)

    // if(fullname === empty){
    //     throw new ApiError(400,"FullName is required")
    // }

    if([fullname,username,email,password].some((field) => !field || field.trim() === "")){
        throw new ApiError(400,"All Fields are required")
    }

    const existeduser = await User.findOne({
        $or : [{username},{email}]
    })
    if(existeduser){
        throw new ApiError(409,"User already exists")
    }

    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverimagelocalpath = req.files?.coverimage?.[0]?.path;

    if(!avatarlocalpath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadoncloudinary(avatarlocalpath)
    const coverimage = await uploadoncloudinary(coverimagelocalpath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is definitely required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage : coverimage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createduser = await User.findById(user._id).select(
        "-password -refreshtokens"
    )

    if(!createduser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createduser,"User Registered Successfully")
    )
})
const loginuser = asyncHandler(async (req,res) => {
    const {username,email,password} = req.body
    if(!username || !email) 
    {
        throw new ApiError(400,"Username or email is required")
    }
    
    const user = await User.findOne({
        $or : [{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User not found")
    }

    const ispasswordvalid = await user.isPasswordcorrect(password)
    if(!ispasswordvalid)
    {
        throw new ApiError(400,"Password is invalid")
    }
    const {accesstoken,refreshtoken} = await generateaccessandrefreshtoken(user._id) 

    const loggedinuser = await User.findById(user._id).select("-password -refreshtokens")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accesstoken",accesstoken,options)
    .cookie("refreshtoken",refreshtoken,options)
    .json(
        new ApiResponse(200,{
            user : loggedinuser , accesstoken, refreshtoken
        },
    "User logged in successfully")
    )
})
const logoutuser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(req.user._id,{
        $set : {
            refreshtoken : undefined
        }
    },
    {
        new : true
    })
    const options = {
        httpOnly : true,
        secure : true
    }
    return res.status(200)
    .clearCookie("accesstoken",options)
    .clearCookie("refreshtoken",options)
    .json(new ApiResponse(200,{},"User logged out successfully")) 
}
)
export {registeruser,loginuser,logoutuser}