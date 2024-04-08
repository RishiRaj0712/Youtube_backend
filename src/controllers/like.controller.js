import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    try {
        const {videoId} = req.params
        //TODO: toggle like on video
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalide videoId")
        }
        const user = req.user?._id
        const video = await Video.findById(videoId)
        const videoIsLiked = await Like.findOneAndDelete({
            likedBy : user , video:video
        })
        if(videoIsLiked){
            return res.status(200)
            .json(new ApiResponse(200, videoIsLiked , "Video liked removed"))
        }
    
        if(!videoIsLiked){
            const newlike = new Like({
                likedBy:user,
                video:video
            })
    
            const savelike = await newlike.save()
    
            return res.status(200)
            .json(new ApiResponse(200,savelike,"Video Liked"))
        }
    } catch (error) {
        throw new ApiError(500, "An error occured while liking the video")
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    try {
        const {commentId} = req.params
        //TODO: toggle like on comment
        if(!isValidObjectId(commentId)){
            throw new ApiError(400, "Invalid Comment Id")
        }
    
        const comment = await Comment.findById(commentId)
        const user = req.user?._id
        const commentIsLiked = await Comment.findOneAndDelete({
            likedBy:user , comment : comment
        })
    
        if(commentIsLiked){
            return res.status(200)
            .json(new ApiResponse(200, commentIsLiked , "Comment like removed"))
        }
    
        if(!commentIsLiked){
            const newlike = new Like({
                likedBy:user,
                comment :comment
            })
    
            const savelike = await newlike.save()
    
            return res.status(200)
            .json(new ApiResponse(200,savelike,"Comment liked"))
        }
    } catch (error) {
        throw new ApiError(500, "An error occured while liking the comment")
    }
    


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    
    try {
        const {tweetId} = req.params
    //TODO: toggle like on tweet
        if(!isValidObjectId(tweetId)){
            throw new ApiError(400, "Invalid Tweet Id")
        }
    
        const tweet = await Comment.findById(commentId)
        const user = req.user?._id
        const tweetIsLiked = await Comment.findOneAndDelete({
            likedBy:user , tweet:tweet
        })
    
        if(tweetIsLiked){
            return res.status(200)
            .json(new ApiResponse(200, tweetIsLiked , "Tweet like removed"))
        }
    
        if(!tweetIsLiked){
            const newlike = new Like({
                likedBy:user,
                tweet :tweet
            })
    
            const savelike = await newlike.save()
    
            return res.status(200)
            .json(new ApiResponse(200,savelike,"Tweet liked"))
        }
    } catch (error) {
        throw new ApiError(500, "An error occured while liking the tweet")
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    try {
        const user = req.user?._id

        const likedVideos = await Like.aggregate([
            {
                likedBy:user,
                video:{$exist:true}
            },
            {
                $lookup:{
                    from :"videos",
                    localField:"video",
                    foreignField:"_id",
                    as:"video"
                }
            },
            {
                $unwind:"$video"
            },
            {
                $project:{
                    _id:0,
                    video:1
                }
            }
        ])

        return res.status(200)
        .json(new ApiResponse(200,likedVideos,"Liked Videos"))
        
    } catch (error) {
        throw new ApiError(500,error , "An error occurred while getting liked videos")
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}