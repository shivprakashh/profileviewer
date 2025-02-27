const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 4000;
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io")
const fs = require("fs");

const { json } = require("stream/consumers");
require("dotenv").config();
const server = http.createServer(app)
app.use(express.json());

// Allow all origins for CORS (can be restricted in production)
app.use(cors());



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
   
socket.on("hi",(d)=>{
    console.log("hi",d)
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
