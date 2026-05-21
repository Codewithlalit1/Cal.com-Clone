// =============================================================================
// src/middleware/auth.ts — Dummy Authentication Middleware
//
// WHY THIS EXISTS:
//   The project spec says "No Login Required." In a production Cal.com clone
//   you would decode a JWT here, look up the user in the database, and attach
//   the user object to the request. Because we're skipping auth entirely,
//   we simply hardcode userId = 1 — the dummy admin that was seeded into the DB.
//
// HOW IT WORKS:
//   Express middleware is a function with the signature (req, res, next).
//   We mutate req.userId and then call next() to pass control to the route handler.
//
// HOW TO EXPLAIN IN AN INTERVIEW:
//   "This is a drop-in replacement for real JWT middleware. In production I'd
//    verify a Bearer token, decode the payload to get userId, and then call next().
//    Swapping this out for real auth requires no changes to any route handler."
// =============================================================================

import { Request, Response, NextFunction } from "express";

/**
 * Middleware that bypasses authentication by hardcoding the admin userId.
 *
 * Attaches `req.userId = 1` to every incoming request so that all route
 * handlers can use `req.userId` without knowing auth is mocked.
 */
export const dummyAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // In a real implementation this would be:
  //   const token = req.headers.authorization?.split(" ")[1];
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   req.userId = decoded.userId;
  req.userId = 1;
  next();
};
