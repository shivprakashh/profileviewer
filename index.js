const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 4000;
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io")
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const TelegramBot = require("node-telegram-bot-api");
const OWNER_ID = 7552691384;
const url = "https://hello-2x7x.onrender.com";
const token = '7653082632:AAEY_OZpBZwOgsXKRLk56bO08smTLd8gNMo';
const { json } = require("stream/consumers");
require("dotenv").config();

// Rate limit configuration
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true, // Return rate limit info in the RateLimit-* headers
    legacyHeaders: false, // Disable the X-RateLimit-* headers
});

app.use(express.json());
app.use(cors());

// Create server
const server = http.createServer(app);

// Telegram bot setup
const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);
//const bot = new TelegramBot(token, { polling: true });
// POST endpoint for the bot webhook (no rate limiting here)
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Serve the index.html file
app.get("/", (req, resp) => {
    console.log(req.get("user-agent"), "this is person");
    const filePath = path.join(__dirname, "public", "index.html");
    resp.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error serving file:", err);
            resp.status(500).send("Server Error: Unable to serve index.html.");
        }
    });
});

// Initialize Socket.io
const io = socketio(server);

// User message timestamps object
const userMessageTimestamps = {};
const axios = require('axios');  // Import axios for HTTP requests

bot.on('photo', async (msg) => {
  if (msg.reply_to_message) {
    console.log("This photo was sent as a reply to:", msg.reply_to_message.text);
  }

  // Get the largest size photo
  const photo = msg.photo[msg.photo.length - 1];
  console.log("Photo file_id:", photo.file_id);

  const replyTo = msg.reply_to_message;
  const replyText = msg.caption || "[Photo with no caption]";

  if (replyTo && replyTo.text) {
    const match = replyTo.text.match(/\[(.+?)\]/);
    const socketId = match ? match[1] : null;

    if (socketId && io.sockets.sockets.get(socketId)) {
      try {
        // Get the file path from Telegram API using the file_id
        const fileInfo = await bot.getFile(photo.file_id);
        const filePath = fileInfo.file_path;

        // Construct the full file URL to download the image (this includes the bot token, but is not exposed to the client)
        const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${filePath}`;

        // Download the image as binary data (buffer) using axios
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });

        // Convert the image response data to a buffer
        const imageBuffer = Buffer.from(response.data);

        // Emit to the correct socket with the buffer and other data
        io.to(socketId).emit('reply', {
          text: replyText,
          imageBuffer: imageBuffer.toString('base64'),  // Send the image as a base64-encoded string
        });

        console.log(`✅ Sent reply to socket ${socketId}: ${replyText}`);
        console.log(`🖼️ Image Buffer (Base64):`, imageBuffer.toString('base64'));
      } catch (err) {
        console.error("❌ Error fetching photo from Telegram:", err);
      }
    } else {
      console.log('❌ Invalid or disconnected socket ID');
    }
  } else {
    console.log('ℹ️ Not a reply to a user message. Ignored.');
  }
});

  
bot.on('message', (msg) => {
     console.log("entering into reply message")
   if(!msg.photo){
    const replyText = msg.text;
    const replyTo = msg.reply_to_message;
 
    if (replyTo && replyTo.text) {
      // Extract socket ID from the original message
      const match = replyTo.text.match(/\[(.+?)\]/);
      const socketId = match ? match[1] : null;
  
      if (socketId && io.sockets.sockets.get(socketId)) {
        // Send back reply to that socket
        io.to(socketId).emit('reply', {
          text: replyText
        });
        console.log(`✅  Sent reply to socket ${socketId}: ${replyText}`);
      } else {
        console.log('❌ Invalid or disconnected socket ID');
      }
    } else {
      console.log('ℹ️ Not a reply to a user message. Ignored.');
    }
   }
  });

// Socket.io event handler
io.on('connection', (socket) => {
    console.log(socket.id, "A user is connected");
    bot.sendMessage(OWNER_ID,`[${socket.id}] a user is connected!`);
    // Apply rate limiting only to message events (for socket)
    socket.on("message", (d) => {
        const now = Date.now();
        const lastTime = userMessageTimestamps[socket.id] || 0;

        // Allow 1 message every 3 seconds
        if (now - lastTime < 3000) {
            socket.emit("alert", { message: "You're sending messages too quickly. Chill!" });
            return;
        }

        userMessageTimestamps[socket.id] = now;

        try {
            bot.sendMessage(OWNER_ID,`[${socket.id}] ${d.message}`);
            socket.emit("alert", { message: "Successfully sent to Thet Naing Tun." });
        } catch (error) {
            socket.emit("alert", { message: "Error in Telegram sending" });
        }
    });

    // Handle photo event
    socket.on("photo", (d) => {
        console.log("photo", d.fileName);
        try {
            const fileBuffer = Buffer.from(d.buffer);
            const options = { filename: d.fileName, contentType: d.mimeType };
            bot.sendPhoto(OWNER_ID, fileBuffer, { caption:` [${socket.id}]` }, options);
            socket.emit("alert", { message: "Successfully sent to Thet Naing Tun." });
        } catch (error) {
            socket.emit("alert", { message: "Error in Telegram sending" });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        console.log(socket.id, "user is disconnected");
    });
});

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
}); 