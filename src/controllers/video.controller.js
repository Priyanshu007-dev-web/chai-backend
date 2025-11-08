import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinery.js";
import asynchandler from "../utils/asyncHandler.js";
import { v2 as cloudinary } from "cloudinary"
import { fileNameExtracter } from "../utils/fileNameExtracter.js";
import { response } from "express";

// Get all videos with query, sort, pagination
const getAllVideos = asynchandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: "i" };
    }
    if (userId && isValidObjectId(userId)) {
        filter.owner = userId;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
    console.log("filter from 30", filter);
    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("owner", "username avatar");

    const total = await Video.countDocuments(filter);

    return res.json(
        new ApiResponse(
            200,
            { videos, total, page: Number(page), limit: Number(limit) },
            "Videos fetched successfully"
        )
    );
});

const publishAVideo = asynchandler(async (req, res) => {

    // 9. Send a 201 success response with the created video data

    // 1. Extract title and description from req.body
    const { title, description } = req.body;
    const owner = req.user._id; // 2. Get the current user's ID from req.user
    // 3. Check if a video file is provided in req.file if not so give error3666
    if (!req.files?.videoFile) {
        throw new ApiError(400, "Video file is required");
    }

    // 4. Upload the video file to Cloudinary
    const videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path);

    // 7. Store the uploaded video URL and thumbnail URL in variables
    // 5. Verify that the video upload was successful
    if (!videoUpload?.url) {
        throw new ApiError(500, "Video upload failed");
    }
    // 6. thumbnail is provided, upload it to Cloudinary
    let thumbnailUrl = "";
    if (req.files.thumbnail[0]) {
        const thumbUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);
        thumbnailUrl = thumbUpload?.url || "";
    }

    // 8. Create a new video document in the database with title, description, URLs, and owner ID
    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUrl,
        duration: videoUpload.duration,
        isPublished: true,
        owner,
    });

    return res.status(201).json(new ApiResponse(200, video, "Video Uploaded successfully"));
});

const getVideoById = asynchandler(async (req, res) => {
    //TODO: get video by id
    // 1. Validate videoId from req.params...
    // 2. Find video from database by videoId...
    // 3. If video not found, throw error...
    // 4. (Optional) Populate owner details...
    // 5. Send success response with video data.
    const { videoId } = req.params;
    const foundVideo = await Video.findById(videoId).populate({ path: "owner", select: "username avatar email" })
    console.log("foundVideo=>", foundVideo)
    if (!foundVideo) throw new ApiError(404, "Video not available currenly")
    return res
        .status(200)
        .json(new ApiResponse(200, foundVideo, "Video fetched"))

});
// Remains auto deletion from cloudinary
const updateVideo = asynchandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    // 1. Get updated fields (title, description, thumbnail) from req.body
    // 2. Find the video by ID in the database
    // 3. Check if the video exists
    // 4. Verify that the logged-in user is the owner of the video..
    // 5. If a new thumbnail is provided, upload it to Cloudinary..
    // 6. Update the video document with the new details
    // 7. Save or return the updated video
    // 8. Respond with 200 and the updated video data
    const { videoId } = req.params;
    const { title, description } = req.body
    const thumbnailLocalPath = req.file.path || ""

    const video = await Video.findById(videoId)
    if (!videoId) throw new ApiError(404, "video is not existing")
    if (!req.user._id.equals(video.owner)) throw new ApiError(403, "Access denied: unauthorized user")
    let updatedThumbnail = ""
    let newVideoData = ""
    if (thumbnailLocalPath || title || description) { // if thumbnail is provided
        if (thumbnailLocalPath) {
            const prevThumbnail = fileNameExtracter(video?.thumbnail)
            await cloudinary.uploader.destroy(prevThumbnail) // fro delete the previouse thumbnail from cloudinary
            updatedThumbnail = await uploadOnCloudinary(thumbnailLocalPath) // upl on Cloud..
            // console.log("from 136 updatedThumbnail =>", updatedThumbnail)
        }

        const payload = {}
        if (updatedThumbnail) payload.thumbnail = updatedThumbnail?.url
        if (title) payload.title = title
        if (description) payload.description = description
        console.log("payload =>", payload)
        newVideoData = await Video.findByIdAndUpdate(
            video._id,
            {
                $set: payload
                // {
                //     ...payload
                //     // ...(updatedThumbnail?.url ? { thumbnail: updatedThumbnail.url } : {}),
                //     // ...(title ? { title } : {}),
                //     // ...(description ? { description } : {})
                // }

            }, { new: true }
        )
    }
    console.log(`from 136 updatedThumbnail => ${updatedThumbnail} \n newVideoData=> ${newVideoData}`)
    return res
        .status(201)
        .json(new ApiResponse(200, newVideoData, "Video updated successfully"))
});

const deleteVideo = asynchandler(async (req, res) => {
    //TODO: delete video
    // Step 1: Get videoId from req.params... 
    // Step 2: Find video by ID in database... 
    // Step 3: If not found, return 404 response ..
    // Step 4: Check if logged-in user is the video owner..
    // Step 5: If not authorized, return 403 response..
    // Step 6: Delete video file from storage (Cloudinary/local) //..
    // Step 7: Delete video record from database..
    // Step 8: Delete related data (comments, likes, etc.) if needed
    // Step 9: Send success response
    const { videoId } = req.params;

    const foundVideo = await Video.findById(videoId)
    if (!foundVideo) throw new ApiError(404, "This video is not available ")
    if (!foundVideo.owner._id.equals(req.user._id)) throw new ApiError(403, "Access denied: unauthorized user")

    const forDeleteThumbnail = fileNameExtracter(foundVideo.thumbnail)
    const videoCloudPath = fileNameExtracter(foundVideo.videoFile)
    await cloudinary.uploader.destroy(forDeleteThumbnail)
    await cloudinary.uploader.destroy(videoCloudPath, { resource_type: "video" })
    const deletedVideo = await Video.deleteOne({ _id: foundVideo._id })
    console.log("deletedVideo==>", deletedVideo)

    return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, " Remains Functionality"))

});

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId)
    console.log("video.isPublished =>", video.isPublished)

    const updatedIsPublishedStatus = await video.updateOne(
        {
            $set: {
                isPublished: !video.isPublished
            }
        },{new:true})
    
    const UpdatedVideoStatus = await Video.findById(videoId)

    return res
        .status(200)
        .json(new ApiResponse(200, UpdatedVideoStatus , "Status Changed successfully" ))
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};