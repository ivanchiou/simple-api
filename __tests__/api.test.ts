// __tests__/api.test.ts
import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { rateLimitMiddleware } from '../src/rateLimitMiddleware';
import { fileSizeMiddleware } from '../src/fileSizeMiddleware';

const app = express();
const upload = multer({
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

app.get('/', (req, res) => {
  res.json({ success: true });
});

app.post('/upload', rateLimitMiddleware, fileSizeMiddleware, upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully' });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

describe('GET /', () => {
  it('should return success true', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe('POST /upload', () => {
  it('should reject non-PDF files', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', Buffer.from('not a pdf'), 'test.txt');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Only PDF files are allowed' });
  });

  it('should accept PDF files', async () => {
    const res = await request(app)
      .post('/upload')
      .attach('file', Buffer.from('%PDF-1.4'), 'test.pdf');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'File uploaded successfully' });
  });

  it('should reject large files', async () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);
    const res = await request(app)
      .post('/upload')
      .attach('file', largeBuffer, 'large.pdf');
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'File too large' });
  });

  it('should limit the number of requests per minute', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/upload')
        .attach('file', Buffer.from('%PDF-1.4'), 'test.pdf');
    }
    const res = await request(app)
      .post('/upload')
      .attach('file', Buffer.from('%PDF-1.4'), 'test.pdf');
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: 'Too many requests' });
  });
});
