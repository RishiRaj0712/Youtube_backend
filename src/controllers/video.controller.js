import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
        //TODO: get all videos based on query, sort, pagination
    
        const sortTypeNum = Number(sortType) || -1;
        const pageNum = Number(page)
        const limitNum = Number(limit)
    
        if(userId && !isValidObjectId(userId)){
            throw new ApiError(400,"Invalid User id")
        }
    
        const getVideos = await Video.aggregate([
            {
                $match:{
                    owner:userId? userId:"",
                    isPublised : true,
                    $text:{
                        $search:query?query:""
                    }
                }
            },
            {
                $addFields:{
                    sortField:{
                        $toString: `$`+(sortBy||`createdAt`)
                    }
                }
            },
            {
                $facet:{
                    videos:[
                        {
                            $sort:{sortField:sortTypeNum}
                        },
                        {
                            $skip:(pageNum-1)*limitNum
                        },
                        {
                            $limit:limitNum
                        },
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as : "owner",
                                pipeline:[
                                    {
                                        $project:{
                                            username:1,
                                            avator:1,
                                            createdAt:1,
                                            updatedAt:1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$owner"
                                }
                            }
                        }
                    ],
                    matchedCount:[
                        {$count:"$videos"}
                    ]
                }
            }
        ])
    
        if(!getVideos[0].videos?.length){
            throw new ApiError(400,null, "Page not found")
        }
        if(!getVideos[0].matchedCount?length){
            throw new ApiError(400,null,"No videos found")
        }
    
        return res.status(200)
        .json(new ApiResponse(200,getVideos[0].videos,"Videos fetched successfully!"))
    } catch (error) {
        throw new ApiError(500, "An error occurred while fetching videos")
    }

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description , videoFile , thumbnail} = req.body
    // TODO: get video, upload to cloudinary, create video
    
    const owner = await User.findById(req.user._id)
    if(!owner){
        throw new ApiError(400, "User not found")
    }

    if(!videoFile || !thumbnail || !title || !description){
        throw new ApiError(400, "Please provide all required details")
    }

    const uploadedVideo = await uploadOnCloudinary(videoFile)
    const uploadedThumbnail = await uploadOnCloudinary(thumbnail)

    if(!uploadedThumbnail || !uploadedVideo){
        throw new ApiError(500, "Failed to upload the video!")
    }

    const newVideo = await Video.create({
        title,
        description,
        videoFile:uploadedVideo.secure_url,
        thumbnail:uploadedThumbnail.secure_url,
        duration:uploadedVideo.duration,
        isPublised:false,
        owner:owner._id
    })
    if(!newVideo){
        throw new ApiError(500, "An error occured while uploading the video")
    }

    return res.status(200)
    .json(new ApiResponse(200, newVideo,"Video uploaded successfully!"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }

    if(!video.isPublised){
        throw new ApiError(400, "Video is not published")
    }

    return res.status(200)
    .json(new ApiResponse(200, "Video fetched successfully!"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id")
    }
    const {title , description, thumbnail} = req.body
    const updatedVideo = await Video.findByIdAndUpdate(videoId,{
        title,
        description,
        thumbnail,
    },
    {
        new:true
    })
    if(!updatedVideo){
        throw new ApiError(500, "An error occurred while updating the video")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedVideo,"Video updated Successfully!"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    if(req.user._id!==video.owner.toString()){
        throw new ApiError(400, "Unathuorized!")
    }
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500, "An error occurred while deleting the video!")
    }

    return res.status(200)
    .json(new ApiResponse(200, "video deleted successfully!"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video Not found!")
    }
    if(req.user._id !== video.owner.toString()){
        throw new ApiError(400, "Unauthorized!")
    }
    if(video.isPublised){
        await Video.findByIdAndUpdate(videoId,{isPublised:false})
        return res.status(200)
        .json(new ApiResponse(200, "video unpublished successfully"))
    }else{
        await Video.findByIdAndUpdate(videoId,{isPublised:true})

        return res.status(200)
        .json(new ApiResponse(200, "Video published successfully!"))
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}