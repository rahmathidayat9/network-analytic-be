const express = require('express')
const helpers = require('../helpers')
const database = require('../config/database')
const router = express.Router()

router.get('/', (req, res) => {
    res.send("Network Analytic Rest Api , Copyright PT.SOLUSI TIGA BERSAMA")
})

router.get('/api/dashboard/get-router', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/list')
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-system', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/system/resources/print', {
            "uuid" : "d50a736a-6814-4da8-9a2e-540f72506e31"
        })
        let obj = data.massage[0]

        /* Get memory percentage usage */
        let freeMemory = obj["free-memory"]
        let totalMemory = obj["total-memory"]
        let ramUsage = (totalMemory - freeMemory) / totalMemory
        obj["ram-usage"] = (ramUsage * 100).toFixed(2)

        /* Get hdd percentage usage */
        let freeHdd = obj["free-hdd-space"]
        let totalHdd = obj["total-hdd-space"]
        let hddUsage = (totalHdd - freeHdd) / totalHdd
        obj["hdd-usage"] = (hddUsage * 100).toFixed(2)
        
        return res.status(200).json(obj)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-interface', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/interface/list/print')
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-hotspot-active', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/device/hotspot/active/print')
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-dhcp-server', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/ip/dhcp-server/print')
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/get-kid-control', async (req, res) => {
    try {
        const data = await helpers.sendPostData('/router/ip/kid-controll/print')
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'An error occurred' })
    }
})

router.get('/api/dashboard/logs', async (req, res) => {
    let data = await database.query("SELECT * FROM analytics")
    return res.send(data.rows)    
})

module.exports = router
