const express = require('express')
const http = require('http')
const axios = require('axios')
const app = express()
const server = http.createServer(app)
const database = require('./config/database')
const apiUrl = 'https://api-mikrotik.linkdemo.web.id/api'
const cron = require('node-cron')
const { lastDayOfMonth } = require('date-fns')
const lastDayOfTheMonth = lastDayOfMonth(new Date())


function getFormatedTime(format) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    if (format == 'datetime') {
        format = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`    
    }

    if (format == 'date') {
        format = `${year}-${month}-${day}`
    }

    return format
}

async function interfaceList() {
    try {
        const url = '/router/interface/list/print'
        const params = {
            "uuid" : "1"
        }

        const response = await axios.post(apiUrl+url, params)
        const responseData = response.data.massage

        let arrData = []

        responseData.forEach((value, index) => {
            arrData.push(value.name)
        })

        return arrData
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
}

async function hitSocket() {
    try {
        const interfaces = await interfaceList()
        const url = '/router/interface/list/monitor/live'
        const params = {
            "uuid" : "d50a736a-6814-4da8-9a2e-540f72506e31",
            "ethernet" : interfaces
        }

        const response = await axios.post(apiUrl+url, params)

        console.log(response.data)
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
}

async function getAverageData() {
    try {
        const now = new Date()
        const currentHour = now.getHours()

        const url = '/router/logs/print'
        const params = {
            "uuid" : "d50a736a-6814-4da8-9a2e-540f72506e31",
            "date" : "2023-10-26",
            "time" : currentHour,
            "ethernet" : "ether1"
        }

        const response = await axios.post(apiUrl+url, params)

        const jsonString = response.data

        let newArray = jsonString.slice(1)
        let pushArr = []

        newArray.forEach((value, index) => {
            pushArr.push(value[0])
        })

        const jsonData = pushArr
        // Filter and map the 'rx-bits-per-second' values to integers
        const rxBitsPerSecondValues = jsonData.map(item => parseInt(item['rx-bits-per-second']))
        const txBitsPerSecondValues = jsonData.map(item => parseInt(item['tx-bits-per-second']))
        // Calculate the average
        const rxTotal = rxBitsPerSecondValues.reduce((acc, value) => acc + value, 0)
        const txTotal = txBitsPerSecondValues.reduce((acc, value) => acc + value, 0)

        const rxAvg = rxTotal / rxBitsPerSecondValues.length
        const txAvg = txTotal / txBitsPerSecondValues.length

        console.log(`Average 'rx-bits-per-second': ${rxAvg}`)
        console.log(`Average 'tx-bits-per-second': ${txAvg} - `+currentHour)

        let date = getFormatedTime('date')
        let datetime = getFormatedTime('datetime')

        const text = 'INSERT INTO analytics(rate_in, rate_out, date, created_at) VALUES($1, $2,$3, $4) RETURNING *'
        const values = [txAvg, rxAvg, date, datetime]
        await database.query(text, values)
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    } 
}

/* Membuat fungsi yang akan dijalankan setiap 10 detik */
async function runTask() {
    console.log('Tugas dijalankan setiap 10 detik')
    let data = await database.query("SELECT * FROM analytics")
    // let data = await database.query("TRUNCATE table analytics")
    console.log(data.rows)
}

async function interfacesInsert() {
    try {
        const url = '/router/interface/list/print'
        const params = {
            "uuid" : "1"
        }

        const response = await axios.post(apiUrl+url, params)
        const responseData = response.data.massage

        let arrData = []
        let date = getFormatedTime('date')
        let datetime = getFormatedTime('datetime')

        responseData.forEach((value, index) => {
            let obj = value

            arrData.push({
                ethername: obj['name'],
                rx_byte: obj['rx-byte'],
                tx_byte: obj['tx-byte'],
                date: date,
                created_at: datetime
            })
        })

        arrData.forEach( async (value, index) => {
            const text = 'INSERT INTO interfaces(ethername, tx_byte, rx_byte, date, created_at) VALUES($1, $2,$3, $4, $5) RETURNING *'
            const values = [value.ethername, value.rx_byte, value.tx_byte, value.date, value.created_at]
            await database.query(text, values)
        })

        console.log('Insert data successfully')
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
}

function scheduleEveryMinutes() {
    cron.schedule('* * * * *', () => {
        console.log('Tugas dijalankan setiap menit')
        setTimeout(scheduleEveryMinutes, 60000)
    })
}

function scheduleEveryHours() {
    cron.schedule('0 * * * *', () => {
        console.log('Tugas dijalankan setiap jam')
        getAverageData()
        setTimeout(scheduleEveryHours, 3600000)
    })
}

/* Membuat fungsi yang akan mengatur ulang penjadwalan setiap 10 detik */
function scheduleTask() {
    cron.schedule('*/10 * * * * *', () => {
        runTask()
        hitSocket()
        interfacesInsert()
        // Penjadwalan ulang tugas setiap 10 detik
        setTimeout(scheduleTask, 10000) // 10000 milidetik = 10 detik
    })
}

// Schedule a task to run on the first date of every month
cron.schedule('0 0 1 * *', () => {
    console.log('Task scheduled on the first date of the month')
    interfacesInsert()
})

// Define a cron job for the calculated last day of the month (at 00:00 AM).
cron.schedule(`0 0 ${lastDayOfTheMonth.getDate()} * *`, () => {
    console.log('Running a task on the last day of the month')
    interfacesInsert()
})

// Memulai penjadwalan tugas
scheduleTask()
scheduleEveryMinutes()
scheduleEveryHours()

app.get('/', (req, res) => {
    res.send('Running lifecycle of data insert')
})

server.listen(4000, () => {
  console.log('Running lifecycle of data insert')
})
