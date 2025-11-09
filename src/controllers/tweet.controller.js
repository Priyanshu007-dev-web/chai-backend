import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asynchandler from "../utils/asyncHandler.js"
import { response } from "express"

// const createTweet = asynchandler(async (req, res) => {
//     //TODO: create tweet
//     //1. Read tweet fields from req.body (e.g.content medea)
//     //2. Get Authenticated userID from req.user.
//     //3. Validate required field and return 400 if invalid
//     //4. create and save the tweet document (e.g., tweet.create(.)).
//     //5. (Optional) Update related user/profile documents or counters
//     //6. Respond with 201 and the created tweet JSON

//     const { content } = req.body;
//     console.log("content=>", content, req.file);
//     // const { fileContainer } = req.file;
//     // const user = await User.findById(req?.user._id)
//     // console.log("create Tweets including fileContainer :- ", content, user)
//     // if (!content.trim()) throw new ApiError(400, "twit is empty")
//     // if (!user) throw new ApiError(400, "Invalid User")

//     // const savedTweet = await Tweet.create({
//     //     content,
//     //     owner: user?._id
//     // })
//     // await User.findByIdAndUpdate(user?._id, { $inc: { tweetCount: 1 } })
//     // console.log(`saved tweets : ${savedTweet} `)

//     return res
//         .status(200)
//         .json(new ApiResponse(201, content, "Tweet post successfully"))
// })


const createTweet = asynchandler(async (req, res) => {
    //TODO: create tweet
    //1. Read tweet fields from req.body (e.g.content medea)
    //2. Get Authenticated userID from req.user.
    //3. Validate required field and return 400 if invalid
    //4. create and save the tweet document (e.g., tweet.create(...)).
    //5. (Optional) Update related user/profile documents or counters
    //6. Respond with 201 and the created tweet JSON

    const { content } = req.body;
    const user = await User.findById(req?.user._id)
    console.log("create Tweet :- ", content, user)
    if (!content.trim()) throw new ApiError(400, "twit is empty")
    if (!user) throw new ApiError(400, "Invalid User")

    const savedTweet = await Tweet.create({
        content,
        owner: user?._id
    })
    await User.findByIdAndUpdate(user?._id, { $inc: { tweetCount: 1 } })
    console.log(`saved tweets : ${savedTweet} `)

    return res
        .status(200)
        .json(new ApiResponse(201, savedTweet, "Tweet post successfully"))
})

const getUserTweets = asynchandler(async (req, res) => {
    // TODO: find tweet
    //1. Get User's ID from req.user or req.params 
    //2. Find all tweet by that User 
    //3. Populate User details in each tweets ( Optional ).
    //4. Sort tweets by created latest first.
    //5. Respons with 200 and the list of tweet in JSON

    const { userId } = req.params || req?.user._id;

    const tweets = await Tweet.find({ owner: userId }).populate("owner", "username name avatar").sort({ createdAt: -1 }) // this will give me all tweet as object form wraped with array
    console.log("PopulatedTweets==>", tweets)

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Get user's all Tweets with the sorting "))
})

const updateTweet = asynchandler(async (req, res) => {
    //TODO: update tweet
    //1. Get tweet Id from req.params
    //2. Get Updated Fields From req.body
    //3. Find the tweet by id in database
    //4. Check if the tweet exists
    //5. verify that logged-in user is the owner of the tweet
    //6. update the changes with the new data and save save changes
    //7. Respond with 200 and the update tweet data

    const { tweetId } = req.params;
    const { content } = req.body

    const tweet = await Tweet.findById(tweetId)
    // if (!tweet?.owner === currentUser?._id) console.log("Can't change this tweet")
    if (!tweet.owner.equals(req.user?._id)) {
        throw new ApiError(403, "Access denied: unauthorized user")
    }
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        })
    if (!updatedTweet) throw new ApiError(404, "tweet is not available")
    console.log("from 107 updateTweet ==> ", updatedTweet)

    return res
        .status(200)
        .json(new ApiResponse(201, updatedTweet, "Tweet Updated successfully"))
})

const deleteTweet = asynchandler(async (req, res) => {
    //TODO: delete tweet
    // 1. Get tweet ID from req.params
    // 2. Find the tweet by ID in the database
    // 3. Check if the tweet exists
    // 4. Verify that the logged-in user is the owner of the tweet
    // 5. Delete the tweet from the database
    // 6. Respond with 200 and a success message or deleted tweet info

    const { tweetId } = req.params;
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "Tweet not exists")
    if (!tweet?.owner?._id.equals(req?.user?._id)) {
        throw new ApiError(403, "Access denied: unauthorized user")
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    console.log("deletedTweet =>", deletedTweet)

    return res
        .status(200)
        .json(new ApiResponse(200, deletedTweet, "Tweet Deleted"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}