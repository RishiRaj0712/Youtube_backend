# Backend Project
### Database Model Schema :-

* [Model Link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

## OverView
This project is a backend application for a social media platform that combines features of YouTube and Twitter. It provides functionalities for users to upload, view, and interact with videos, as well as post and engage with tweets. <br>
Leave a star if you like.💖

## Key Features
* **User Authentication and Authorization:** Allows users to register, login, and manage their accounts securely. Authentication middleware ensures access control to specific routes based on user roles.
* **Video Management:** Enables users to upload videos with titles, descriptions, and thumbnails. Tracks views and likes for each video.
* **Commenting and Interaction:** Users can post comments on videos and tweets, as well as like them. Supports comment threads and replies for deeper interactions.
* **Tweeting and Timeline:** Allows users to post tweets with text content, which can be viewed and liked by others. A timeline feature displays tweets from followed users.
* **Playlist Creation and Management:** Users can create playlists to organize their favorite videos, with the ability to add or remove videos from playlists.
* **Cloudinary Integration:** Media files such as videos, thumbnails, avatars, and other assets are stored on Cloudinary. Integration includes upload and delete functions for managing media files.
* **Error Handling and Logging:** Implements error handling middleware to catch and handle errors throughout the application. Logging tracks application events and errors for debugging and monitoring purposes.

## Technologies Used
* Backend Framework: Node.js with Express.js
* Database: MongoDB with Mongoose
* Cloud Storage: Cloudinary
* Authentication: JSON Web Tokens (JWT) 
* Hash and store passwords: Bcrypt
* Middleware: Multer for file uploads, asyncHandler for error handling

## Project Structure
* **temp/public:** Public files directory.
* **src:** Source code directory.
    * **db:** Code to connect to the database.
    * **models:** Database schema definitions using Mongoose.
    * **controllers:** Functionality implementations.
    * **routes:** Route definitions to call controllers.
    * **middlewares:** Validation middlewares, authentication, etc.
    * **utils:** Reusable utility functions.
* **index.js:** Main entry point to connect to the database and start the server.
* **app.js:** Configuration settings for the Express application.
* **constants.js:** Enumerations, database name, etc.