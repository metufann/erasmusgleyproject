import Link from 'next/link'
import { supabase } from '@/lib/supabase'

async function getCountries() {
  try {
    const { data: countries, error } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return []
    }
    
    return countries || []
  } catch (error) {
    console.error('💥 Exception caught:', error)
    return []
  }
}

export default async function HomePage() {
  const countries = await getCountries()

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          {/* Mobile: Vertical, Desktop: Horizontal */}
          <div className="mb-6">
            <img
              src="/gley-hero.jpeg"
              alt="GLEY"
              className="w-16 h-16 mx-auto mb-4 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-lg shadow-lg"
            />
            <h1 className="text-2xl font-bold text-rose-600 mb-2 md:text-3xl lg:text-4xl xl:text-5xl">
              Photo Exhibition
            </h1>
          </div>
          
          <div className="w-20 h-1 bg-rose-400 mx-auto rounded-full mb-4"></div>
          <p className="text-rose-700 font-medium text-sm md:text-base lg:text-lg">
            Select a country to explore
          </p>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {countries.map((country) => (
            <Link
              key={country.id}
              href={`/c/${country.slug}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mx-auto mb-3">
                <img
                  src={country.flag_svg_url}
                  alt={`${country.name} flag`}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h3 className="text-sm font-bold text-gray-800 md:text-base lg:text-lg">
                {country.name}
              </h3>
            </Link>
          ))}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 pb-4">
          <p className="text-orange-600 text-xs md:text-sm">
            @ 2025 Game Based Learning For Empowered Youth (GLEY)
          </p>
        </div>
      </div>
    </div>
  )
}
