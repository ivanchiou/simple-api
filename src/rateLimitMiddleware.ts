import { Request, Response, NextFunction } from 'express';

const rateLimitMap: Map<string, { count: number; lastRequestTime: number }> = new Map();

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const currentTime = Date.now();
  const requestLimit = 10;
  const timeWindow = 60 * 1000; // 1 minute

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, lastRequestTime: currentTime });
    return next();
  }

  const requestInfo = rateLimitMap.get(ip)!;
  if (currentTime - requestInfo.lastRequestTime > timeWindow) {
    requestInfo.count = 1;
    requestInfo.lastRequestTime = currentTime;
  } else {
    requestInfo.count++;
  }

  if (requestInfo.count > requestLimit) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  next();
};
