import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req,res) => {
    res.status(200).json({
        message: "6 Months rukja! Bhai ki placement lagne wali h."
    })
})

export{registerUser,}