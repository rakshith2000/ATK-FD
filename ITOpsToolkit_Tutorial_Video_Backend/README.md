# 🎬 Video Streaming Server

A Node.js Express server that streams videos efficiently using read streams and chunked delivery. Perfect for serving videos from a local directory with support for seeking, range
requests, and more.

## ✨ Features

- **Efficient Streaming**: Uses `fs.createReadStream()` for memory-efficient video delivery
- **Range Requests**: Full support for HTTP range requests (seeking in video players)
- **Video Listing**: API endpoint to list all available videos
- **Search**: Filter videos by name
- **Video Metadata**: Get file size, creation date, and other details
- **CORS Enabled**: Ready for cross-origin requests
- **Responsive UI**: Built-in web player with video list
- **Multiple Format Support**: MP4, WebM, AVI, MOV, MKV
- **Security**: Directory traversal protection
- **No Memory Overhead**: Streams don't load entire files into memory

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Videos

Create a `videos` folder in the project root and add your video files:

```
project-folder/
├── video-server.js
├── package.json
├── videos/
│   ├── movie1.mp4
│   ├── movie2.webm
│   └── demo.avi
└── public/
    └── index.html
```

### 3. Start the Server

```bash
# Production
npm start

# Development (with auto-reload using nodemon)
npm run dev
```

You should see:

```
╔════════════════════════════════════════════╗
║     🎬 Video Streaming Server Started      ║
╚════════════════════════════════════════════╝

📺 Server Running at: http://localhost:3000
📁 Videos Directory: /full/path/to/videos

📌 API Endpoints:
  • GET  /api/videos              - List all videos
  • GET  /api/videos?search=term  - Search videos
  • GET  /api/stream/:filename    - Stream video (with range support)
  • GET  /api/video/:filename/info - Get video info
  • DELETE /api/video/:filename   - Delete video

🌐 Open http://localhost:3000 in your browser to test!
```

### 4. Access the Application

Open your browser and go to: **http://localhost:3000**

## 📡 API Documentation

### 1. List All Videos

```http
GET /api/videos
```

**Response:**

```json
{
    "success": true,
    "count": 2,
    "videos": [
        {
            "id": "movie1.mp4",
            "name": "movie1.mp4",
            "size": 1048576000,
            "sizeFormatted": "1000 MB",
            "duration": "Unknown",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "path": "/api/stream/movie1.mp4"
        },
        {
            "id": "demo.webm",
            "name": "demo.webm",
            "size": 524288000,
            "sizeFormatted": "500 MB",
            "duration": "Unknown",
            "createdAt": "2024-01-14T15:45:00.000Z",
            "path": "/api/stream/demo.webm"
        }
    ]
}
```

### 2. Search Videos

```http
GET /api/videos?search=movie
```

Filter videos by name. Case-insensitive.

**Response:** Same as list endpoint, but filtered results

### 3. Stream Video (with Range Support)

```http
GET /api/stream/:filename
```

**Headers:**

- `Accept-Ranges: bytes` - Server supports range requests
- `Content-Type: video/mp4` - Video MIME type
- `Content-Length: <size>` - Total file size

**Range Request Example:**

```http
GET /api/stream/movie.mp4 HTTP/1.1
Range: bytes=0-1048575
```

**Response (206 Partial Content):**

```http
HTTP/1.1 206 Partial Content
Content-Range: bytes 0-1048575/1048576000
Content-Length: 1048576
Content-Type: video/mp4
```

### 4. Get Video Info

```http
GET /api/video/:filename/info
```

**Response:**

```json
{
    "success": true,
    "video": {
        "name": "movie.mp4",
        "size": 1048576000,
        "sizeFormatted": "1000 MB",
        "extension": ".mp4",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "modifiedAt": "2024-01-15T10:30:00.000Z",
        "streamUrl": "/api/stream/movie.mp4"
    }
}
```

### 5. Delete Video

```http
DELETE /api/video/:filename
```

**Response:**

```json
{
    "success": true,
    "message": "Video deleted"
}
```

## 💻 Using with cURL

### List videos

```bash
curl http://localhost:3000/api/videos
```

