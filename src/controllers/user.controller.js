import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registeruser = asyncHandler(async (req,res) => {
    const { fullname,username,email,password } = req.body
    console.log("Name :", fullname)

    // if(fullname === empty){
    //     throw new ApiError(400,"FullName is required")
    // }

    if([fullname,username,email,password].some((field) => !field || field .trim() === "")){
        throw new ApiError(400,"All Fields are required")
    }

    const existeduser = User.findOne({
        $or : [{username},{email}]
    })
    if(existeduser){
        throw new ApiError(409,"User already exists")
    }

    const avatarlocalpath = req.files?.avatar[0]?.path
    const coverimagelocalpath = req.files?.coverimage[0]?.path

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

    const createduser = User.findById(user._id).select(
        "-password -refreshtokens"
    )

    if(!createduser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createduser,"User Registered Successfully")
    )
})

export {registeruser}