import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Search, Loader2 } from 'lucide-react'
import { api } from '../api/client'

interface Props {
  value?: string
  onChange: (value: string, lat?: string, lon?: string) => void
  placeholder?: string
  className?: string
}

export function LocationInput({ value, onChange, placeholder, className }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [localResults, setLocalResults] = useState<string[]>([])
  const [externalResults, setExternalResults] = useState<any[]>([])
  const [loadingLocal, setLoadingLocal] = useState(false)
  const [loadingExternal, setLoadingExternal] = useState(false)
  
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
        setSearch(value || '')
        // Focus input
        setTimeout(() => document.getElementById('location-search-input')?.focus(), 50)
    }
  }, [isOpen])

  // Search effect
  useEffect(() => {
    if (!isOpen || search.length < 2) {
        setLocalResults([])
        setExternalResults([])
        return
    }

    const timer = setTimeout(() => {
        // 1. Local Search
        setLoadingLocal(true)
        api<string[]>(`/locations/search?q=${encodeURIComponent(search)}`)
            .then(res => setLocalResults(res))
            .catch(console.error)
            .finally(() => setLoadingLocal(false))

        // 2. External Search (Nominatim)
        setLoadingExternal(true)
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&addressdetails=1&limit=5`)
            .then(res => res.json())
            .then(data => setExternalResults(data))
            .catch(console.error)
            .finally(() => setLoadingExternal(false))
    }, 500)

    return () => clearTimeout(timer)
  }, [search, isOpen])

  const handleSelect = (place: string, lat?: string, lon?: string) => {
    onChange(place, lat, lon)
    setIsOpen(false)
  }

  // Format external result to "City (Zip), Country" or similar
  const formatExternal = (item: any) => {
      const addr = item.address
      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality
      const postcode = addr.postcode
      const country = addr.country
      
      let parts = []
      if (city) {
          if (postcode) parts.push(`${city} (${postcode})`)
          else parts.push(city)
      } else {
          // Fallback to display_name parts
          parts.push(item.display_name.split(',')[0])
      }
      
      if (country) parts.push(country)
      
      return parts.join(', ')
  }

  return (
    <>
      <div className="relative">
        <input 
            className={className}
            value={value || ''}
            placeholder={placeholder}
            onClick={() => setIsOpen(true)}
            readOnly // Prevent direct typing, force modal? Or allow typing but show modal on focus?
            // User said: "quand j'entre dans un champ ... ca ouvre une modale"
            // So readOnly + onClick seems safest to enforce the flow, or allow typing and open modal?
            // "saisie d'adresse... modale" implies the modal handles the input.
        />
        <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="text-slate-400" />
                <input 
                    id="location-search-input"
                    className="flex-1 outline-none text-lg"
                    placeholder="Rechercher un lieu..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">Fermer</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
                {/* Local Results */}
                {localResults.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase px-3 py-2">Déjà utilisés</h4>
                        {localResults.map((place, i) => (
                            <button key={i} className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded text-slate-700" onClick={() => handleSelect(place)}>
                                {place}
                            </button>
                        ))}
                    </div>
                )}

                {/* External Results */}
                {externalResults.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase px-3 py-2">Suggestions (Internet)</h4>
                        {externalResults.map((item, i) => {
                            const label = formatExternal(item)
                            return (
                                <button key={i} className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded text-slate-700 flex flex-col" onClick={() => handleSelect(label, item.lat, item.lon)}>
                                    <span className="font-medium">{label}</span>
                                    <span className="text-xs text-slate-400 truncate">{item.display_name}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {(loadingLocal || loadingExternal) && (
                    <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin text-indigo-500" />
                    </div>
                )}
                
                {!loadingLocal && !loadingExternal && search.length > 1 && localResults.length === 0 && externalResults.length === 0 && (
                    <div className="text-center p-8 text-slate-400">
                        Aucun résultat trouvé.
                        <button className="block mx-auto mt-2 text-indigo-600 hover:underline" onClick={() => handleSelect(search)}>
                            Utiliser "{search}" tel quel
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
