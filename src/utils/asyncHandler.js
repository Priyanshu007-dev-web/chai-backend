// const { response } = require("express")
// import express from "express";

// this is used for handle web request request.
const asynchandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}
export default asynchandler

// const asynchandler = (fn) => async(req, res, next) => {
//     try {

//     } catch (error) {
//         // here sir doing wrong in "error write err"
//         res.status(error.code || 500).json({
//             success: false,
//             message:error.message
//         })
//     }
// }


