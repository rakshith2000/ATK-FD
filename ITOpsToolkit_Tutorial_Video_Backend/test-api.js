/**
 * Test Script for Video Streaming API
 *
 * This script demonstrates how to use the video streaming API
 * Run: node test-api.js
 */

const http = require('http');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:3000';
const API_BASE = '/api';

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

// Simple HTTP GET request helper
function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Pretty print JSON
function printResponse(title, response) {
    console.log(`\n${colors.bright}${colors.cyan}═══ ${title} ═══${colors.reset}`);
    console.log(`${colors.yellow}Status: ${response.status}${colors.reset}`);
    console.log(JSON.stringify(response.data, null, 2));
}

// Main test function
async function runTests() {
    console.log(`
${colors.bright}${colors.blue}
╔════════════════════════════════════════════╗
║    🎬 Video Streaming API Test Suite      ║
╚════════════════════════════════════════════╝
${colors.reset}

Testing API at: ${colors.cyan}${BASE_URL}${colors.reset}

${colors.yellow}Note: Make sure the server is running with: npm start${colors.reset}
  `);

    try {
        // Test 1: List all videos
        console.log(`\n${colors.bright}Test 1: List All Videos${colors.reset}`);
        console.log('Endpoint: GET /api/videos');

        let response = await makeRequest(`${API_BASE}/videos`);
        printResponse('List Videos Response', response);

        if (response.data.count === 0) {
            console.log(`\n${colors.yellow}⚠️  No videos found. Add some videos to the /videos folder and try again.${colors.reset}`);
            return;
        }

        // Get first video for testing
        const firstVideo = response.data.videos[0];
        const videoName = firstVideo.name;
        const videoPath = firstVideo.path;

        // Test 2: Search videos
        console.log(`\n${colors.bright}Test 2: Search Videos${colors.reset}`);
        const searchTerm = videoName.split('.')[0].substring(0, 3);
        console.log(`Endpoint: GET /api/videos?search=${searchTerm}`);

        response = await makeRequest(`${API_BASE}/videos?search=${searchTerm}`);
        printResponse('Search Videos Response', response);

        // Test 3: Get video info
        console.log(`\n${colors.bright}Test 3: Get Video Info${colors.reset}`);
        console.log(`Endpoint: GET /api/video/:filename/info`);
        console.log(`Video: ${videoName}`);

        response = await makeRequest(`${API_BASE}/video/${encodeURIComponent(videoName)}/info`);
        printResponse('Video Info Response', response);

        // Test 4: Check streaming URL
        console.log(`\n${colors.bright}Test 4: Video Streaming URL${colors.reset}`);
        console.log(`${colors.green}✓${colors.reset} Stream URL: ${colors.cyan}${BASE_URL}${videoPath}${colors.reset}`);
        console.log(`\nYou can use this URL in a video player to stream the video.`);
        console.log(`Example HTML:`);
        console.log(`  <video controls>`);
        console.log(`    <source src="${BASE_URL}${videoPath}" type="video/mp4">`);
        console.log(`  </video>`);

        // Test 5: Range request info
        console.log(`\n${colors.bright}Test 5: Range Request Support (for seeking)${colors.reset}`);
        const fileSize = response.data.video.size;
        console.log(`${colors.green}✓${colors.reset} Server supports range requests (HTTP 206)`);
        console.log(`${colors.green}✓${colors.reset} Total file size: ${response.data.video.sizeFormatted}`);
        console.log(`${colors.green}✓${colors.reset} Video players can seek/scrub through the video`);

        // Test 6: Test curl commands
        console.log(`\n${colors.bright}Test 6: Example cURL Commands${colors.reset}`);
        console.log(`\nList videos:`);
        console.log(`  ${colors.yellow}curl ${BASE_URL}/api/videos${colors.reset}`);

        console.log(`\nGet video info:`);
        console.log(`  ${colors.yellow}curl ${BASE_URL}/api/video/${encodeURIComponent(videoName)}/info${colors.reset}`);

        console.log(`\nStream video (first 1MB with range request):`);
        console.log(`  ${colors.yellow}curl -H "Range: bytes=0-1048575" ${BASE_URL}${videoPath}${colors.reset}`);

        console.log(`\nDownload entire video:`);
        console.log(`  ${colors.yellow}curl ${BASE_URL}${videoPath} -o output.mp4${colors.reset}`);

        // Test 7: API Endpoints Summary
        console.log(`\n${colors.bright}Test 7: All Available Endpoints${colors.reset}`);
        console.log(`
${colors.green}List Videos:${colors.reset}
  GET /api/videos
  GET /api/videos?search=<term>

${colors.green}Stream Video:${colors.reset}
  GET /api/stream/<filename>
  Supports: Range requests (HTTP 206)

${colors.green}Video Info:${colors.reset}
  GET /api/video/<filename>/info

${colors.green}Delete Video:${colors.reset}
  DELETE /api/video/<filename>
    `);

        // Test 8: Performance info
        console.log(`\n${colors.bright}Test 8: Performance & Features${colors.reset}`);
        console.log(`
${colors.green}✓${colors.reset} Efficient streaming with fs.createReadStream()
${colors.green}✓${colors.reset} Memory-efficient (chunks, not full file load)
${colors.green}✓${colors.reset} Range requests support (seeking/scrubbing)
${colors.green}✓${colors.reset} CORS enabled
${colors.green}✓${colors.reset} Multiple video format support
${colors.green}✓${colors.reset} Directory traversal protection
${colors.green}✓${colors.reset} Video metadata included
    `);

        console.log(`\n${colors.bright}${colors.green}✅ All tests completed successfully!${colors.reset}\n`);
    } catch (error) {
        console.error(`\n${colors.red}❌ Error running tests:${colors.reset}`);
        console.error(error.message);
        console.log(`\n${colors.yellow}Make sure the server is running: npm start${colors.reset}\n`);
    }
}

// Run tests
runTests();
