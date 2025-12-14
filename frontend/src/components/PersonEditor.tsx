import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Person } from '../types/person'
import { X, Save, Trash2, UserPlus, Eye, Heart, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, AlertTriangle, Baby, Skull, Droplet, Folder, FileText, Image as ImageIcon } from 'lucide-react'

import { LocationInput } from './LocationInput'
// ... (previous imports)

interface Media {
  id: string
  fileName: string
  fileType: string
  eventId: string | null
  eventType: string | null
  url: string
}

interface Props {
// ...
  personId: string | null
  onClose: () => void
  onUpdate: (updatedPerson: Person) => void
  onPersonCreated?: (newPerson: Person) => void
  onSelect: (personId: string) => void
  livingThreshold?: number
  
  // Creation mode props
  initialData?: Partial<Person> | null
  creationContext?: {
      type: 'father' | 'mother' | 'spouse' | 'child'
      sourcePerson: Person
  } | null
  onRequestCreate?: (type: 'father' | 'mother' | 'spouse' | 'child', source: Person) => void
}

type CompletionStatus = 'complete' | 'partial' | 'incomplete'

const StatusIcon = ({ status }: { status?: CompletionStatus }) => {
    if (status === 'complete') return <CheckCircle2 size={18} className="text-emerald-500" />
    if (status === 'partial') return <AlertTriangle size={18} className="text-amber-500" />
    if (status === 'incomplete') return <AlertCircle size={18} className="text-rose-500" />
    return null
}

const ToggleSection = ({ title, icon, isOpen, onToggle, status, children }: { title: string, icon?: React.ReactNode, isOpen: boolean, onToggle: () => void, status?: CompletionStatus, children: React.ReactNode }) => (
    <div className={`collapse collapse-arrow border border-base-200 bg-base-100 rounded-box mb-2 ${isOpen ? 'collapse-open' : ''}`}>
        <div className="collapse-title text-base font-medium flex items-center gap-2" onClick={onToggle}>
            {icon}
            <span className="flex-1">{title}</span>
            <div onClick={e => e.stopPropagation()}>
                <StatusIcon status={status} />
            </div>
        </div>
        <div className="collapse-content">
            <div className="pt-2">{children}</div>
        </div>
    </div>
)

