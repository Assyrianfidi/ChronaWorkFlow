/**
 * Middleware to handle 404 errors
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
    error: {
      statusCode: 404,
      message: "The requested resource was not found.",
    },
  });
};

module.exports = { notFoundHandler };
