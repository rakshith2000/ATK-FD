# 🚀 Quick Start Guide

Get your video streaming server running in less than 5 minutes!

## Step 1: Install Node.js (if not already installed)

Download from: https://nodejs.org/ (LTS version recommended)

Verify installation:

```bash
node --version
npm --version
```

## Step 2: Set Up the Project

### Option A: Copy all files to a folder

Create a folder and copy these files:

```
my-video-server/
├── video-server.js      (the main server)
├── package.json         (dependencies)
├── test-api.js          (test script)
├── README.md            (documentation)
├── QUICK_START.md       (this file)
├── .gitignore
└── public/
    └── index.html       (web interface)
```

### Option B: Clone or download

If you have these files already, just navigate to the folder:

```bash
cd my-video-server
```

## Step 3: Install Dependencies

```bash
npm install
```

This will install:

- **express** - Web server framework
- **cors** - Enable cross-origin requests

Wait for installation to complete (~1-2 minutes).

## Step 4: Add Video Files

Create a `videos` folder in your project:

```bash
mkdir videos
```

Add your video files to this folder. Supported formats:

- `.mp4` (most common)
- `.webm`
- `.avi`
- `.mov`
- `.mkv`

Example structure:

```
my-video-server/
├── videos/
│   ├── sample.mp4
│   ├── demo.webm
│   └── movie.avi
├── public/
├── video-server.js
└── package.json
```

## Step 5: Start the Server

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════╗
║     🎬 Video Streaming Server Started      ║
╚════════════════════════════════════════════╝

📺 Server Running at: http://localhost:3000
📁 Videos Directory: /path/to/videos

✅ Server is ready!
```

## Step 6: Access the Web Interface

Open your browser and go to:

👉 **http://localhost:3000**

You should see:

- A video player on the left
- A list of videos on the right
- Play buttons to stream each video

## 🎯 What You Can Do Now

### From Web Interface (http://localhost:3000)

1. **View all videos** - Automatically listed from `/videos` folder
2. **Search videos** - Type in search box to filter by name
3. **Play videos** - Click "Play" button to stream
4. **Enter custom URL** - Paste streaming URL to play from anywhere

### From Command Line (cURL)

List videos:

```bash
curl http://localhost:3000/api/videos
```

Get specific video info:

```bash
curl http://localhost:3000/api/video/sample.mp4/info
```

Download a video:

```bash
curl http://localhost:3000/api/stream/sample.mp4 -o downloaded.mp4
```

### From Your Code (JavaScript, Python, etc.)

**JavaScript:**

```javascript
// Get list of videos
fetch('http://localhost:3000/api/videos')
    .then((r) => r.json())
    .then((data) => console.log(data.videos));

// Stream in video element
const video = document.querySelector('video');
video.src = 'http://localhost:3000/api/stream/sample.mp4';
```

**Python:**

```python
import requests

# Get video list
response = requests.get('http://localhost:3000/api/videos')
videos = response.json()

# Stream video
stream_url = 'http://localhost:3000/api/stream/sample.mp4'
```

## 📋 API Reference (Quick)

| Endpoint                    | Method | Description        |
| --------------------------- | ------ | ------------------ |
| `/api/videos`               | GET    | List all videos    |
| `/api/videos?search=term`   | GET    | Search videos      |
| `/api/stream/:filename`     | GET    | Stream video file  |
| `/api/video/:filename/info` | GET    | Get video metadata |
| `/api/video/:filename`      | DELETE | Delete a video     |

## 🧪 Test the Server

Run the test script to verify everything works:

```bash
node test-api.js
```

This will:

- ✅ List all videos
- ✅ Search for videos
- ✅ Get video information
- ✅ Show streaming URLs
- ✅ Verify range request support
- ✅ Display example cURL commands

## 🛠️ Troubleshooting

### "Port 3000 is already in use"

Change the port in `video-server.js`:

```javascript
const PORT = 3001; // Use 3001 instead
```

Then access: http://localhost:3001

### "No videos found"

1. Create `/videos` folder
2. Add video files to the folder
3. Refresh the web page

### "Cannot connect to server"

1. Ensure server is running: `npm start`
2. Check you're accessing: http://localhost:3000 (not https)
3. Check firewall isn't blocking port 3000

### Video won't play

1. Check browser console (F12) for errors
2. Verify video file exists and isn't corrupted
3. Try a different video format

### Module not found errors

Run: `npm install` again to ensure all dependencies are installed

## 🎬 Example: Create a Sample Video

If you don't have test videos, you can create one using FFmpeg:

```bash
# Create a simple test video (requires ffmpeg)
ffmpeg -f lavfi -i color=c=blue:s=320x240:d=10 -f lavfi -i sine=f=1000:d=10 test.mp4
```

Or download a sample:

```bash
# Download Big Buck Bunny sample (352 MB)
wget https://peach.blender.org/wp-content/uploads/2020/01/BBB_1080p_stereo_aac.mp4?token=2 -O sample.mp4
```

## 📊 Next Steps

### Development Mode (Auto-reload)

For development, use nodemon for auto-restart on file changes:

```bash
npm run dev
```

### Production Deployment

See [README.md](README.md) section "Deployment" for production setup.

### Advanced Configuration

- Change port number
- Change videos directory
- Add authentication
- Enable HTTPS
- Add compression
- See [README.md](README.md) for details

## ✅ Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `/videos` folder created
- [ ] Video files added to `/videos` folder
- [ ] Server started (`npm start`)
- [ ] Web interface opens at http://localhost:3000
- [ ] Videos appear in the list
- [ ] Can play videos
- [ ] cURL commands work

## 🎉 You're Ready!

Your video streaming server is now:

- ✅ Running
- ✅ Streaming videos efficiently
- ✅ Supporting seeking/scrubbing
- ✅ Serving from local files
- ✅ Ready for development or deployment

## 📞 Need Help?

1. Check the [README.md](README.md) for detailed documentation
2. Run `node test-api.js` to test the API
3. Check browser console (F12) for errors
4. Look at `video-server.js` comments for implementation details

---

**Happy streaming! 🎬**
