import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side client (for public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin client (for protected operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Realtime channel name for presence
export const PRESENCE_CHANNEL = 'online-users'

// Database types
export interface Country {
  id: number
  slug: string
  name: string
  flag_svg_url: string | null
  is_active: boolean
}

export interface Submission {
  id: number
  country_id: number
  image_path: string
  caption: string | null
  author_name: string | null
  approved: boolean
  created_at: string
}

export interface CountryAccessCode {
  id: number
  country_id: number
  code_hash: string
  expires_at: string | null
  max_uses: number | null
  used_count: number
  created_at: string
} 