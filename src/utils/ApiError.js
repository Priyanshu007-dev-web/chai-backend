// file is dedicate to the fram and structure errors 
class ApiError extends Error {
    constructor(
        statusCode,
        massage = "Something Went Wrong",
        errors = [],
        stack = ""
        
    ) {
        super(massage)
        this.statusCode = statusCode
        this.data = null 
        this.massage = massage
        this.success = false
        this.errors = errors

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}