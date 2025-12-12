import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/errorHandler.js";

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  next(
    new ApiError(
      `Can't find ${req.originalUrl} on this server!`,
      StatusCodes.NOT_FOUND,
    ),
  );
};

export default notFound;
