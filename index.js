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

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: { message: "Too many requests, please try again later." },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter)
const server = http.createServer(app)
app.use(express.json());

// Allow all origins for CORS (can be restricted in production)
app.use(cors());
const bot = new TelegramBot(token);
bot.setWebHook(`${url}/bot${token}`);

app.post(`/bot${token}`,limiter, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Route to serve the index.html file
app.get("/", (req, resp) => {
    console.log(req.get("user-agent"),"this is person")
    const filePath = path.join(__dirname, "public", "index.html");


    resp.sendFile(filePath, (err) => {
        if (err) {
            console.error("Error serving file:", err);
            resp.status(500).send("Server Error: Unable to serve index.html.");
        }
    });
});

const io = socketio(server);


io.on('connection',(socket)=>{
   
    console.log(socket.id,"A user is connected")
    const userMessageTimestamps = {};
socket.on("message",(d)=>{
    console.log("hi",userMessageTimestamps);
    const now = Date.now();
    const lastTime = userMessageTimestamps[socket.id] || 0;

    // Allow 1 message every 3 seconds
    if (now - lastTime < 3000) {
        socket.emit("alert", { message: "You're sending messages too quickly. Chill!" });
        return;
    }

    userMessageTimestamps[socket.id] = now;
try{
    bot.sendMessage(OWNER_ID, `Hello viewer : "${d.message}"`);
    socket.emit("alert",{message:"successfully send to thet naing tun."})
}catch(error){
    socket.emit("alert",{message:"error in telegram sending"})
}
   
})
socket.on("photo",(d)=>{
    console.log("photo",d.fileName);
 try{
    const fileBuffer = Buffer.from(d.buffer);
    const options = {filename:d.fileName,contentType:d.mimeType}
    bot.sendPhoto(OWNER_ID,fileBuffer, { caption:"Send from hello viewer" }
        ,options
    );
    socket.emit("alert",{message:"successfully send to thet naing tun."})
 } catch(error){
    socket.emit("alert",{message:"error in telegram sending"})
 }
})
    socket.on('disconnect', async ()=>{
       console.log(socket.id,"user is disconnected")
    })
})

// socket ended




// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});
