import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
// import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
})


export { 
    registerUser,
    loginUser,
    logoutUser
 };
