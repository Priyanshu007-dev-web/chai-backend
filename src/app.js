import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()

// middleware for the allow urls and configure settings
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// import routes
import userRouter from "./routes/user.routes.js"

// routes declaration
//avoiding "app.get() syntex becouse routes and controllers are defind into another folder
// Routes
app.use("/api/v1/users", userRouter);

// route's full figure 'http://localhost:8000/api/v1/users/register'
export { app }