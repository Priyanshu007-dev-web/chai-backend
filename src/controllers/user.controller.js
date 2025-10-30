// import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinery.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asynchandler from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // rft save in db by mdb's save method validation not require for update details.
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while generating access and referesh tokens")
    }

}
const registerUser = asynchandler(async (req, res) => {
    // get User Details from frontend
    // valdation not Empty 
    // check f user already exists: userName or password
    // check fro images, and check for avatar
    // upload them to cloudinary, avatar 
    // create user object, create entry in db
    // Remove password refresh token field from response 
    // check fro user creation 
    // return response

    const { fullName, email, username, password } = req.body; // extraction from body
    // check for prevent empty fields
    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All Fields Are Required")
    }
    // user exists or not if do so give 409
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        console.log("User with email or username already exists");
        throw new ApiError(409, "User with email or username already exists");
    }

    // checking the avatar image is available or not in the userRegister Data ..?? 
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path // best way is bellow

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    console.log("coverImageLocalPath from user.controller.js 57", coverImageLocalPath)

    // checking the avatar image is available if not so throw 400
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar File is required")
    }
    // upload avatar on cloudinery
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log(">>>>>>>>>>>> 51", coverImage);
    // avatar must be have checking here 
    if (!avatar) {
        throw new ApiError(400, "Avatar File is required")
    }
    //create a new user document in the database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // this is noth is this is user details without Pss & RT 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // if user not create in DB so give 500 
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    // return 201 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})
// .........User Login.........
const loginUser = asynchandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user 
    // password check
    // access and refresh token
    // send cookie and response

    const { username, email, password } = req.body
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }


    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(400, "User Does not Exist");
    }

    // this user is finded user from db and "isPasswordCorrect" is fn of bycrypt
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }
    // this will find and generate access and refersh token
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
                "User logged in successfully"

            )
        )

})

const logoutUser = asynchandler(async (req, res) => {
    // all cookies remove
    // remove refresh tocken from moddel

    User.findByIdAndUpdate(
        req.body._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asynchandler(async (req, res) => {
    // incomingRefreshToken this is contains refresh token from the user's cookie
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        // this is doing decode the token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if (!incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("RefreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refreshed Successfully "
                )
            )
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Refresh Token")
    }

})

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { oldPasswword, newPassword } = req.body

    const user = await User.findById(req.user?._id) // confusion => user directly using inside its value
    const isPasswordCorrect = user.isPasswordCorrect(oldPasswword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Your Password Changed Successfully"))
})

const getCurrentUser = asynchandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User fetched Successfully"))// advance correction
})

const updateAccountDetails = asynchandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are reuqired")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})

// assighnment to be delete old avatar img using its cloudinary url
const updateUserAvatar = asynchandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")
})

const updateUserCoverImage = asynchandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")
})

const getUserChannelProfile = asynchandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "UserName is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",// into model converts the name into all lowerCase & plural form .
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    console.log("Whole Channel from 347 of user controller ==> ", channel)

    if (!channel.length) {
        throw new ApiError(400, "Channel does not exists")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "Channel fetched successfully")
        )
})

const getWatchHistory = asynchandler(async (req, res) => {

    const user = await User.aggregate([
        {
            // doing filter a user by the userId
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // join collections
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
        new ApiResponse(200, user[0].watchHistory, "Watvh history fetched successfully")
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}