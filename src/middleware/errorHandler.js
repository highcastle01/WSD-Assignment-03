// middleware/errorHandler.js
class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    if (process.env.NODE_ENV === 'development') {
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    } else {
      // Production mode
      if (err.isOperational) {
        res.status(err.statusCode).json({
          status: err.status,
          message: err.message
        });
      } else {
        // Programming or other unknown errors
        console.error('ERROR 💥', err);
        res.status(500).json({
          status: 'error',
          message: '서버 내부 오류가 발생했습니다.'
        });
      }
    }
  };
  
  // 비동기 에러 처리를 위한 wrapper
  const catchAsync = fn => {
    return (req, res, next) => {
      fn(req, res, next).catch(next);
    };
  };
  
  module.exports = {
    AppError,
    errorHandler,
    catchAsync
  };