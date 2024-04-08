import mongoose , {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    try {
        const {channelId} = req.params
    
        if(!isValidObjectId(channelId))
        {
            throw new ApiError(400,"Invalid Channel")
        }
    
        const videos = await Video.find({channel:channelId})
        const subscribers = await Subscription.find({channel:channelId})
        const likes = await Like.find(video : {$in:videos})
        const totalviews = videos.reduce((acc,video)=>acc+video.views + 0)
        const totalsubscriber = subscribers.length
        const totalvideo = videos.length
        const totallikes = likes.length
    
        return res.status(200)
        .json(new ApiResponse(200,
            {
                totalviews,
                totalsubscriber,
                totalvideo,
                totallikes
            } ,
            "Channel stats retrived!"
            )
        )
    } catch (error) {
        throw new ApiError(500, "Error occured while retriveing the channel stats")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    try {
        
        const {channelId} = req.params
        if(!isValidObjectId(channelId)){
            throw new ApiError(400,"Invalid Channel Id")
        }

        const videos = await Video.findById({channel:channelId})

        return req.status(200)
        .json(new ApiResponse(200,videos,"Channel videos retireved successfully!"))

    } catch (error) {
        throw new ApiError(500,"Error occured while retriveing the channel videos")
    }
})

export {
    getChannelStats, 
    getChannelVideos
    }