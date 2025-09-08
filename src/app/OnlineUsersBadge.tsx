'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function OnlineUsersBadge() {
  const [count, setCount] = useState<number>(1)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('Environment check:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
    url: supabaseUrl?.substring(0, 20) + '...',
    key: supabaseAnonKey?.substring(0, 20) + '...'
  })

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const PRESENCE_CHANNEL = 'online-users'
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: Math.random().toString(36).slice(2) } }
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      // Flatten presence: each key holds an array of metas
      const num = Object.values(state).reduce((sum, metas) => sum + (Array.isArray(metas) ? metas.length : 0), 0)
      setCount(num || 1)
    })

    channel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [supabaseUrl, supabaseAnonKey])

  if (!supabaseUrl || !supabaseAnonKey) {
    return <div className="text-red-500 text-sm">Config Error</div>
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-amber-200 text-amber-700 text-sm shadow-sm">
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span>{count} online</span>
    </div>
  )
}


