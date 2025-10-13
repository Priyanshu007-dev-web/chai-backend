const { response } = require("express")
const asynchandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err)=>next(err))
    }
}
export { asynchandler } 

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

