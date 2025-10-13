// import 'dotenv/config'
import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';
// manually path defind at of environmet varieble
dotenv.config({
    path: './env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`⚙️  Server is starting at the port ${process.env.PORT}`);
        })
        app.on("error",(error) => {
            console.log("server Error !!", error)
        })
    })
    .catch((error) => {
    console.log(`MONGODB Connection Failed !!${error}`)
})




/*import express from 'express';
const app = express();
; (async () => {
    
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`).then((res) => {
            console.log("connected succesfully with DB");
        })
        app.on("Error", (error) => {
            console.log("Err", error);
            throw error
        })
        app.listen(process.env.PORT, () => { console.log(`app is listening on the port ${process.env.PORT}`) });
    }
    catch (error) {
        console.error("Error => ", error)
        throw error
    }
})()*/
// 0 O I l