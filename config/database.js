const { Client } = require('pg');
 
const client = new Client({
  user: 'analytic',
  host: '103.84.206.103',
  database: 'analytic',
  password: 'devanalytic',
  port: 5432,
})

module.exports = client