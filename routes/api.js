const express = require('express');
const helpers = require('../helpers');
const database = require('../config/database.js');
const router = express.Router();

router.get('/', (req, res) => {
    res.send("Network Analytic Rest Api , Copyright PT.SOLUSI TIGA BERSAMA")
});

router.get('/api/dashboard/system-date', async (req, res) => {
    try {
        const unixTimestamp = Math.floor(Date.now() / 1000)
        
        const date = await helpers.toDate(unixTimestamp)
        const hour = await helpers.toHour(unixTimestamp)

        const data = {
            message: "Data retrieved successfully",
            data: {
                date: date,
                hour: hour
            }
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }
});

router.get('/api/dashboard/get-interface', async (req, res) => {
    try {
        const data = await helpers.sendGetData("ifPhysAddress{instance='103.186.32.129'}");
        
        let result = []

        data.data.result.forEach((value, index) => {
            result.push({
                interface: value.metric.ifName
            })
        })

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }
})

router.get('/api/dashboard/system-uptime', async (req, res) => {
    try {
        const disk = await helpers.sendGetData('sysUpTime');
        let result = disk.data.result[0].value[1];
        result = result+0

        const formattedDifference = await helpers.formatDateDifference(result);
        
        const data = {
            message: "Data retrieved successfully",
            data: formattedDifference
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }    
});

router.get('/api/dashboard/rate', async (req, res) => {
    try {
        const rate_in_query = await helpers.sendGetData("irate(ifHCInOctets{ifName=~'ether1',instance='103.186.32.129'}[1m0s])*8");
        let rate_in_data = await helpers.convertBytesToKilobytes(rate_in_query.data.result[0].value[1])

        const rate_out_query = await helpers.sendGetData("-irate(ifHCOutOctets{ifName=~'ether1',instance='103.186.32.129'}[1m0s])*8");
        let rate_out_data = await helpers.convertBytesToKilobytes(rate_out_query.data.result[0].value[1])

        return res.status(200).json({
            message: 'Data retrieved',
            data: {
                in: rate_in_data,
                out: rate_out_data
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }
})

router.get('/api/dashboard/rate-speed', async (req, res) => {
    try {
        let interface = req.query.interface

        const rate_in_query = await helpers.sendGetData(`irate(ifHCInOctets{ifName=~'${interface}',instance='103.186.32.129'}[1m0s])*8`);
        let rate_in_data = await helpers.convertBytesToKilobytes(rate_in_query.data.result[0].value[1])

        const rate_out_query = await helpers.sendGetData(`-irate(ifHCOutOctets{ifName=~'${interface}',instance='103.186.32.129'}[1m0s])*8`);
        let rate_out_data = await helpers.convertBytesToKilobytes(rate_out_query.data.result[0].value[1])

        return res.status(200).json({
            message: 'Data retrieved',
            data: {
                in: rate_in_data,
                out: rate_out_data
            }
        });
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }
})

router.get('/api/dashboard/rate-data', async (req, res) => {
    try {
        const outBond = await helpers.sendGetData("irate(ifHCOutOctets{ifName=~'ether1', instance='103.186.32.131'}[1m]) * 8");
        const bytesPerSecondOut = outBond.data.result[0].value[1];
        const kilobytesPerSecondOut = bytesPerSecondOut / 1024;
        const kilobytesPerSecondRoundedout = Math.round(kilobytesPerSecondOut * 100) / 100;

        const response = await helpers.sendGetData("irate(ifHCInOctets{ifName=~'ether1',instance='103.186.32.131'}[1m])*8");
        const bytesPerSecond = response.data.result[0].value[1];
        const kilobytesPerSecond = bytesPerSecond / 1024;
        const kilobytesPerSecondRounded = Math.round(kilobytesPerSecond * 100) / 100;

        const data = {
            message: "Data retrieved successfully",
            data: {
                upload: kilobytesPerSecondRoundedout,
                download: kilobytesPerSecondRounded
            }
        };

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }    
});

router.get('/api/dashboard/cpu-temperature', async (req, res) => {
    try {
        const disk = await helpers.sendGetData('mtxrHlProcessorTemperature');
        const diskResult = disk.data.result[0].value[1];

        const result = diskResult / 10

        let data = {
            message: "Data retrieved successfully",
            data: result
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

router.get('/api/dashboard/cpu-load', async (req, res) => {
    try {
        const disk = await helpers.sendGetData('hrProcessorLoad');
        const diskResult = disk.data.result

        let numbers = []
        diskResult.forEach((value, index) => {
            numbers.push(value.value[1])
        })

        let result = await helpers.calculateAverage(numbers)
        result = await helpers.roundToNearest(result, 1)

        let data = {
            message: "Data retrieved successfully",
            data: result
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

router.get('/api/dashboard/ram-load', async (req, res) => {
    try {
        const disk = await helpers.sendGetData('hrStorageUsed');
        const diskResult = disk.data.result[0].value[1];
        
        const size = await helpers.sendGetData('hrStorageSize');
        const diskSize = size.data.result[0].value[1];

        const result = diskResult / diskSize * 100;

        let data = {
            message: "Data retrieved successfully",
            data: result.toFixed(2)
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

router.get('/api/dashboard/system-disk-load', async (req, res) => {
    try {
        const disk = await helpers.sendGetData('hrStorageUsed');
        const diskResult = disk.data.result[1].value[1];

        const size = await helpers.sendGetData('hrStorageSize');
        const diskSize = size.data.result[1].value[1];

        const result = (diskResult / diskSize) * 100;

        let data = {
            message: "Data retrieved successfully",
            data: result.toFixed(2)
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching data:', error);
    }
})

router.get('/api/dashboard/get-data-ethernet', async (req, res) => {
    try {
        let ethernet = req.query.ethernet;

        let outBond = await helpers.sendGetData(`irate(ifHCOutOctets{ifName=~'${ethernet}',instance='103.186.32.129'}[1m0s])*8`)
        const outBondbytesPerSecond = outBond.data.result[0].value[1];
        const outBondkilobytesPerSecond = outBondbytesPerSecond / 1024;
        const outBondkilobytesPerSecondRounded = Math.round(outBondkilobytesPerSecond * 100) / 100;

        let inBond = await helpers.sendGetData(`irate(ifHCInOctets{ifName=~'${ethernet}',instance='103.186.32.129'}[1m0s])*8`)
        const inBondbytesPerSecond = inBond.data.result[0].value[1];
        const inBondkilobytesPerSecond = inBondbytesPerSecond / 1024;
        const inBondkilobytesPerSecondRounded = Math.round(inBondkilobytesPerSecond * 100) / 100;
        
        const data = {
            message: "Data retrieved successfully",
            data: {
                download: inBondkilobytesPerSecondRounded,
                upload: outBondkilobytesPerSecondRounded,
            }
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }  
});

router.get('/api/analytic/daily-speed-rate', async (req, res) => {
    try {
        const daily_rate_in = await database.query('SELECT rate_in,date FROM analytics');
        const daily_rate_out = await database.query('SELECT rate_out,date FROM analytics');

        let data = {
            upload: daily_rate_out.rows,
            download: daily_rate_in.rows
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: 'An error occurred' });
    }  
});

module.exports = router
