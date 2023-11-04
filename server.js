const express = require('express')
const http = require('http')
const morgan = require('morgan')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const apiRouter = require('./routes/api')
const { Server } = require("socket.io")
require('dotenv').config()

const PORT = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'storage/access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))
app.use(cors({ origin: true }))
app.use(express.json())

app.use(apiRouter)

io.on('connection', async (socket) => {
    console.log('a user connected')
    
    const intervals = [
        setInterval( async () => {
            console.log('OKE')
        }, 10000),
    ]

    socket.on('disconnect', () => {
        console.log('user disconnected')
        intervals.forEach(clearInterval)
    })
})

server.listen(PORT, () => {
    console.log(`Listening on *:${PORT}`)
})
