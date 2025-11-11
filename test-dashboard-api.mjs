/**
 * Test Dashboard API Endpoint
 *
 * Tests the GET /api/locations/:locationId/dashboard endpoint
 * which provides aggregated dashboard data including:
 * - Period totals (receipts, issues, mandays, days left)
 * - Recent deliveries (last 5)
 * - Recent issues (last 5)
 */

const BASE_URL = 'http://localhost:3000'

// Test credentials
const LOGIN_CREDS = {
  email: 'admin@foodstock.local',
  password: 'Admin@123',
}

/**
 * Helper: Login and get session cookie
 */
async function login() {
  console.log('🔐 Logging in as admin...')
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(LOGIN_CREDS),
  })

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`)
  }

  const setCookie = response.headers.get('set-cookie')
  if (!setCookie) {
    throw new Error('No session cookie received')
  }

  const data = await response.json()
  console.log(`✅ Logged in as: ${data.user.username} (${data.user.role})`)

  return setCookie
}

/**
 * Helper: Fetch with auth cookie
 */
async function fetchWithAuth(url, cookie, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: cookie,
    },
  })
}

/**
 * Test 1: Fetch dashboard for Main Kitchen
 */
async function testDashboardFetch(cookie, locationId) {
  console.log('\n📊 Test 1: Fetch dashboard for location', locationId)

  const response = await fetchWithAuth(`${BASE_URL}/api/locations/${locationId}/dashboard`, cookie)

  console.log('Response status:', response.status)

  if (!response.ok) {
    const error = await response.json()
    console.error('❌ Failed:', error)
    return
  }

  const data = await response.json()
  console.log('✅ Dashboard data fetched successfully')
  console.log('Location:', data.location)
  console.log('Period:', data.period)
  console.log('Totals:', data.totals)
  console.log(`Recent Deliveries: ${data.recentDeliveries.length} items`)
  data.recentDeliveries.forEach((d) => {
    console.log(
      `  - ${d.delivery_no} | ${d.delivery_date.split('T')[0]} | ${d.supplier?.name || 'N/A'} | SAR ${d.total_amount}`
    )
  })
  console.log(`Recent Issues: ${data.recentIssues.length} items`)
  data.recentIssues.forEach((i) => {
    console.log(`  - ${i.issue_no} | ${i.issue_date.split('T')[0]} | ${i.cost_centre} | SAR ${i.total_value}`)
  })
}

/**
 * Test 2: Fetch dashboard when no active period
 */
async function testNoPeriod(cookie, locationId) {
  console.log('\n📊 Test 2: Dashboard with no active period')
  console.log('Note: This test assumes there is an active period. Skipping for now.')
  // In production, we would close the current period and test
}

/**
 * Test 3: Invalid location ID
 */
async function testInvalidLocation(cookie) {
  console.log('\n📊 Test 3: Dashboard with invalid location ID')

  const response = await fetchWithAuth(
    `${BASE_URL}/api/locations/00000000-0000-0000-0000-000000000000/dashboard`,
    cookie
  )

  console.log('Response status:', response.status)

  if (response.status === 404) {
    const error = await response.json()
    console.log('✅ Correctly returns 404 for invalid location')
    console.log('Error:', error)
  } else {
    console.error('❌ Expected 404, got:', response.status)
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(60))
  console.log('🧪 Dashboard API Tests')
  console.log('='.repeat(60))

  try {
    // Login
    const cookie = await login()

    // Get first location from seed data (Main Kitchen)
    const locationsResponse = await fetchWithAuth(`${BASE_URL}/api/locations`, cookie)
    const locationsData = await locationsResponse.json()
    const locations = Array.isArray(locationsData) ? locationsData : locationsData.locations || []

    if (locations.length === 0) {
      console.error('❌ No locations found. Please run seed script.')
      return
    }

    const locationId = locations[0].id
    console.log(`\nUsing location: ${locations[0].name} (${locations[0].code})`)

    // Run tests
    await testDashboardFetch(cookie, locationId)
    await testNoPeriod(cookie, locationId)
    await testInvalidLocation(cookie)

    console.log('\n' + '='.repeat(60))
    console.log('✅ All tests completed')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run tests
runTests()
