'use strict'
const http = require('http')

const BRANCH = 'branch-a'
const VERSION = 2

const KEYS = [
  'DATABASE_URL',
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_NAME',
  'DATABASE_USER',
  'DATABASE_PASSWORD',
  'DATABASE_CA_CERT',
  'DATABASE_CA_FILE',
  'DATABASE_READ_SPLIT',
  'PGHOST',
  'PGPORT',
  'PGDATABASE',
  'PGUSER',
  'PGPASSWORD',
  'PGSSLMODE',
  'MYSQL_HOST',
  'MYSQL_PORT',
  'MYSQL_DATABASE',
  'MYSQL_USER',
  'MYSQL_PASSWORD',
]

// Reports names and presence only, never values.
function body() {
  const present = {}
  for (const k of KEYS) present[k] = Boolean(process.env[k])
  return JSON.stringify({ branch: BRANCH, version: VERSION, present })
}

http
  .createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(body())
  })
  .listen(Number(process.env.PORT) || 3000)
