const axios = require('axios');

const sendGetData = async (query) => {
    const url = 'http://103.84.206.103:9090/api/v1/query';

    const milliseconds = new Date().getTime() / 1000;

    const params = {
        query: query,
        time: milliseconds.toFixed(3),
    };

    try {
        const response = await axios.get(url, { params });
        const responseData = response.data;

        // Now you can work with the JSON response content
        return responseData
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

const convertBytesToKilobytes = async (value) => {
    const originalString = value;
    const floatValue = parseFloat(originalString);
    const dividedValue = floatValue / 1000;
    const resultString = dividedValue.toFixed(2);

    return resultString
}

const calculateAverage = async (numbers) => {
    if (numbers.length === 0) {
        return 0;
    }
    
    const numericArray = numbers.map(Number);
    const sum = numericArray.reduce((total, num) => total + num, 0);
    const average = sum / numericArray.length;

    return average
}

const roundToNearest = async (value, precision) => {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}

const toDate = async (timestamp) => {
    const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsOfYear = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const date = new Date(timestamp * 1000); // Convert to milliseconds
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = monthsOfYear[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${dayOfWeek} , ${day} ${month} ${year}`;
}

const toHour = async (timestamp) => {
const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthsOfYear = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const date = new Date(timestamp * 1000); // Convert to milliseconds
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = monthsOfYear[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${hours}.${minutes} WIB`;
}

const formatDateDifference = async(inputDateStr) => {
    const unixTimestampMillis = Date.now();
    const a = unixTimestampMillis - inputDateStr
    // console.log(a);
    const date = new Date(a);
    // console.log(date.toString());

    const timestamp = a;
    const currentTime = Date.now();

    const timeDifference = currentTime - timestamp;

    const millisecondsPerSecond = 1000;
    const millisecondsPerMinute = 60 * millisecondsPerSecond;
    const millisecondsPerHour = 60 * millisecondsPerMinute;
    const millisecondsPerDay = 24 * millisecondsPerHour;
    const millisecondsPerWeek = 7 * millisecondsPerDay;

    const weeks = Math.floor(timeDifference / millisecondsPerWeek);
    const days = Math.floor((timeDifference % millisecondsPerWeek) / millisecondsPerDay);
    const hours = Math.floor((timeDifference % millisecondsPerDay) / millisecondsPerHour);

    const result = `${weeks > 0 ? weeks + ' week' + (weeks > 1 ? 's' : '') + ' ' : ''}${days > 0 ? days + ' day' + (days > 1 ? 's' : '') + ' ' : ''}${hours > 0 ? hours + ' hour' + (hours > 1 ? 's' : '') + ' ' : ''}ago`;

    return result
  }

module.exports = {
    sendGetData,
    toDate,
    toHour,
    calculateAverage,
    roundToNearest,
    formatDateDifference,
    convertBytesToKilobytes
}