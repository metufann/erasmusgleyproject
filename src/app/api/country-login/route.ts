import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signJWT } from '@/lib/jwt'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { countrySlug, accessCode } = await request.json()

    if (!countrySlug || !accessCode) {
      return NextResponse.json(
        { error: 'Country slug and access code are required' },
        { status: 400 }
      )
    }

    // Get country details from database
    const { data: country, error: countryError } = await supabaseAdmin
      .from('countries')
      .select('id, slug, name, is_active')
      .eq('slug', countrySlug)
      .eq('is_active', true)
      .single()

    if (countryError || !country) {
      return NextResponse.json(
        { error: 'Country not found or inactive' },
        { status: 404 }
      )
    }

    // Get access codes for this country
    const { data: accessCodes, error: codesError } = await supabaseAdmin
      .from('country_access_codes')
      .select('*')
      .eq('country_id', country.id)

    if (codesError) {
      return NextResponse.json(
        { error: 'Failed to fetch access codes' },
        { status: 500 }
      )
    }

    // Check if any access code matches
    let validCode = null
    for (const code of accessCodes || []) {
      const hashedInput = createHash('sha1').update(accessCode).digest('hex')
      
      if (hashedInput === code.code_hash) {
        // Check expiration
        if (code.expires_at && new Date(code.expires_at) < new Date()) {
          continue // Code expired
        }
        
        // Check usage limit
        if (code.max_uses && code.used_count >= code.max_uses) {
          continue // Usage limit exceeded
        }
        
        validCode = code
        break
      }
    }

    if (!validCode) {
      return NextResponse.json(
        { error: 'Invalid or expired access code' },
        { status: 401 }
      )
    }

    // Increment usage count
    await supabaseAdmin
      .from('country_access_codes')
      .update({ used_count: validCode.used_count + 1 })
      .eq('id', validCode.id)

    // Generate JWT
    const token = await signJWT(country.id, country.slug)

    return NextResponse.json({
      success: true,
      token,
      country: {
        id: country.id,
        slug: country.slug,
        name: country.name
      }
    })

  } catch (error) {
    console.error('Country login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
      )
  }
} 