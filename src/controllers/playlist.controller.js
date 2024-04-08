import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if(!name || !description){
        throw new ApiError(400, "Name and description are required")
    }

    const user = req.user?._id

    const playlist = await Playlist.create({
        name,
        description,
        owner: user
    })

    if(!playlist){
        throw new ApiError(500, "Failed to create playlist")
    }
    return res.status(200)
    .json(new ApiResponse(200, playlist,"Playlist created successfully!"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(isValidObjectId(userId)){
        return new ApiError(400, "Invalid User Id")
    }

    const playlist = await Playlist.find({owner:user}).populate("videos")

    if(!playlist){
        throw new ApiError(400,"No Playlist found")
    }
    return res.status(200)
    .json(new ApiResponse(200,playlist,"Playlist retrived successfully!"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }
    const playlist = await Playlist.findById(playlistId),populate("videos")

    if(!playlist){
        throw new ApiError(400, "No Playlist found")
    }

    return res.status(200)
    .json(new ApiResponse(200,playlist, "Playlist retrived successfully!"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Playlist and video are required!")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist Not found")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Video not found")
    }

    playlist.videos.push(video)
    await playlist.save()

    return res.status(200)
    .json(new ApiResponse(200,playlist,"Video added to playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)||!isValidObjectId(videoId)){
        throw new ApiError(400, "Playlist or video not found")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist not found")
    }

    const videoIndex = await playlist.videos.indexOf(videoId)
    if(videoIndex ===-1){
        throw new ApiError(400, "video not found in the playlist")
    }

    playlist.videos.splice(videoId,1)
    await playlist.save()

    return res.status(200)
    .json(new ApiResponse(200, playlist,"Video removed from the playlist successfully!"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400, "Playlist Not Found")
    }

    await playlist.remove()
    return res.status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully!"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, "Invalid Playlist!")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "Playlist Not Found!")
    }
    if(name){
        playlist.name = name
    }
    if(description){
        playlist.description = description
    }
    await playlist.save()

    return res.status(200)
    .json(new ApiResponse(200, playlist,"Playlist updated!"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}