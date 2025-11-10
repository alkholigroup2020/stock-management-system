import { PrismaClient } from '@prisma/client'

const urls = [
  'postgresql://postgres.skcpaeldwokskcqcrfyo:hhS2Y7XyhN39jyNm@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
  'postgresql://postgres.skcpaeldwokskcqcrfyo:hhS2Y7XyhN39jyNm@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connect_timeout=10',
  'postgresql://postgres.skcpaeldwokskcqcrfyo:hhS2Y7XyhN39jyNm@db.skcpaeldwokskcqcrfyo.supabase.co:5432/postgres?sslmode=require&connect_timeout=30',
]

async function testUrl(url, label) {
  console.log(`\n=== Testing ${label} ===`)
  console.log('URL preview:', url.substring(0, 70) + '...')

  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    },
    log: ['error'],
  })

  try {
    const result = await prisma.$queryRaw`SELECT NOW()`
    console.log('✅ SUCCESS!')
    return true
  } catch (error) {
    console.error('❌ FAILED:', error.message.split('\n')[0])
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function testAll() {
  console.log('Testing different connection strings...\n')

  for (let i = 0; i < urls.length; i++) {
    const success = await testUrl(urls[i], `Option ${i + 1}`)
    if (success) {
      console.log('\n✅ Found working connection!')
      console.log('Use this URL in .env:')
      console.log(urls[i])
      break
    }
  }
}

testAll()
