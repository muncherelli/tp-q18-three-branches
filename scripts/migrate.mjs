import fs from 'node:fs'
import pg from 'pg'

const VAR_NAMES = [
  'DATABASE_URL',
  'PGHOST',
  'PGPORT',
  'PGUSER',
  'PGPASSWORD',
  'PGDATABASE',
  'DATABASE_CA_CERT',
  'DATABASE_CA_FILE',
]

function log(name, status) {
  console.log(`[migrate] ${name} ${status}`)
}

function sslConfig() {
  const cert = process.env.DATABASE_CA_CERT
  const file = process.env.DATABASE_CA_FILE
  log('DATABASE_CA_CERT', cert ? 'present' : 'absent')
  log('DATABASE_CA_FILE', file ? 'present' : 'absent')
  if (!cert && !file) return undefined
  let ca = cert
  if (file) {
    ca = fs.readFileSync(file, 'utf8')
  }
  return { ca, rejectUnauthorized: true }
}

function clientConfig() {
  for (const name of VAR_NAMES) {
    if (name === 'DATABASE_CA_CERT' || name === 'DATABASE_CA_FILE') continue
    log(name, process.env[name] ? 'present' : 'absent')
  }

  const ssl = sslConfig()
  const host = process.env.PGHOST
  const user = process.env.PGUSER
  const database = process.env.PGDATABASE
  if (host && user && database) {
    return {
      host,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user,
      password: process.env.PGPASSWORD,
      database,
      ssl,
    }
  }

  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl }
  }

  throw new Error('database connection variables incomplete')
}

async function main() {
  const client = new pg.Client(clientConfig())
  try {
    await client.connect()
    log('connect', 'ok')
    await client.query(`
      create table if not exists q14_marker (
        id int primary key,
        note text
      )
    `)
    log('q14_marker', 'table_ready')
    await client.query(
      `insert into q14_marker (id, note) values (1, 'migrated')
       on conflict (id) do update set note = excluded.note`
    )
    log('q14_marker', 'upsert_ok')
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch((err) => {
  log('migrate', 'failed')
  console.error(err.message)
  process.exit(1)
})
