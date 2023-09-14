const helpers = require('../helpers');
const database = require('../config/database')
const mqtt = require('mqtt');

/* HiveMq setup */
const brokerUrl = 'mqtt://broker.hivemq.com:1883';
const clientId = 'clientId-qj7stXp84Y';
const topic = 'mikrotik/admin';
/* Data */
const getHour = async (socket) => {
    try {
        const unixTimestamp = Math.floor(Date.now() / 1000)
        const hour = await helpers.toHour(unixTimestamp)

        socket.emit('data_hour', hour);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

const getOutData = async (socket) => {
    try {
        const response = await helpers.sendGetData("-irate(ifHCOutOctets{ifName=~'ether1', instance='103.186.32.131'}[1m]) * 8");
        const result = response.data.result[0].value[1];

        socket.emit('get_out_data', result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

const getRateInData = async (socket) => {
    try {
        const outBond = await helpers.sendGetData("irate(ifHCOutOctets{ifName=~'ether1',instance='103.186.32.129'}[1m0s])*8");
        const bytesPerSecondOut = outBond.data.result[0].value[1];
        const kilobytesPerSecondOut = bytesPerSecondOut / 1024;
        const kilobytesPerSecondRoundedout = Math.round(kilobytesPerSecondOut * 100) / 100;

        const response = await helpers.sendGetData("irate(ifHCInOctets{ifName=~'ether1',instance='103.186.32.129'}[1m0s])*8");
        const bytesPerSecond = response.data.result[0].value[1];
        const kilobytesPerSecond = bytesPerSecond / 1024;
        const kilobytesPerSecondRounded = Math.round(kilobytesPerSecond * 100) / 100;

        socket.emit('rate_in_data', {
            upload: kilobytesPerSecondRoundedout,
            download: kilobytesPerSecondRounded
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

const getRateSpeed = async (socket, interface) => {
    try {
        const rate_in_query = await helpers.sendGetData(`irate(ifHCInOctets{ifName=~'${interface}',instance='103.186.32.129'}[1m0s])*8`);
        let rate_in_data = await helpers.convertBytesToKilobytes(rate_in_query.data.result[0].value[1])

        const rate_out_query = await helpers.sendGetData(`irate(ifHCOutOctets{ifName=~'${interface}',instance='103.186.32.129'}[1m0s])*8`);
        let rate_out_data = await helpers.convertBytesToKilobytes(rate_out_query.data.result[0].value[1])

        socket.emit(interface, {
            download: rate_in_data,
            upload: rate_out_data
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

const cpuTemperature = async (socket) => {
    try {
        const disk = await helpers.sendGetData('mtxrHlProcessorTemperature');
        const diskResult = disk.data.result[0].value[1];

        const result = diskResult / 10

        socket.emit('cpu_temperature', result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const cpuLoad = async (socket) => {
    try {
        const disk = await helpers.sendGetData('hrProcessorLoad');
        const diskResult = disk.data.result

        let numbers = []
        diskResult.forEach((value, index) => {
            numbers.push(value.value[1])
        })

        let result = await helpers.calculateAverage(numbers)
        result = await helpers.roundToNearest(result, 1)

        socket.emit('cpu_load', result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const ramLoad = async (socket) => {
    try {
        const disk = await helpers.sendGetData('hrStorageUsed');
        const diskResult = disk.data.result[0].value[1];
        
        const size = await helpers.sendGetData('hrStorageSize');
        const diskSize = size.data.result[0].value[1];

        const result = diskResult / diskSize * 100;

        socket.emit('ram_load', result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const systemDiskLoad = async (socket) => {
    try {
        const disk = await helpers.sendGetData('hrStorageUsed');
        const diskResult = disk.data.result[1].value[1];
    
        const size = await helpers.sendGetData('hrStorageSize');
        const diskSize = size.data.result[1].value[1];
        
        const result = (diskResult / diskSize) * 100;

        socket.emit('system_disk_load', result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const wifiClientCount = async (socket) => {
    try {
        const disk = await helpers.sendGetData('mtxrWlRtabEntryCount');
        const diskResult = disk.data.result[0].value[1];
        
        const result = diskResult

        socket.emit('wifi_client_count', result);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

const storeUserToDatabase = async () => {
    database.query(`TRUNCATE TABLE users`);

    let random = Math.floor(Math.random() * (10000 - 10 + 1)) + 10;
    const query = 'INSERT INTO users (hostname, ipaddress, lastseen) VALUES (?, ?, ?)';

    const values = ['DESKTOP-PD1H9S4'+random, '20.20.20.254', '7m31s'];
    
    database.query(query, values, (error, results, fields) => {
        if (error) {
            console.error('Error inserting data:', error);
        } else {
            console.log('Data inserted successfully');
        }
    });
}

module.exports = {
    getHour,
    cpuTemperature,
    cpuLoad,
    ramLoad,
    systemDiskLoad,
    wifiClientCount,
    getOutData,
    getRateInData,
    getRateSpeed,
    storeUserToDatabase
};