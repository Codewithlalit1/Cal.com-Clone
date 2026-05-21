/**
 * Express Request type augmentation.
 * Adds `userId` to the Request object so TypeScript knows about it.
 */
declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

export {};
