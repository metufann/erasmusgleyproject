import { notFound } from 'next/navigation'
import CountryPageClient from './CountryPageClient'
import { supabase } from '@/lib/supabase'
import OnlineUsersWrapper from '../../OnlineUsersWrapper'

async function getCountry(slug: string) {
  try {
    const { data: country, error } = await supabase
      .from('countries')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error || !country) {
      return null
    }
    
    return country
  } catch (error) {
    console.error('Error fetching country:', error)
    return null
  }
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const country = await getCountry(slug)
  
  if (!country) {
    notFound()
  }

  return <CountryPageClient country={country} />
} 