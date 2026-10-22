const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            error: err.message,
        });
    }

    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// Video directory - store videos in this folder
const VIDEO_DIR = path.join(__dirname, 'videos');

// Create videos directory if it doesn't exist
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  console.log(`✅ Created videos directory at: ${VIDEO_DIR}`);
}

// ==================== ENDPOINTS ====================



// ==================== MULTER CONFIG ====================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, VIDEO_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [
        '.mp4',
        '.webm',
        '.avi',
        '.mov',
        '.mkv',
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 1024, // 1 GB
    },
});


/**
 * POST /api/upload
 * Upload a video file
 */
app.post('/api/upload', upload.single('video'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No video uploaded',
            });
        }

        res.status(201).json({
            success: true,
            message: 'Video uploaded successfully',
            video: {
                name: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                sizeFormatted: formatFileSize(req.file.size),
                path: `/api/stream/${encodeURIComponent(req.file.filename)}`,
            },
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload video',
        });
    }
});

/**
 * GET /api/videos
 * List all available videos with metadata
 */
app.get('/api/videos', (req, res) => {
  try {
    const query = req.query.search ? req.query.search.toLowerCase() : '';

    fs.readdir(VIDEO_DIR, { withFileTypes: true }, (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read video directory' });
      }

      // Filter video files and get metadata
      const videos = files
        .filter(file => {
          const ext = path.extname(file.name).toLowerCase();
          return ['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(ext);
        })
        .filter(file => !query || file.name.toLowerCase().includes(query))
        .map(file => {
          const filePath = path.join(VIDEO_DIR, file.name);
          const stats = fs.statSync(filePath);
          
          return {
            id: file.name,
            name: file.name,
            size: stats.size,
            sizeFormatted: formatFileSize(stats.size),
            duration: 'Unknown', // Duration detection would require ffprobe
            createdAt: stats.birthtime,
            path: `/api/stream/${encodeURIComponent(file.name)}`
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first

      res.json({
        success: true,
        count: videos.length,
        videos
      });
    });
  } catch (error) {
    console.error('Error in /api/videos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/stream/:filename
 * Stream video file with support for range requests
 * This handles efficient chunked streaming
 */
app.get('/api/stream/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(VIDEO_DIR, filename);

    // Security: Prevent directory traversal
    if (!filepath.startsWith(VIDEO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(filepath);
    const fileSize = stat.size;

    // Get the MIME type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska'
    };
    const mimeType = mimeTypes[ext] || 'video/mp4';

    // Handle range requests (important for video seeking)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validate range
      if (start >= fileSize || end >= fileSize || start > end) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }

      const chunkSize = end - start + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600'
      });

      const stream = fs.createReadStream(filepath, { start, end });
      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } else {
      // Send entire file with streaming
      res.set({
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      });

      const stream = fs.createReadStream(filepath);
      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    }
  } catch (error) {
    console.error('Error in /api/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * GET /api/video/:filename/info
 * Get detailed info about a specific video
 */
app.get('/api/video/:filename/info', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(VIDEO_DIR, filename);

    if (!filepath.startsWith(VIDEO_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const stat = fs.statSync(filepath);
    const ext = path.extname(filename).toLowerCase();

    res.json({
      success: true,
      video: {
        name: filename,
        size: stat.size,
        sizeFormatted: formatFileSize(stat.size),
        extension: ext,
        createdAt: stat.birthtime,
        modifiedAt: stat.mtime,
        streamUrl: `/api/stream/${encodeURIComponent(filename)}`
      }
    });
  } catch (error) {
    console.error('Error in /api/video info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/video/:filename
 * Delete a video file
 */
app.delete('/api/video/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const filepath = path.join(VIDEO_DIR, filename);
    const resolvedPath = path.resolve(filepath);
    const resolvedVideoDir = path.resolve(VIDEO_DIR);

    // Security: Prevent directory traversal (resolve both sides to catch '..' tricks)
    if (!resolvedPath.startsWith(resolvedVideoDir + path.sep)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    fs.access(resolvedPath, fs.constants.F_OK, (accessErr) => {
      if (accessErr) {
        return res.status(404).json({ success: false, error: 'Video not found' });
      }

      fs.unlink(resolvedPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting video:', unlinkErr);
          return res.status(500).json({ success: false, error: 'Failed to delete video' });
        }

        res.json({
          success: true,
          message: `Video "${filename}" deleted successfully`
        });
      });
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, error: 'Failed to delete video' });
  }
});

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format bytes to human-readable size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     🎬 Video Streaming Server Started      ║
╚════════════════════════════════════════════╝

📺 Server Running at: http://localhost:${PORT}
📁 Videos Directory: ${VIDEO_DIR}

📌 API Endpoints:
  • GET  /api/videos              - List all videos
  • GET  /api/videos?search=term  - Search videos
  • GET  /api/stream/:filename    - Stream video (with range support)
  • GET  /api/video/:filename/info - Get video info
  • DELETE /api/video/:filename   - Delete video

🌐 Open http://localhost:${PORT} in your browser to test!
  `);
});

module.exports = app;