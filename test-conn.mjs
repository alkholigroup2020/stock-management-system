import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'

// Manually parse .env file
const envFile = readFileSync('.env', 'utf-8')
const envLines = envFile.split('\n')
for (const line of envLines) {
  const match = line.match(/^DATABASE_URL="?(.+?)"?$/)
  if (match) {
    process.env.DATABASE_URL = match[1].replace(/"/g, '')
    console.log('DATABASE_URL from .env:', process.env.DATABASE_URL)
    break
  }
}

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ['error'],
})

async function testConnection() {
  try {
    console.log('\nTesting database connection...')

    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful!')
    console.log('Test query result:', result)

    const locations = await prisma.location.findMany()
    console.log(`✅ Found ${locations.length} locations`)
    locations.forEach(loc => console.log(`  - ${loc.name} (${loc.code})`))

  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