### Stream video (download to file)

```bash
curl http://localhost:3000/api/stream/movie.mp4 -o downloaded-movie.mp4
```

### Stream with range request (first 1MB)

```bash
curl -H "Range: bytes=0-1048575" http://localhost:3000/api/stream/movie.mp4
```

### Get video info

```bash
curl http://localhost:3000/api/video/movie.mp4/info
```

### Delete video

```bash
curl -X DELETE http://localhost:3000/api/video/movie.mp4
```

## 🔧 Advanced Configuration

### Change Port

Edit `video-server.js`:

```javascript
const PORT = 3001; // Change to desired port
```

### Change Videos Directory

Edit `video-server.js`:

```javascript
const VIDEO_DIR = path.join(__dirname, 'my-videos'); // Change directory
```

### Add More Video Formats

Edit the file extension filter in `video-server.js`:

```javascript
.filter(file => {
  const ext = path.extname(file.name).toLowerCase();
  return ['.mp4', '.webm', '.avi', '.mov', '.mkv', '.flv', '.m3u8'].includes(ext);
})
```

## 🛡️ Security Features

1. **Directory Traversal Protection**: Prevents access outside video directory
2. **Path Validation**: Ensures requested files are within allowed directory
3. **CORS Configuration**: Can be customized in middleware section
4. **No Direct File Access**: All files served through API endpoints

## 📊 How Streaming Works

### Without Streaming (❌ Not Recommended)

```
User Request → Load entire file into RAM → Send to browser
Problem: High memory usage, slow start, can crash on large files
```

### With Streaming (✅ Recommended)

```
User Request → Read file in chunks → Pipe directly to response
Benefit: Low memory, fast start, works with any file size
```

The server uses `fs.createReadStream()` which reads files in 64KB chunks by default:

```javascript
const stream = fs.createReadStream(filepath);
stream.pipe(res); // Data flows directly to client
```

## 🎯 Use Cases

- **Personal Video Library**: Stream personal movies/content
- **Educational Content**: Serve training videos
- **Backup Server**: Stream archived videos
- **Development/Testing**: Test video streaming applications
- **Internal Distribution**: Share videos within organizations

## 📝 Example Usage in Frontend

```javascript
// JavaScript
const videoUrl = '/api/stream/movie.mp4';
const video = document.querySelector('video');
const source = document.createElement('source');
source.src = videoUrl;
source.type = 'video/mp4';
video.appendChild(source);
video.play();
```

```html
<!-- HTML5 Video Tag -->
<video controls width="640" height="360">
    <source src="/api/stream/movie.mp4" type="video/mp4" />
    Your browser does not support the video tag.
</video>
```

## 🐛 Troubleshooting

### "ENOENT: no such file or directory"

- Ensure `videos` folder exists
- Check video file paths are correct

### "Cannot GET /api/videos"

- Ensure server is running (`npm start`)
- Check server is on `http://localhost:3000`

### Video won't play

- Check browser console for errors
- Verify video file is not corrupted
- Try different video format

### 404 on video playback

- Ensure video filename is URL-encoded correctly
- Check file exists in `/videos` folder

### CORS errors

- CORS is already enabled, but you can customize in `video-server.js`:
    ```javascript
    app.use(
        cors({
            origin: ['http://example.com'],
            credentials: true,
        }),
    );
    ```

## 🚀 Deployment

### Production Deployment

For production use, consider:

1. **Use a Reverse Proxy** (Nginx, Apache)

    ```nginx
    location /api/stream/ {
      proxy_pass http://localhost:3000;
      proxy_buffering off;
    }
    ```

2. **Enable Gzip Compression**

    ```javascript
    const compression = require('compression');
    app.use(compression());
    ```

3. **Add Rate Limiting**

    ```javascript
    const rateLimit = require('express-rate-limit');
    app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
    ```

4. **Use Environment Variables**
    ```javascript
    require('dotenv').config();
    const PORT = process.env.PORT || 3000;
    ```

## 📦 Dependencies

- **express**: Web framework
- **cors**: Enable CORS

## 📄 License

MIT

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Happy Streaming! 🎬**
