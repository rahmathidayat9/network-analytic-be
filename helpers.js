const axios = require('axios')

const sendPostData = async (url, params) => {
    const baseUrl = 'https://api-mikrotik.linkdemo.web.id/api'

    try {
        const response = await axios.post(baseUrl+url, params)
        const responseData = response.data

        // Now you can work with the JSON response content
        return responseData
    } catch (error) {
        console.error('Error fetching data:', error)
        return null
    }
}

const getRandomInt = async (min, max) => {
    min = Math.ceil(min)
    max = Math.floor(max)

    return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = {
    sendPostData,
    getRandomInt
}