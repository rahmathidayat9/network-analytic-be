const mqtt = require('mqtt');
const database = require('./config/database.js')
const helpers = require('./helpers.js')

/* HiveMq setup */
const brokerUrl = 'mqtt://broker.hivemq.com:1883';
const clientId = 'clientId-qj7stXp84Y';
const topic = 'mikrotik/admin';

const client = mqtt.connect(brokerUrl, { clientId });

client.on('connect', () => {
    console.log('Connected to the broker');
    client.subscribe(topic, (error) => {
        if (!error) {
            console.log(`Subscribed to ${topic}`);
        }
    });
});

client.on('message', async (receivedTopic, message) => {
    console.log(`Received message on topic ${receivedTopic}: ${message.toString()}`);

    try {
        await database.query("TRUNCATE TABLE users")
        let result = JSON.parse(message.toString())
        
        const timeString = result.lastseen;
        const [minutesPart] = timeString.split('m');
        const totalMinutes = parseInt(minutesPart, 10);
        
        const text = 'INSERT INTO users(hostname, ipaddress, lastseen, lastseen_minute) VALUES($1, $2,$3, $4) RETURNING *'
        const values = [result.hostname, result.ipaddress, result.lastseen, totalMinutes];
        const res = await database.query(text, values)
        console.log(res.rows[0])

        // result.forEach( async (value, index) => {
        //     console.log(value.hostname);
        //     const timeString = value.lastseen;
        //     const [minutesPart] = timeString.split('m');
        //     const totalMinutes = parseInt(minutesPart, 10);
            
        //     const text = 'INSERT INTO users(hostname, ipaddress, lastseen, lastseen_minute) VALUES($1, $2,$3, $4) RETURNING *'
        //     const values = [value.hostname, value.ipaddress, value.lastseen, totalMinutes];
        //     const res = await database.query(text, values)
        //     console.log(res.rows[0])
        // })
    } catch (error) {
        console.error('Error:', error);
    }
});

setInterval( async () => {
    try {
        /* get time now */
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const dateNow = `${year}-${month}-${day}`;
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const rate_in_query = await helpers.sendGetData(`irate(ifHCInOctets{ifName=~'ether1',instance='103.186.32.129'}[1m0s])*8`);
        let rate_in_data = await helpers.convertBytesToKilobytes(rate_in_query.data.result[0].value[1])

        const rate_out_query = await helpers.sendGetData(`irate(ifHCOutOctets{ifName=~'ether1',instance='103.186.32.129'}[1m0s])*8`);
        let rate_out_data = await helpers.convertBytesToKilobytes(rate_out_query.data.result[0].value[1])
        
        /* check before input */
        let getTodayData = await database.query(`SELECT * FROM analytics WHERE date = '${dateNow}'`);
        
        if (getTodayData.rows.length > 0) {
            if (rate_in_data > getTodayData.rows[0].rate_in && rate_out_data > getTodayData.rows[0].rate_out) {
                console.log('bigger data');
                await database.query("TRUNCATE TABLE analytics")

                const text = 'INSERT INTO analytics(rate_in, rate_out, date, created_at) VALUES($1, $2,$3, $4) RETURNING *'
                const values = [rate_in_data, rate_out_data, `${dateNow}`, formattedDateTime];
                await database.query(text, values)   
            }
        } else {
            const text = 'INSERT INTO analytics(rate_in, rate_out, date, created_at) VALUES($1, $2,$3, $4) RETURNING *'
            const values = [rate_in_data, rate_out_data, `${dateNow}`, formattedDateTime];
            await database.query(text, values)
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}, 5000)

client.on('error', (error) => {
    console.error('Connection error:', error);
    client.end();
});

client.on('close', () => {
    console.log('Connection closed');
});