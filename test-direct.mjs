import { PrismaClient } from '@prisma/client'

const directUrl = 'postgresql://postgres.skcpaeldwokskcqcrfyo:hhS2Y7XyhN39jyNm@db.skcpaeldwokskcqcrfyo.supabase.co:5432/postgres?sslmode=require'

console.log('Testing with DIRECT connection:', directUrl.substring(0, 50) + '...')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl
    }
  },
  log: ['error'],
})

async function test() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Direct connection works!')
    console.log('Result:', result)

    const locs = await prisma.location.findMany()
    console.log(`Found ${locs.length} locations`)
  } catch (error) {
    console.error('❌ Failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
