import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {Like} from "../models/like.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content || content.trim()===""){
        throw new ApiError(400, "Tweet can not be empty")
    }

    const user = req.user?._id

    const tweet = await Tweet.create({
        content :content,
        owner:user
    })

    const createdTweet = await Tweet.findById(tweet._id)

    if(!createTweet){
        throw new ApiError(500, "Failed to create tweet")
    }

    return res.status(200)
    .json(new ApiResponse(200,createdTweet,"Tweet created successfully!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(400, "User not found")
    }

    const tweet = await Tweet.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as : "tweetLikedBy"
            }
        },
        {
            $group:{
                _id:"$_id",
                content:{$first:"$content"},
                owner:{$first:"$owner"},
                createdAt:{$first:"$createdAt"},
                updatedAt:{$first:"$updatedAt"},
                totalLikes :{$sum:{$size:"$tweetLikedBy"}}
            }
        },
        {
            $sort:{
                updatedAt:-1
            }
        }
    ])

    if(!tweet?.length){
        throw new ApiError(400, "No tweet found")
    }

    const tweetedBy  =  await Tweet.aggregate([
        {
            $match:{
                _id:mongoose.Types.ObjectId(userId)
            }
        },
        {
            $addFields:{
                isTweetOwner:{
                    $cond:{
                        if:{
                            $eq:[res.user?._id.toString(),userId]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                username:1,
                fullName:1,
                avator:1,
                createdAt:1,
                updatedAt:1,
                isTweetOwner:1
            }
        }
    ])

    const tweetList = {
        tweet,
        tweetedBy
    }

    return res.status(200)
    .json(new ApiResponse(200,tweetList,"User tweets retrived successfully!"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId, content} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400, "Tweet not found!")
    }

    if(!content || content.trim()===""){
        throw new ApiError(400, "Tweet body cannot be empty")
    }

    const user = req.user?._id
    if(tweet.owner.toString()!==user.toString()){
        throw new ApiError(400, "You are not allowed to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,{
        content
    },
    {
        new :true
    })
    if(!updatedTweet){
        throw new ApiError(500, "Failed to update tweet")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully!"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }
    const user = req.user?._id
    if(!user){
        throw new ApiError(400, "Unathuorized")
    }
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(400, "Tweet not found!")
    }
    if(tweet.owner.toString()!==user.toString()){
        throw new ApiError(400, "You are not allowed to delete this tweet!")
    }

    try {
        await Tweet.findByIdAndDelete(tweetId)
        await Like.deleteMany({tweet:tweetId})
        return res.status(200)
        .json(new ApiResponse(500, "Tweet deleted succesfully!"))
    } catch (error) {
        throw new ApiError(500, "Failed to delete tweet")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}