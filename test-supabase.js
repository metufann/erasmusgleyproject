// Test Supabase connection
const { createClient } = require('@supabase/supabase-js')

// Replace with your actual values
const supabaseUrl = 'YOUR_SUPABASE_URL_HERE'
const supabaseKey = 'YOUR_ANON_KEY_HERE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Supabase error:', error)
    } else {
      console.log('✅ Supabase connection successful!')
      console.log('Data:', data)
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
  }
}

testConnection() 