export function PersonEditor({ personId, onClose, onUpdate, onPersonCreated, onSelect, livingThreshold = 100, initialData, creationContext, onRequestCreate }: Props) {
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [formData, setFormData] = useState<Partial<Person>>({})
  const [parents, setParents] = useState<{ father?: any, mother?: any }>({})
  const [children, setChildren] = useState<any[]>([])
  const [marriages, setMarriages] = useState<any[]>([])
  const [media, setMedia] = useState<Media[]>([])
  
  // Sections state
  const [sections, setSections] = useState({
      identity: true,
      birth: false,
      baptism: false,
      death: false,
      marriage: false,
      family: false,
      details: false
  })
  
  const toggleSection = (key: keyof typeof sections) => setSections(prev => ({ ...prev, [key]: !prev[key] }))

  const handleChange = (field: keyof Person, value: any) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value }
        
        // Special logic for isLiving
        if (field === 'isLiving') {
            if (value === false) {
                // If marking as deceased, open death section
                setSections(s => ({ ...s, death: true }))
            } else {
                // If marking as living, clear death date/place? Or just hide?
                // Usually we keep data but hide it, or clear it. 
                // Let's just hide it for now (handled by render)
                setSections(s => ({ ...s, death: false }))
            }
        }
        return newData
    })
  }
  
  const getStatus = (hasDate: boolean, hasPlace: boolean): CompletionStatus => {
      if (hasDate && hasPlace) return 'complete'
      if (hasDate || hasPlace) return 'partial'
      return 'incomplete'
  }

  useEffect(() => {
    // If personId is provided, fetch data (Edit Mode)
    if (personId) {
        setLoading(true)
        api<Person & { father?: any, mother?: any, children?: any[], marriages?: any[] }>(`/persons/${personId}`)
        .then(data => {
            setPerson(data)
        setParents({ father: data.father, mother: data.mother })
        setChildren(data.children || [])
        setMarriages(data.marriages || [])
        setMedia(data.media || [])
        
        // Determine isLiving based on data and threshold
            let isLiving = data.isLiving
            
            // If explicitly null (unknown) or true (assumed living), check against threshold
            // If already false (dead), keep it false.
            if (isLiving !== false) {
                const hasDeath = !!(data.deathDate || data.deathPlace)
                if (hasDeath) {
                    isLiving = false
                } else {
                    // Check threshold
                    const currentYear = new Date().getFullYear()
                    let shouldBeDead = false
                    
                    if (data.birthDate) {
                        const birthYear = parseInt(data.birthDate.substring(0, 4))
                        if (!isNaN(birthYear) && (currentYear - birthYear > livingThreshold)) {
                            shouldBeDead = true
                        }
                    }
                    
                    // Check marriages
                    if (!shouldBeDead && data.marriages) {
                        for (const m of data.marriages) {
                            if (m.date) {
                                const mYear = parseInt(m.date.substring(0, 4))
                                if (!isNaN(mYear) && (currentYear - mYear > livingThreshold)) {
                                    shouldBeDead = true
                                    break
                                }
                            }
                        }
                    }
                    
                    if (shouldBeDead) {
                        isLiving = false
                    } else if (isLiving === null) {
                        // Default to true if not old enough
                        isLiving = true
                    }
                }
            }
            
            setFormData({
                firstName: data.firstName,
                middleName: data.middleName,
                lastName: data.lastName,
                maidenName: data.maidenName,
                gender: data.gender,
                birthDate: data.birthDate,
                birthDateOriginal: data.birthDateOriginal,
                birthTime: data.birthTime,
                birthPlace: data.birthPlace,
                birthLatitude: data.birthLatitude,
                birthLongitude: data.birthLongitude,
                baptismDate: data.baptismDate,
                baptismDateOriginal: data.baptismDateOriginal,
                baptismTime: data.baptismTime,
                baptismPlace: data.baptismPlace,
                baptismLatitude: data.baptismLatitude,
                baptismLongitude: data.baptismLongitude,
                deathDate: data.deathDate,
                deathDateOriginal: data.deathDateOriginal,
                deathTime: data.deathTime,
                deathPlace: data.deathPlace,
                deathLatitude: data.deathLatitude,
                deathLongitude: data.deathLongitude,
                occupation: data.occupation,
                isLiving: isLiving,
                notes: data.notes,
                biography: data.biography,
            })
            
            setSections({
                identity: true,
                birth: false,
                baptism: false,
                death: false, 
                marriage: false, 
                family: false,
                details: false
            })
            
            setLoading(false)
        })
        .catch(err => {
            console.error(err)
            setError("Impossible de charger les données")
            setLoading(false)
        })
    } 
    // If creationContext and initialData are provided (Create Mode)
    else if (creationContext && initialData) {
        setPerson(null) // No person yet
        setFormData({ ...initialData })
        setParents({})
        setChildren([])
        setMarriages([])
        
        // If creating a parent, check if we should add the other parent as spouse
        if (creationContext.type === 'father' || creationContext.type === 'mother') {
            const source = creationContext.sourcePerson
            const otherParentId = creationContext.type === 'father' ? source.motherId : source.fatherId
            
            if (otherParentId) {
                // Fetch other parent minimal info to display in marriage section?
                // Or just assume it.
                // Ideally we need the name.
                api<Person>(`/persons/${otherParentId}`).then(other => {
                    setMarriages([{ 
                        id: 'temp-marriage', 
                        spouse: other,
                        // date/place empty for now
                    }])
                    setSections(prev => ({ ...prev, marriage: true }))
                })
            }
        }
        
        setSections({
            identity: true,
            birth: false,
            baptism: false,
            death: false,
            marriage: false, // will be opened by above logic if needed
            family: false,
            details: false
        })
    } else {
        setPerson(null)
    }
  }, [personId, livingThreshold, creationContext, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSaving(true)
    try {
      if (personId) {
          // UPDATE EXISTING
          await api(`/persons/${personId}`, {
            method: 'PATCH',
            body: JSON.stringify(formData)
          })

          // Update Main Marriage
          if (marriages.length > 0) {
              const m = marriages[0]
              if (m.id && !m.id.startsWith('temp-')) {
                  await api(`/families/${m.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({
                          marriageDate: m.date,
                          marriagePlace: m.place,
                          marriageLatitude: m.latitude,
                          marriageLongitude: m.longitude
                      })
                  })
              }
          }
          
          if (person) {
            onUpdate({ ...person, ...formData } as Person)
          }
          onClose()
      } else if (creationContext && initialData) {
          // CREATE NEW
          // 1. Create Person
          const newPerson = await api<Person>('/persons', {
             method: 'POST',
             body: JSON.stringify({ ...formData, treeId: initialData.treeId })
          })
          
          if (onPersonCreated) onPersonCreated(newPerson)
          
          // 2. Link relationships
          const { type, sourcePerson } = creationContext
          
          if (type === 'father') {
             await api(`/persons/${sourcePerson.id}`, { method: 'PATCH', body: JSON.stringify({ fatherId: newPerson.id }) })
             onUpdate({ ...sourcePerson, fatherId: newPerson.id } as Person)
          } else if (type === 'mother') {
             await api(`/persons/${sourcePerson.id}`, { method: 'PATCH', body: JSON.stringify({ motherId: newPerson.id }) })
             onUpdate({ ...sourcePerson, motherId: newPerson.id } as Person)
          } else if (type === 'child') {
             const payload: any = {}
             if (sourcePerson.gender === 'M') payload.fatherId = sourcePerson.id
             else if (sourcePerson.gender === 'F') payload.motherId = sourcePerson.id
             await api(`/persons/${newPerson.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
             // Should update sourcePerson? No, sourcePerson is the parent.
          } else if (type === 'spouse') {
             // Create family
             const famPayload = {
                 treeId: sourcePerson.treeId,
                 husbandId: sourcePerson.gender === 'M' ? sourcePerson.id : newPerson.id,
                 wifeId: sourcePerson.gender === 'F' ? sourcePerson.id : newPerson.id
             }
             await api('/families', { method: 'POST', body: JSON.stringify(famPayload) })
          }
          
          // 3. Create Marriage if pending (e.g. pre-filled spouse for parents)
          if (marriages.length > 0 && marriages[0].id === 'temp-marriage') {
              const spouse = marriages[0].spouse
              const famPayload = {
                 treeId: newPerson.treeId,
                 husbandId: newPerson.gender === 'M' ? newPerson.id : spouse.id,
                 wifeId: newPerson.gender === 'F' ? newPerson.id : spouse.id,
                 // TODO: Add date/place from marriage section inputs if we add them to form state
              }
              await api('/families', { method: 'POST', body: JSON.stringify(famPayload) })
          }
          
          // Switch to Edit Mode for new person
          onSelect(newPerson.id)
      }
    } catch (err) {
      console.error(err)
      setError("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleAddParent = async (type: 'father' | 'mother') => {
    if (!personId || !person) return
    if (onRequestCreate) {
        onRequestCreate(type, person)
        return
    }
    // Fallback if not using new flow
    const gender = type === 'father' ? 'M' : 'F'
    const payload = {
      treeId: person.treeId,
      firstName: 'Nouveau',
      lastName: person.lastName, // Suggest same last name
      gender: gender,
      isLiving: false // Default to deceased for parents usually? Or let user choose.
    }
    
    try {
        const newParent = await api<Person>('/persons', { method: 'POST', body: JSON.stringify(payload) })
        // Notify parent component about new person
        if (onPersonCreated) onPersonCreated(newParent)

        // Link to current person
        const linkPayload = type === 'father' ? { fatherId: newParent.id } : { motherId: newParent.id }
        await api(`/persons/${personId}`, { method: 'PATCH', body: JSON.stringify(linkPayload) })
        
        // Refresh
        onUpdate({ ...person, ...linkPayload } as Person)
        // Navigate to new parent to edit details
        onSelect(newParent.id)
    } catch(e) {
        console.error(e)
        alert("Erreur lors de la création")
    }
  }

  const handleAddChild = async () => {
    if (!personId || !person) return
    if (onRequestCreate) {
        onRequestCreate('child', person)
        return
    }
    const payload = {
      treeId: person.treeId,
      firstName: 'Nouvel',
      lastName: person.lastName,
      gender: 'M',
      fatherId: person.gender === 'M' ? personId : undefined,
      motherId: person.gender === 'F' ? personId : undefined
    }
    
    try {
        const newChild = await api<Person>('/persons', { method: 'POST', body: JSON.stringify(payload) })
        if (onPersonCreated) onPersonCreated(newChild)
        // Refresh children list locally
        setChildren(prev => [...prev, newChild])
        // Navigate to child
        onSelect(newChild.id)
    } catch(e) {
        console.error(e)
        alert("Erreur lors de la création")
    }
  }

  const handleAddSpouse = async () => {
    if (!personId || !person) return
    if (onRequestCreate) {
        onRequestCreate('spouse', person)
        return
    }
    const gender = person.gender === 'M' ? 'F' : 'M'
    const payload = {
      treeId: person.treeId,
      firstName: 'Conjoint',
      lastName: 'Inconnu',
      gender: gender
    }
    
    try {
        const newSpouse = await api<Person>('/persons', { method: 'POST', body: JSON.stringify(payload) })
        if (onPersonCreated) onPersonCreated(newSpouse)
        // Create Family link
        const famPayload = {
             treeId: person.treeId,
             husbandId: person.gender === 'M' ? personId : newSpouse.id,
             wifeId: person.gender === 'F' ? personId : newSpouse.id
        }
        await api('/families', { method: 'POST', body: JSON.stringify(famPayload) })
        
        // Refresh
        setMarriages(prev => [...prev, { id: 'temp-'+Date.now(), spouse: newSpouse }])
        onSelect(newSpouse.id)
    } catch(e) {
        console.error(e)
        alert("Erreur lors de la création du conjoint")
    }
  }

  const handleDelete = async () => {
    if (!personId || !confirm('Supprimer définitivement cette personne ?')) return
    
    setLoading(true)
    try {
        await api(`/persons/${personId}`, { method: 'DELETE' })
        onClose()
        // We should probably trigger a refresh of the tree or list in parent
        // But onUpdate might not be enough if person is gone.
        // Assuming parent component handles state update or reload.
        window.location.reload() // Simple but effective for now, or use a callback
    } catch (e) {
        console.error(e)
        alert('Impossible de supprimer')
    } finally {
        setLoading(false)
    }
  }

  // Helper to render media for a section
  const renderMedia = (eventType: string | null) => {
      const sectionMedia = media.filter(m => m.eventType === eventType || (!eventType && !m.eventType))
      if (sectionMedia.length === 0) return null
      
      return (
          <div className="mt-3 grid grid-cols-4 gap-2">
              {sectionMedia.map(m => (
                  <a 
                    key={m.id} 
                    href={m.url.startsWith('http') ? m.url : `/api${m.url.replace('/api', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block relative aspect-square border border-base-200 rounded overflow-hidden hover:opacity-80 bg-base-200/50 group"
                    title={m.fileName}
                  >
                      {m.fileType.startsWith('image/') ? (
                          <div className="w-full h-full flex items-center justify-center">
                              <img 
                                src={m.url.startsWith('http') ? m.url : `/api${m.url.replace('/api', '')}`} 
                                alt={m.fileName} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.parentElement?.classList.add('fallback-icon')
                                }} 
                              />
                              {/* Fallback Icon (hidden by default, shown via CSS or JS logic above, but here we can just put it behind) */}
                              <div className="hidden fallback-icon:flex absolute inset-0 flex flex-col items-center justify-center text-base-content/40 p-1">
                                  <ImageIcon size={24} />
                                  <span className="text-[10px] text-center w-full truncate mt-1">{m.fileName}</span>
                              </div>
                          </div>
                      ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-base-content/60 p-2">
                              <FileText size={24} className="mb-1" />
                              <span className="text-[10px] text-center w-full truncate leading-tight break-all">
                                  {m.fileName}
                              </span>
                          </div>
                      )}
                  </a>
              ))}
          </div>
      )
  }

  if (!personId && !creationContext) return null

  // Identify main marriage (linked to tree context or first one?)
  // User said: "mariage qui fait parti de la généalogie soit éditable"
  // Usually this means the marriage with the spouse that connects to the descendants or ancestors shown.
  // For now, let's take the first one or create a logic. 
  // Simplified: Let's pick the first marriage as "Main" for editing, or maybe all should be editable?
  // "Le mariage... positionné entre naissance et décès". Implies singular.
  // Let's try to find a marriage where the spouse is the other parent of the children? 
  // Or just the first one. Let's use the first one for the "Main Marriage" section.
  const mainMarriage = marriages.length > 0 ? marriages[0] : null
  const otherMarriages = marriages.length > 1 ? marriages.slice(1) : []

  // Completion checks
  const birthStatus = getStatus(!!formData.birthDate, !!formData.birthPlace)
  const baptismStatus = getStatus(!!formData.baptismDate, !!formData.baptismPlace)
  const deathStatus = !formData.isLiving ? getStatus(!!formData.deathDate, !!formData.deathPlace) : undefined
  const mainMarriageStatus = mainMarriage ? getStatus(!!mainMarriage.date, !!mainMarriage.place) : undefined

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-base-100 shadow-2xl border-l border-base-200 transform transition-transform z-50 flex flex-col text-base-content">
      {/* Header */}
      <div className="p-4 border-b border-base-200 flex items-center justify-between bg-base-200/50">
        <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
          <span>{loading ? 'Chargement...' : creationContext ? `Créer ${creationContext.type === 'father' ? 'Père' : creationContext.type === 'mother' ? 'Mère' : creationContext.type === 'child' ? 'Enfant' : 'Conjoint'}` : `Éditer ${person?.lastName} ${person?.firstName}`}</span>
          {person?.sosa && (
             <span className="badge badge-warning gap-1" title="Numéro Sosa">
                 {person.sosa}
             </span>
          )}
          {person?.gedcomId && !person?.sosa && (
            <span className="badge badge-ghost gap-1 font-mono text-xs">
                {person.gedcomId}
            </span>
          )}
          {media.length > 0 && (
              <Folder size={16} className="text-info ml-1" title={`${media.length} fichiers disponibles`} />
          )}
        </h2>
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center py-10"><span className="loading loading-spinner loading-lg"></span></div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Identité */}
            <ToggleSection title="Identité" isOpen={sections.identity} onToggle={() => toggleSection('identity')} status={!!(formData.firstName && formData.lastName) ? 'complete' : 'partial'}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Prénom</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.firstName || ''}
                    onChange={e => handleChange('firstName', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nom</span>
                  </label>
                  <input 
                    className="input input-bordered w-full uppercase"
                    value={formData.lastName || ''}
                    onChange={e => handleChange('lastName', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Autres prénoms</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.middleName || ''}
                    onChange={e => handleChange('middleName', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Sexe</span>
                  </label>
                  <select 
                    className="select select-bordered w-full"
                    value={formData.gender || 'M'}
                    onChange={e => handleChange('gender', e.target.value)}
                  >
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Profession</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.occupation || ''}
                    onChange={e => handleChange('occupation', e.target.value)}
                  />
                </div>
              </div>
              {renderMedia(null)}
            </ToggleSection>
            
            {/* Naissance */}
            <ToggleSection 
                title="Naissance" 
                icon={<Baby size={18} className="text-blue-500" />}
                isOpen={sections.birth} 
                onToggle={() => toggleSection('birth')} 
                status={birthStatus}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date</span>
                  </label>
                  <input 
                    type="date"
                    className="input input-bordered w-full"
                    value={formData.birthDate || ''}
                    onChange={e => handleChange('birthDate', e.target.value)}
                  />
                  <label className="label py-0 pt-1">
                    <span className="label-text-alt text-base-content/60">Texte original</span>
                  </label>
                  <input 
                    className="input input-bordered input-sm w-full"
                    value={formData.birthDateOriginal || ''}
                    onChange={e => handleChange('birthDateOriginal', e.target.value)}
                    placeholder="Ex: Vers 1750"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Heure</span>
                  </label>
                  <input 
                    type="time"
                    step="1"
                    className="input input-bordered w-full"
                    value={formData.birthTime || ''}
                    onChange={e => handleChange('birthTime', e.target.value)}
                  />
                </div>
                <div className="col-span-2 form-control">
                  <label className="label">
                    <span className="label-text">Lieu</span>
                  </label>
                  <LocationInput 
                    className="cursor-pointer"
                    value={formData.birthPlace || ''}
                    onChange={(place, lat, lon) => {
                        setFormData(prev => ({
                            ...prev, 
                            birthPlace: place,
                            birthLatitude: lat || prev.birthLatitude,
                            birthLongitude: lon || prev.birthLongitude
                        }))
                    }}
                    placeholder="Ville, Code Postal, Pays"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.birthLatitude || ''}
                    onChange={e => handleChange('birthLatitude', e.target.value)}
                    placeholder="Ex: 48.8566"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.birthLongitude || ''}
                    onChange={e => handleChange('birthLongitude', e.target.value)}
                    placeholder="Ex: 2.3522"
                  />
                </div>
              </div>
              {renderMedia('BIRTH')}
            </ToggleSection>

            {/* Baptême */}
            <ToggleSection 
                title="Baptême" 
                icon={<Droplet size={18} className="text-sky-500" />}
                isOpen={sections.baptism} 
                onToggle={() => toggleSection('baptism')} 
                status={baptismStatus}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date</span>
                  </label>
                  <input 
                    type="date"
                    className="input input-bordered w-full"
                    value={formData.baptismDate || ''}
                    onChange={e => handleChange('baptismDate', e.target.value)}
                  />
                  <label className="label py-0 pt-1">
                    <span className="label-text-alt text-base-content/60">Texte original</span>
                  </label>
                  <input 
                    className="input input-bordered input-sm w-full"
                    value={formData.baptismDateOriginal || ''}
                    onChange={e => handleChange('baptismDateOriginal', e.target.value)}
                    placeholder="Ex: Vers 1750"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Heure</span>
                  </label>
                  <input 
                    type="time"
                    step="1"
                    className="input input-bordered w-full"
                    value={formData.baptismTime || ''}
                    onChange={e => handleChange('baptismTime', e.target.value)}
                  />
                </div>
                <div className="col-span-2 form-control">
                  <label className="label">
                    <span className="label-text">Lieu</span>
                  </label>
                  <LocationInput 
                    className="cursor-pointer"
                    value={formData.baptismPlace || ''}
                    onChange={(place, lat, lon) => {
                        setFormData(prev => ({
                            ...prev, 
                            baptismPlace: place,
                            baptismLatitude: lat || prev.baptismLatitude,
                            baptismLongitude: lon || prev.baptismLongitude
                        }))
                    }}
                    placeholder="Ville, Code Postal, Pays"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.baptismLatitude || ''}
                    onChange={e => handleChange('baptismLatitude', e.target.value)}
                    placeholder="Ex: 48.8566"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude</span>
                  </label>
                  <input 
                    className="input input-bordered w-full"
                    value={formData.baptismLongitude || ''}
                    onChange={e => handleChange('baptismLongitude', e.target.value)}
                    placeholder="Ex: 2.3522"
                  />
                </div>
              </div>
              {renderMedia('BAPTISM')}
            </ToggleSection>

            {/* Mariage Principal (Editable) */}
            {mainMarriage && (
                 <ToggleSection 
                    title={`Mariage avec ${mainMarriage.spouse ? `${mainMarriage.spouse.firstName} ${mainMarriage.spouse.lastName}` : 'Conjoint'}`} 
                    icon={<Heart size={18} className="text-rose-500" />}
                    isOpen={sections.marriage} 
                    onToggle={() => toggleSection('marriage')} 
                    status={mainMarriageStatus}
                 >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Date</span>
                            </label>
                            <input 
                                type="date" 
                                className="input input-bordered w-full" 
                                value={mainMarriage.date || ''} 
                                onChange={(e) => {
                                    const newM = [...marriages]
                                    if(newM[0]) newM[0] = { ...newM[0], date: e.target.value }
                                    setMarriages(newM)
                                }}
                            />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Lieu</span>
                            </label>
                            <LocationInput 
                                className="cursor-pointer"
                                value={mainMarriage.place || ''}
                                onChange={(place, lat, lon) => {
                                    const newM = [...marriages]
                                    if(newM[0]) newM[0] = { 
                                        ...newM[0], 
                                        place,
                                        latitude: lat,
                                        longitude: lon
                                    }
                                    setMarriages(newM)
                                }}
                                placeholder="Ville, Code Postal, Pays"
                            />
                        </div>
                    </div>
                    {renderMedia('MARRIAGE')}
                 </ToggleSection>
            )}

            {/* Décès */}
            <ToggleSection 
                title="Décès" 
                icon={<Skull size={18} className="text-slate-500" />}
                isOpen={sections.death} 
                onToggle={() => toggleSection('death')} 
                status={deathStatus}
            >
              <div className="flex items-center justify-between border-b border-base-200 pb-2 mb-4">
                <span className="text-sm font-medium">Statut vital</span>
                <label className="label cursor-pointer gap-2">
                  <span className="label-text">Personne vivante</span>
                  <input 
                    type="checkbox" 
                    className="checkbox"
                    checked={formData.isLiving ?? true}
                    onChange={e => handleChange('isLiving', e.target.checked)}
                  />
                </label>
              </div>
              
              {!formData.isLiving && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Date</span>
                    </label>
                    <input 
                      type="date"
                      className="input input-bordered w-full"
                      value={formData.deathDate || ''}
                      onChange={e => handleChange('deathDate', e.target.value)}
                    />
                    <label className="label py-0 pt-1">
                      <span className="label-text-alt text-base-content/60">Texte original</span>
                    </label>
                    <input 
                      className="input input-bordered input-sm w-full"
                      value={formData.deathDateOriginal || ''}
                      onChange={e => handleChange('deathDateOriginal', e.target.value)}
                      placeholder="Ex: Vers 1750"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Heure</span>
                    </label>
                    <input 
                      type="time"
                      step="1"
                      className="input input-bordered w-full"
                      value={formData.deathTime || ''}
                      onChange={e => handleChange('deathTime', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 form-control">
                    <label className="label">
                      <span className="label-text">Lieu</span>
                    </label>
                    <LocationInput 
                      className="cursor-pointer"
                      value={formData.deathPlace || ''}
                      onChange={(place, lat, lon) => {
                          setFormData(prev => ({
                              ...prev, 
                              deathPlace: place,
                              deathLatitude: lat || prev.deathLatitude,
                              deathLongitude: lon || prev.deathLongitude
                          }))
                      }}
                      placeholder="Ville, Code Postal, Pays"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Latitude</span>
                    </label>
                    <input 
                      className="input input-bordered w-full"
                      value={formData.deathLatitude || ''}
                      onChange={e => handleChange('deathLatitude', e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Longitude</span>
                    </label>
                    <input 
                      className="input input-bordered w-full"
                      value={formData.deathLongitude || ''}
                      onChange={e => handleChange('deathLongitude', e.target.value)}
                    />
                  </div>
                </div>
              )}
              {renderMedia('DEATH')}
            </ToggleSection>
            
            {/* Famille */}
            <ToggleSection title="Famille & Relations" isOpen={sections.family} onToggle={() => toggleSection('family')}>
              {/* Parents */}
              <div className="mb-4">
                <h4 className="text-xs font-bold opacity-50 uppercase mb-2">Parents</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-base-200 rounded-lg bg-base-200/30 flex flex-col gap-2">
                    <span className="text-xs font-bold opacity-50">PÈRE</span>
                    {parents.father ? (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium"><span className="uppercase">{parents.father.lastName}</span> {parents.father.firstName}</span>
                            <button type="button" onClick={() => onSelect(parents.father.id)} className="btn btn-ghost btn-xs text-primary" title="Voir">
                                <Eye size={16} />
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => handleAddParent('father')} className="btn btn-ghost btn-xs text-primary justify-start px-0">
                            <UserPlus size={16} /> Ajouter père
                        </button>
                    )}
                    </div>
                    <div className="p-3 border border-base-200 rounded-lg bg-base-200/30 flex flex-col gap-2">
                    <span className="text-xs font-bold opacity-50">MÈRE</span>
                    {parents.mother ? (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium"><span className="uppercase">{parents.mother.lastName}</span> {parents.mother.firstName}</span>
                            <button type="button" onClick={() => onSelect(parents.mother.id)} className="btn btn-ghost btn-xs text-primary" title="Voir">
                                <Eye size={16} />
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => handleAddParent('mother')} className="btn btn-ghost btn-xs text-primary justify-start px-0">
                            <UserPlus size={16} /> Ajouter mère
                        </button>
                    )}
                    </div>
                </div>
              </div>

               {/* Autres Mariages */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold opacity-50 uppercase">Tous les conjoints ({marriages.length})</span>
                      <button type="button" onClick={handleAddSpouse} className="btn btn-ghost btn-xs text-primary">
                          <Heart size={14} /> Ajouter
                      </button>
                  </div>
                  <div className="grid gap-2">
                     {marriages.map((m, idx) => (
                         <div key={m.id || idx} className="flex items-center justify-between p-2 border border-base-200 rounded-lg bg-base-100 hover:bg-base-200/50 transition-colors">
                             <div className="flex flex-col">
                                 <span className="text-sm font-medium">
                                     {m.spouse ? <><span className="uppercase">{m.spouse.lastName}</span> {m.spouse.firstName}</> : 'Conjoint inconnu'}
                                 </span>
                                 <span className="text-[10px] opacity-60">
                                     {m.date ? `∞ ${m.date}` : ''} {m.place ? `à ${m.place}` : ''}
                                 </span>
                             </div>
                             {m.spouse && (
                                 <button type="button" onClick={() => onSelect(m.spouse.id)} className="btn btn-ghost btn-xs text-primary" title="Voir">
                                     <Eye size={16} />
                                 </button>
                             )}
                         </div>
                     ))}
                     {marriages.length === 0 && <div className="text-sm opacity-50 italic">Aucun mariage enregistré</div>}
                  </div>
                </div>
 
                {/* Enfants */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold opacity-50 uppercase">Enfants ({children.length})</span>
                      <button type="button" onClick={handleAddChild} className="btn btn-ghost btn-xs text-primary">
                          <UserPlus size={14} /> Ajouter
                      </button>
                  </div>
                  <div className="grid gap-2">
                      {children.map(child => (
                          <div key={child.id} className="flex items-center justify-between p-2 border border-base-200 rounded-lg bg-base-100 hover:bg-base-200/50 transition-colors">
                              <div className="flex flex-col">
                                  <span className="text-sm font-medium"><span className="uppercase">{child.lastName}</span> {child.firstName}</span>
                                  <span className="text-[10px] opacity-60">
                                      {child.birthDate ? `° ${child.birthDate}` : ''} {child.deathDate ? `† ${child.deathDate}` : ''}
                                  </span>
                              </div>
                              <button type="button" onClick={() => onSelect(child.id)} className="btn btn-ghost btn-xs text-primary" title="Voir">
                                  <Eye size={16} />
                              </button>
                          </div>
                      ))}
                      {children.length === 0 && <div className="text-sm opacity-50 italic">Aucun enfant enregistré</div>}
                  </div>
                </div>
            </ToggleSection>

            {/* Notes & Bio */}
            <ToggleSection title="Détails & Notes" isOpen={sections.details} onToggle={() => toggleSection('details')} status={!!(formData.biography || formData.notes) ? 'complete' : undefined}>
              <div className="space-y-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Biographie</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered h-24"
                    value={formData.biography || ''}
                    onChange={e => handleChange('biography', e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Notes privées</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered h-24"
                    value={formData.notes || ''}
                    onChange={e => handleChange('notes', e.target.value)}
                  />
                </div>
              </div>
            </ToggleSection>
          </form>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-base-200 bg-base-200/30 flex justify-between items-center">
        {person && !parents.father && !parents.mother && (
            <button 
              type="button"
              onClick={handleDelete}
              className="btn btn-error btn-ghost btn-sm gap-2"
              title="Supprimer"
            >
              <Trash2 size={16} />
              <span>Supprimer</span>
            </button>
        )}
        {!person && <div></div>} {/* Spacer */}
        
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-ghost"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            form="edit-form"
            disabled={saving || loading}
            className="btn btn-primary"
          >
            <Save size={18} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
