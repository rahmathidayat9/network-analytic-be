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
const database = require('./config/database');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'storage/access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors({ origin: true }));
app.use(express.json());

app.use(apiRouter)

io.on('connection', async (socket) => {
    console.log('a user connected');
    setTimeout( async () => {
        streaming.getRateInData(socket);

        /* Interface */
        let interfaceEther = 'ether'
        for(let i = 1; i <= 16; i++) {
            streaming.getRateSpeed(socket, interfaceEther+i)
        }

        streaming.getRateSpeed(socket, 'sfp-sfpplus2')
        streaming.getRateSpeed(socket, 'sfp-sfpplus1')
        streaming.getRateSpeed(socket, 'bridge1')
        streaming.getRateSpeed(socket, 'l2tp-out1')

        streaming.cpuLoad(socket);
        streaming.ramLoad(socket);
        streaming.systemDiskLoad(socket);
        streaming.getHour(socket);
        
        try {
            // Select data
            const result = await database.query('SELECT * FROM users');
            const active_data = await database.query('SELECT COUNT(*) AS active FROM users WHERE lastseen_minute < 60');
            const nonactive_data = await database.query('SELECT COUNT(*) AS nonactive FROM users WHERE lastseen_minute > 60');

            /* Select Analytic Daily Data */
            // const daily_rate_in = await database.query('SELECT rate_in FROM analytics');
            // const daily_rate_out = await database.query('SELECT rate_out FROM analytics');

            // socket.emit('daily_rate_in', daily_rate_in.rows[0].rate_in);
            // socket.emit('daily_rate_out', daily_rate_out.rows[0].rate_out);

            // console.log(result);
            socket.emit('mqtt_active_count', active_data.rows[0].active);
            socket.emit('mqtt_nonactive_count', nonactive_data.rows[0].nonactive);
            socket.emit('mqtt_active', result.rows);
            socket.emit('mqtt_data', result.rows)
        } catch (error) {
            console.error('Error:', error);
        }
    }, 100);
    
    const intervals = [
        setInterval( async () => {
            streaming.getRateInData(socket);
            
            let interfaceEther = 'ether'
            for(let i = 1; i <= 16; i++) {
                streaming.getRateSpeed(socket, interfaceEther+i)
            }

            streaming.getRateSpeed(socket, 'sfp-sfpplus2')
            streaming.getRateSpeed(socket, 'sfp-sfpplus1')
            streaming.getRateSpeed(socket, 'bridge1')
            streaming.getRateSpeed(socket, 'l2tp-out1')
        }, 5000),

        setInterval( async () => {
            try {
                // Select data
                const result = await database.query('SELECT * FROM users');
                const active_data = await database.query('SELECT COUNT(*) AS active FROM users WHERE lastseen_minute < 60');
                const nonactive_data = await database.query('SELECT COUNT(*) AS nonactive FROM users WHERE lastseen_minute > 60');

                // console.log(result);
                socket.emit('mqtt_active_count', active_data.rows[0].active);
                socket.emit('mqtt_nonactive_count', nonactive_data.rows[0].nonactive);
                socket.emit('mqtt_active', result.rows);
                socket.emit('mqtt_data', result.rows)
            } catch (error) {
                console.error('Error:', error);
            }
        }, 10000),

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
