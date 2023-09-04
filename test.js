// function calculateAverage(numbers) {
//     if (numbers.length === 0) {
//         return 0; // Return 0 for an empty array or handle it according to your requirements
//     }
    
//     const sum = numbers.reduce((total, num) => total + num, 0);
//     const average = sum / numbers.length;
    
//     return average;
// }

// const numberArray = [1, 0, 0, 0];
// const average = calculateAverage(numberArray);

// console.log(`The average is: ${average}`);

// const unixTimestampMillis = Date.now();

// const a = unixTimestampMillis - 1536644000
// console.log(a);
// const date = new Date(a);
// console.log(date.toString());

// const timestamp = a;
// const currentTime = Date.now();

// const timeDifference = currentTime - timestamp;

// const millisecondsPerSecond = 1000;
// const millisecondsPerMinute = 60 * millisecondsPerSecond;
// const millisecondsPerHour = 60 * millisecondsPerMinute;
// const millisecondsPerDay = 24 * millisecondsPerHour;
// const millisecondsPerWeek = 7 * millisecondsPerDay;

// const weeks = Math.floor(timeDifference / millisecondsPerWeek);
// const days = Math.floor((timeDifference % millisecondsPerWeek) / millisecondsPerDay);
// const hours = Math.floor((timeDifference % millisecondsPerDay) / millisecondsPerHour);

// const result = `${weeks > 0 ? weeks + ' week' + (weeks > 1 ? 's' : '') + ' ' : ''}${days > 0 ? days + ' day' + (days > 1 ? 's' : '') + ' ' : ''}${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') + ' ' : ''}ago`;

// console.log(result);

// // Data bytes inbound dan timestamp
// const data = [
//     { bytes: 442646280, timestamp: 1693154827 },
//     // ... tambahkan data lainnya
//   ];
  
//   // Menghitung rata-rata Kbps per 10 detik
//   function calculateKbps(data) {
//     let totalBytes = 0;
//     let startTime = data[0].timestamp;
//     let endTime = startTime + 10;
  
//     for (let i = 0; i < data.length; i++) {
//       const { bytes, timestamp } = data[i];
  
//       if (timestamp >= startTime && timestamp < endTime) {
//         totalBytes += bytes;
//       } else {
//         const timeInterval = endTime - startTime;
//         const kbps = (totalBytes * 8) / (timeInterval * 1000); // Menghitung Kbps
  
//         console.log(`Timestamp: ${startTime.toFixed(3)} - ${endTime.toFixed(3)}, Avg Kbps: ${kbps.toFixed(2)}`);
  
//         totalBytes = bytes;
//         startTime = endTime;
//         endTime += 10;
//       }
//     }
//   }
  
//   calculateKbps(data);
  
const mqtt = require('mqtt');
const database = require('./config/database')

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
    database.query(`TRUNCATE TABLE users`);
    console.log(`Received message on topic ${receivedTopic}: ${message.toString()}`);

    JSON.parse(message.toString())

    let result = JSON.parse(message.toString())
    
    try {
        await database.connect();
        result.forEach( async (value, index) => {
            const timeString = value.lastseen;
            const [minutesPart] = timeString.split('m');
            const totalMinutes = parseInt(minutesPart, 10);
            
            const text = 'INSERT INTO users(hostname, ipaddress, lastseen, lastseen_minute) VALUES($1, $2,$3, $4) RETURNING *'
            const values = [value.hostname, value.ipaddress, value.lastseen, totalMinutes];
            const res = await database.query(text, values)
            console.log(res.rows[0])
        })
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await database.end();
    }

});

client.on('error', (error) => {
    console.error('Connection error:', error);
    client.end();
});

client.on('close', () => {
    console.log('Connection closed');
});

// const { getISOWeek } = require('date-fns');

// const currentDate = new Date();
// const currentWeek = getISOWeek(currentDate);

// console.log(`Current week: ${currentWeek}`);

// const { getWeekOfMonth } = require('date-fns');

// const currentDate = new Date();
// const currentWeekOfMonth = getWeekOfMonth(currentDate);

// console.log(`Current week within the month: ${currentWeekOfMonth}`);