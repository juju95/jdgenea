import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
      <div className="relative w-full">
        <input 
            className={`input input-bordered w-full pr-10 ${className || ''}`}
            value={value || ''}
            placeholder={placeholder}
            onClick={() => setIsOpen(true)}
            readOnly 
        />
        <MapPin size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 pointer-events-none" />
      </div>

      {isOpen && createPortal(
        <div className="modal modal-open" style={{ zIndex: 9999 }}>
          <div ref={modalRef} className="modal-box w-11/12 max-w-lg h-[80vh] flex flex-col p-0 overflow-hidden">
            <div className="p-4 border-b border-base-200 flex items-center gap-3 bg-base-100">
                <Search className="text-base-content/50" />
                <input 
                    id="location-search-input"
                    className="flex-1 input input-ghost focus:outline-none text-lg"
                    placeholder="Rechercher un lieu..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button onClick={() => setIsOpen(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 bg-base-100">
                {/* Local Results */}
                {localResults.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-base-content/50 uppercase px-3 py-2">Déjà utilisés</h4>
                        <ul className="menu bg-base-100 w-full p-0">
                            {localResults.map((place, i) => (
                                <li key={i} className="w-full">
                                    <button className="flex flex-col items-start gap-0 h-auto py-2 w-full max-w-full" onClick={() => handleSelect(place)}>
                                        <span className="font-medium whitespace-normal text-left break-words w-full">{place}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* External Results */}
                {externalResults.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-base-content/50 uppercase px-3 py-2">Suggestions (Internet)</h4>
                        <ul className="menu bg-base-100 w-full p-0">
                            {externalResults.map((item, i) => {
                                const label = formatExternal(item)
                                return (
                                    <li key={i} className="w-full">
                                        <button className="flex flex-col items-start gap-0 h-auto py-2 w-full max-w-full" onClick={() => handleSelect(label, item.lat, item.lon)}>
                                            <span className="font-medium whitespace-normal text-left break-words w-full">{label}</span>
                                            <span className="text-xs text-base-content/60 w-full text-left whitespace-normal break-words">{item.display_name}</span>
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}

                {(loadingLocal || loadingExternal) && (
                    <div className="flex justify-center p-4">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                )}
                
                {!loadingLocal && !loadingExternal && search.length > 1 && localResults.length === 0 && externalResults.length === 0 && (
                    <div className="text-center p-8 text-base-content/50">
                        Aucun résultat trouvé.
                        <button className="btn btn-link btn-sm mt-2 text-primary h-auto whitespace-normal break-words block w-full" onClick={() => handleSelect(search)}>
                            Utiliser "{search}" tel quel
                        </button>
                    </div>
                )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setIsOpen(false)}>close</button>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}
