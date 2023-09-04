const express = require('express');
const http = require('http');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const apiRouter = require('./routes/api');
const streaming = require('./streaming/socket');
const { Server } = require("socket.io");
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'storage/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors({ origin: true }));
app.use(express.json());

app.use(apiRouter)

io.on('connection', (socket) => {
    console.log('a user connected');
    setTimeout(() => {
        streaming.getRateInData(socket);
        streaming.cpuLoad(socket);
        streaming.ramLoad(socket);
        streaming.systemDiskLoad(socket);
        streaming.getHour(socket);
    }, 100);
    
    const intervals = [
        setInterval(() => {
            streaming.getRateInData(socket);
        }, 5000),

        setInterval(() => {
            streaming.cpuLoad(socket);
            streaming.ramLoad(socket);
            streaming.systemDiskLoad(socket);
        }, 25000),

        setInterval(() => {
            streaming.getHour(socket);
        }, 30000),
    ];

    socket.on('disconnect', () => {
        console.log('user disconnected');
        intervals.forEach(clearInterval);
    });
});

server.listen(PORT, () => {
    console.log(`Listening on *:${PORT}`);
});
