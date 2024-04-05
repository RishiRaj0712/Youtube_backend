import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import  jwt  from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
  // STEPS
  // get user details from frontend
  // validation - not empty
  // check if user already exist from username,email
  // check for images, check for avator
  // upload them to cloudinary, avator
  // create user object - create entry in db
  // remove password and refrsh token field from response
  // check for user creation
  // return res

  const { fullName, email, password, username } = req.body;
  // console.log("email: ",email);

  if (
    [fullName, email, password, username].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "All feild are required!");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exist");
  }

  const avatorLocalPath = req.files?.avator[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatorLocalPath) {
    throw new ApiError(400, "avator is required!");
  }

  const avator = await uploadOnCloudinary(avatorLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avator) {
    throw new ApiError(400, "avator is required!");
  }

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password,
    avator: avator.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully!"));
});

const loginUser = asyncHandler(async (req,res) => {
    // req body ->data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required!")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    });

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)

    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid User credintials!")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   const options = {
    httpOnly : true,
    secure : true
   }

   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken,refreshToken
        },
        "User loggedIn Successfuly!"
    )
   )
});

// const logoutUser = asyncHandler(async (req,res)=>{
//     await User.findByIdAndUpdate(req.user._id,{
//         $set:{
//             refreshToken : undefined
//         }

//     },
//     {
//         new : true
//     }
//     )
//     const options = {
//         httpOnly : true,
//         secure : true
//        }

//     return res.status(200).clearCookie("accessToken",options)
//     .clearCookie("refreshToken",options)
//     .json(new ApiResponse(200,{},"User logged Out!"))
// });


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
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
});

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
  
    const options = {
      httpOnly:true,
      secure:true
    }
    const {accessToken,newrefreshToken} = await generateAccessAndRefereshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken)
    .cookie("refreshToken",newrefreshToken)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newrefreshToken},
        "Access token refreshed!"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }

});

const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid Password!")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res.status(200)
  .json(new ApiResponse(200,{},"Password changed successfully!"))

});

const getCurrentUser = asyncHandler(async (req,res)=>{
  return res.status(200)
  .json(200,req.user,"Current user fetched successfully!")
});

const updateUserDetails = asyncHandler(async(req,res)=>{
  const {fullName,email} = req.body

  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")
  }
  User.findByIdAndUpdate(req.user?._id,
     { $set:{
      fullName:fullName,
      email:email,

     }},
     {new:true}).select("-password")

     return res.status(200)
     .json(new ApiResponse(200,user,"Account updated successfully!"))
});

const updateUserAvator = asyncHandler(async(req,res)=>{
  const avatorLocalPath = req.file?.path

  if(!avatorLocalPath){
    throw new ApiError(400,"Avator is missing!")
  }

  const avator = await uploadOnCloudinary(avatorLocalPath)
  if(!avator.url){
    throw new ApiError(400,"Error while updating avator")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avator :avator.url
      }
    },
    {new:true
    }
  ).select("-password")

  return res.status(200)
  .json(
    new ApiResponse(200,user,"Avator updated successfully!")
  )
});

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path

  if(!avatorLocalPath){
    throw new ApiError(400,"CoverImage is missing!")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(400,"Error while updating CoverImage")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage :coverImage.url
      }
    },
    {new:true
    }
  ).select("-password")

  return res.status(200)
  .json(
    new ApiResponse(200,user,"CoverImage updated successfully!")
  )
});



export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvator,
    updateUserCoverImage
 };
