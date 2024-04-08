import mongoose, {isValidObjectId, mongo} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }

    const thisuser = req.user?._id
    const thisChannel = await User.findById(channelId)
    if(!thisChannel){
        throw new ApiError(400, "Channel not found")
    }

    const subscribe = await Subscription.findOneAndDelete({
        subscriber:thisuser,
        channel:thisChannel
    })

    if(subscribe){
        return res.status(200)
        .json(new ApiResponse(200, subscribe,"You have been unsubscribed to this channel!"))
    }

    if(!subscribe){
        const subscription = await Subscription.create({
            subscriber:thisuser,
            channel:thisChannel
        })

        const createdSubscription = await Subscription.findById(subscription._id)

        if(!createdSubscription){
            throw new ApiError(500, "Error while subscribing this channel")
        }

        return res.status(200)
        .json(new ApiResponse(200, createdSubscription, "You have been subscribed to this channel!"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const user= await User.findById(req.user?._id)
    const thisChannel = await user.findById(channelId)

    if(!thisChannel){
        throw new ApiError(400, "Channel doenot exist!")
    }

    if(thisChannel.owner.toString()!==user.toString()){
        throw new ApiError(400, "You are not the owner of this channel so, can't check the subsriber")
    }

    const subscriberList = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            //using facet to improve performance incase of large dataset as this makes sub piplines and performs parralel operation without waiting for results of previous stage
            $facet: {
                subscribers: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "subscriber",
                            foreignField: "_id",
                            as: "subscriber",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        createdAt: 1,
                                        updatedAt: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            subscriber: {
                                $first: "$subscriber"
                            }
                        }
                    }
                ],
                subscribersCount: [
                    { $count: "subscribers" }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200, subscriberList[0]),"Subscriber list fetched")

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber Id")
    }

    if(req.user?._id.toString() !== channelId.toString()){
        throw new ApiError(400, "Permission denied!")
    }

    const subscribedChannel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $facet: {
                channelsSubscribedTo: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "channel",
                            foreignField: "_id",
                            as: "channel",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                        createdAt: 1,
                                        updatedAt: 1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            channel: {
                                $first: "$channel"
                            }
                        }
                    }
                ],
                channelsSubscribedToCount: [
                    { $count: "channel" }
                ]
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200, subscribedChannel[0],"Channel subscribed by channel fetched successfully!"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}