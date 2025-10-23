import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

// reusable method for upload media file on cloudinery
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file
        console.log("Response of Cloudinery from { cloudinery 21 } ==> ", response) // for study purpouse
        return response;
    } catch (error) {
        console.log("============>", error)
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the operation got failed
    }

}

//   cloudinary.v2.uploader.upload(" https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg ",
//   { public_id: "olympic_flag" },
//   function (error, result)  { console.log(result); });
export { uploadOnCloudinary }




// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';

// // Configuration
// cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Reusable upload function
// const uploadOnCloudinary = async (localFilePath) => {
//     try {
//         if (!localFilePath) return null;

//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: 'auto',
//         });

//         if (fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath);

//         console.log('Response from Cloudinary:', response);
//         return response;
//     } catch (error) {
//         console.error('Cloudinary upload error:', error);
//         if (fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath);
//         return null;
//     }
// };

// export { uploadOnCloudinary };
