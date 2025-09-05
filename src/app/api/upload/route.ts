import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    // Support multiple files under the key 'images'
    const files = (formData.getAll('images') as File[]).filter(Boolean)
    // Backward compatibility: accept single 'image'
    const singleFile = formData.get('image') as File | null
    if (files.length === 0 && singleFile) {
      files.push(singleFile)
    }
    const caption = formData.get('caption') as string
    const authorName = formData.get('authorName') as string
    const story = formData.get('story') as string
    const accessCode = formData.get('accessCode') as string
    const countrySlug = formData.get('countrySlug') as string

    if (files.length === 0 || !accessCode || !countrySlug) {
      return NextResponse.json(
        { error: 'At least one image file, access code, and country slug are required' },
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

    // Verify access code for this country
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

    // Check if access code matches
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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024

    const uploaded: { imagePath: string; publicUrl: string }[] = []
    // Create a batch id to group multiple files as a single post/album
    const batchRandom = Math.random().toString(36).slice(2, 8)
    const batchId = `${Date.now().toString(36)}-${batchRandom}`

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
          { status: 400 }
        )
      }

      // Validate file size (5MB)
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size too large. Maximum size is 5MB.' },
          { status: 400 }
        )
      }

      // Generate unique filename per file
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).slice(2, 8)
      const fileExtension = file.name.split('.').pop()
      // Put files under a shared batch folder: <countryId>/<batchId>/filename
      const fileName = `${country.id}/${batchId}/${timestamp}-${randomSuffix}.${fileExtension}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from('submissions')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: 'Failed to upload image' },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('submissions')
        .getPublicUrl(fileName)

      // Store metadata in database
      const { error: dbError } = await supabaseAdmin
        .from('submissions')
        .insert({
          country_id: country.id,
          image_path: fileName,
          caption: caption || null,
          author_name: authorName || null,
          story: story || null,
          approved: true
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // Try to delete uploaded file if database insert fails
        await supabaseAdmin.storage
          .from('submissions')
          .remove([fileName])
        
        return NextResponse.json(
          { error: 'Failed to save submission' },
          { status: 500 }
        )
      }

      uploaded.push({ imagePath: fileName, publicUrl })
    }

    // Increment usage count for the access code (once per submission batch)
    await supabaseAdmin
      .from('country_access_codes')
      .update({ used_count: validCode.used_count + 1 })
      .eq('id', validCode.id)

    return NextResponse.json({
      success: true,
      uploaded,
      batchId,
      message: 'Images uploaded successfully'
    })

  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 