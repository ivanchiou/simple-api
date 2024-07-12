import express from 'express';
import multer from 'multer';
import { rateLimitMiddleware } from './rateLimitMiddleware';
import { fileSizeMiddleware } from './fileSizeMiddleware';

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
