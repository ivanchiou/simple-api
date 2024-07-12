import { Request, Response, NextFunction } from 'express';

export const fileSizeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024; // 10 MB
  let totalSize = 0;

  req.on('data', (chunk) => {
    totalSize += chunk.length;
    if (totalSize > maxSize) {
      res.status(413).json({ error: 'File too large' });
      req.destroy();
    }
  });

  next();
};
