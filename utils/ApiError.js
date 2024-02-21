class ApiError{
    constructor(statusCode, message){
        this.statusCode = statusCode
        this.message = message
        this.success = statusCode < 400
    }
}

export {ApiError}