import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid Video")
    }
    const {page = 1, limit = 10} = req.query

    const comment = await Comment.aggregate([
        {
            $match:{
                video : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (page-1)*limit
        },
        {
            $limit:limit
        },
        {
            $lookup:{
                from:"user",
                localField:"owner",
                foreignField:"_id",
                as : "owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avator:1
                            }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"like",
                localField:"_id",
                foreignField:"comment",
                as : "totalLikesOnComment"
            }
        },
        {
            $addFields:{
                likedByUser:{
                    $in:[req.user?._id,"$totalLikesOnComment.likedBy"]
                }
            }
        },
        {
            $group:{
                _id: "_id",
                content:{$first:"content"},
                video:{$first:"video"},
                owner:{$first:"owner"},
                createdAt:{$first:"createdAt"},
                updatedAt:{$first:"updatedAt"},
                totalLikesOnComment:{$sum:{$size:"totalLikesOnComment"}},
                likedByUser:{$first:"likedByUser"}
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                isOwner: {
                    $cond: {
                        if: { $eq: [req.user?._id, { $arrayElemAt: ["$owner._id", 0] }] },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ])

    if(!comment){
        throw new ApiError(400,"No Comment found")
    }

    return res.status(200)
    .json( new ApiResponse(200,comment, "Comment retrived"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {videoId} = req.params
    const {content} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, " Invalid VideoId")
    }

    if(!content){
        throw new ApiError(400, "Please provide comment")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video Not Found!")
    }

    const user = req.user?._id

    const comment = await Comment.create({
        content,
        video,
        owner:user
    })

    const postedComment = await Comment.findById(comment._id)

    if(!postedComment){
        throw new ApiError(500,"Failed to add Comment")
    }

    return res.status(200)
    .json(new ApiResponse(200,comment, "Comment added Susscessfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params
    const {content} = req.body
    const user = req.user?._id

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment Id")
    }

    if(!content){
        throw new ApiError(400,"Please provide a content")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400,"Comment not found")
    }
    if(comment.owner.toString() !== user.toString()){
        throw new ApiError(400, "You are not allowed to update this comment")
    }
    const updatedComment = await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content:content
        }
    },{new : true}
    )
    if(!updateComment){
        throw new ApiError(500, "Failed to update comment")
    }

    return res.status(200)
    .json(new ApiResponse(200, comment, "Comment updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params,
    const user = req.user?._id

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid CommentId")
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400, "Comment Not found")
    }

    if(comment.owner.toString()!==user.toString()){
        throw new ApiError(400, "you are not allowed to delete this comment")
    }

    try {
        await Comment.findByIdAndDelete(commentId)
        await Like.findByIdAndDelete({$comment : commentId})
    
        if(isValidObjectId(commentId)){
            throw new ApiError(500,"Failed to delete the comment")
        }
    
        return res.status(200)
        .json(new ApiResponse(200, "Comment deleted Susseccfully"))
    } catch (error) {
        throw new ApiResponse(500, "Failed to delete the comment")
    }

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }