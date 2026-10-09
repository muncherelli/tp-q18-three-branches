import pg from 'pg'
import { NextResponse } from 'next/server'

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

function varsPresent(): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const name of VAR_NAMES) {
    out[name] = Boolean(process.env[name])
  }
  return out
}

function sslFromEnv() {
  const cert = process.env.DATABASE_CA_CERT
  const file = process.env.DATABASE_CA_FILE
  if (!cert && !file) return undefined
  return { ca: cert, rejectUnauthorized: true }
}

function clientConfig() {
  const ssl = sslFromEnv()
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      ssl,
    }
  }
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl }
  }
  return null
}

export async function GET() {
  const cfg = clientConfig()
  if (!cfg) {
    return NextResponse.json({
      migrated: false,
      rows: 0,
      vars: varsPresent(),
    })
  }

  const client = new pg.Client(cfg)
  try {
    await client.connect()
    const res = await client.query(
      'select count(*)::int as n, bool_or(note = $1) as migrated from q14_marker',
      ['migrated']
    )
    const row = res.rows[0] as { n: number; migrated: boolean }
    return NextResponse.json({
      migrated: Boolean(row.migrated),
      rows: row.n ?? 0,
      vars: varsPresent(),
    })
  } catch {
    return NextResponse.json({
      migrated: false,
      rows: 0,
      vars: varsPresent(),
    })
  } finally {
    await client.end().catch(() => {})
  }
}
