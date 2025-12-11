import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import { FamilyTree } from '../components/FamilyTree'
import { PersonEditor } from '../components/PersonEditor'
import { ExportPdfModal } from '../components/ExportPdfModal'
import { toFamilyTreeNodes } from '../utils/familyTreeData'
import { AncestorFanChart } from '../components/visualizations/AncestorFanChart'
import { DescendantWheel } from '../components/visualizations/DescendantWheel'
import { TreeArtistic } from '../components/visualizations/TreeArtistic'
import { TimelineChart } from '../components/visualizations/TimelineChart'
import type { Person } from '../types/person'
import jsPDF from 'jspdf'
import { toJpeg } from 'html-to-image'
import { Layout, Users, Circle, GitFork, Clock } from 'lucide-react'

type ViewMode = 'standard' | 'fan' | 'wheel' | 'artistic' | 'timeline'

export function TreeEditor() {
  const { id } = useParams()
  const [tree, setTree] = useState<{id:string,name:string,description?:string, rootPersonId?: string, livingThreshold?: number} | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [scale, setScale] = useState(0.6)
  const [viewMode, setViewMode] = useState<ViewMode>('standard')
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const treeRef = useRef<HTMLDivElement>(null)
  const [newPerson, setNewPerson] = useState<{firstName:string,lastName:string,gender?:string}>({ firstName:'', lastName:'', gender:'M' })
  const [newEvents, setNewEvents] = useState<Array<{type:string,date?:string,time?:string,place?:string,placeSubdivision?:string,description?:string,isPrivate?:boolean, files?: File[]}>>([])
  const [families, setFamilies] = useState<Array<{id:string,treeId:string,husbandId?:string|null,wifeId?:string|null}>>([])
  const [nextGedcomId, setNextGedcomId] = useState<string>('')

  useEffect(()=>{ (async()=>{ try { if (id) { const t = await api<{id:string,name:string,description?:string, rootPersonId?: string, livingThreshold?: number}>(`/trees/${id}`); setTree(t) } } catch(e){ if(e instanceof Error) setError(e.message) } })() },[id])
  useEffect(()=>{ (async()=>{ try { if (id) { const list = await api<Person[]>(`/persons?treeId=${id}`); setPersons(list); const fam = await api<Array<{id:string,treeId:string,husbandId?:string|null,wifeId?:string|null}>>(`/families?treeId=${id}`); setFamilies(fam) } } catch(e){ if(e instanceof Error) setError(e.message) } })() },[id])

  const [centerId, setCenterId] = useState<string|string|undefined>()
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [creationMode, setCreationMode] = useState<{
      initialData: Partial<Person>,
      context: { type: 'father' | 'mother' | 'spouse' | 'child', sourcePerson: Person }
  } | null>(null)

  useEffect(()=>{ if (tree && tree.rootPersonId) setCenterId(tree.rootPersonId) },[tree])

  const openAddPersonModal = async () => {
      if (!id) return
      try {
          const res = await api<{nextId: string}>(`/persons/next-id?treeId=${id}`)
          setNextGedcomId(res.nextId)
      } catch (e) {
          console.error(e)
      }
      (document.getElementById('add_person') as HTMLDialogElement).showModal()
  }

  const handleRequestCreate = (type: 'father' | 'mother' | 'spouse' | 'child', source: Person) => {
      // Prepare initial data
      const initial: Partial<Person> = {
          treeId: source.treeId,
          lastName: source.lastName, // Suggest same last name for most cases
          gender: 'M',
          isLiving: false // Default ?
      }
      
      if (type === 'father') {
          initial.gender = 'M'
      } else if (type === 'mother') {
          initial.gender = 'F'
      } else if (type === 'spouse') {
          initial.gender = source.gender === 'M' ? 'F' : 'M'
          initial.lastName = '' // Spouses usually have different last name
      } else if (type === 'child') {
          // Keep lastName
          initial.firstName = ''
      }
      
      setCreationMode({
          initialData: initial,
          context: { type, sourcePerson: source }
      })
      setSelectedPersonId(null) // Ensure we are not editing an existing person
      setIsEditorOpen(true)
  }

  // Update person in list when edited
  const handlePersonUpdate = (updated: Person) => {
    setPersons(prev => prev.map(p => p.id === updated.id ? updated : p))
  }

  const handlePersonCreated = (newPerson: Person) => {
    setPersons(prev => [...prev, newPerson])
  }

  // Transform data for FamilyTree
  const treeNodes = useMemo(() => toFamilyTreeNodes(persons, families), [persons, families])
  // Force re-render when switching root to ensure clean state
  const key = centerId ? `${centerId}-${persons.length}` : 'empty'

  const handleExportPdf = async (config: { format: 'a4' | 'a3', orientation: 'portrait' | 'landscape', scale: number }) => {
    if (!treeRef.current) return
    
    setIsExportingPdf(true)
    const originalScale = scale
    
    try {
        // Temporarily apply export scale
        setScale(config.scale)
        
        // Wait for render
        await new Promise(r => setTimeout(r, 800))
        
        const element = treeRef.current
        
        // Measure actual content size to avoid capturing empty space
        let maxRight = 0
        let maxBottom = 0
        
        // We need to check child nodes because scrollHeight might include padding/margins
        // or be affected by the scaling container size.
        // The structure is: Wrapper > ScaledDiv > Nodes (absolute)
        // We are capturing 'element', which is the Wrapper (with ref=treeRef).
        // Actually, in FamilyTree.tsx, ref is passed to containerRef (the inner scaled div) or localRef?
        // Let's check FamilyTree.tsx:
        // export const FamilyTree = memo(forwardRef<HTMLDivElement, Props>(function FamilyTree(..., ref) {
        //   const localRef = useRef<HTMLDivElement>(null)
        //   const containerRef = (ref as React.RefObject<HTMLDivElement>) || localRef
        //   ...
        //   return (
        //     <div ...> 
        //       <div ...>
        //         <div ref={containerRef} style={{ transform: scale... }}> ... </div>
        //       </div>
        //     </div>
        //   )
        // }))
        // So treeRef.current IS the inner div with the transform.
        
        // If we capture the inner div, 'toJpeg' captures it at its unscaled size (CSS size).
        // The nodes are absolutely positioned inside it.
        // We can find the max bottom/right of the nodes.
        const nodeElements = element.querySelectorAll('[id^="node-"]')
        if (nodeElements.length > 0) {
            nodeElements.forEach(el => {
                // We can't trust getBoundingClientRect() directly for position relative to container
                // because of the transform on the container itself.
                // However, the nodes use style={{ transform: translate(x, y) }}
                // We can parse that or use offsetTop/Left if they were standard.
                // Since they are absolute, we can try to parse the transform.
                // Or easier: use the bounding rect of the node and the bounding rect of the container.
                const rect = el.getBoundingClientRect()
                const containerRect = element.getBoundingClientRect()
                
                // Relative position inside the container (taking into account the scale of the container)
                // The container is scaled. The rects are screen coordinates.
                // We want the VISUAL dimensions for the capture, because html-to-image captures the element with its transform.
                // If we divide by scale, we get logical dimensions (e.g. 2000px) while the element is visually 1000px.
                // Capturing with width=2000px when content is 1000px results in 50% whitespace.
                const relativeBottom = (rect.bottom - containerRect.top)
                const relativeRight = (rect.right - containerRect.left)
                
                if (relativeBottom > maxBottom) maxBottom = relativeBottom
                if (relativeRight > maxRight) maxRight = relativeRight
            })
            
            // No padding to avoid empty pages
            // We want to crop exactly at the bottom of the lowest node
        } else {
            // Fallback
            maxRight = element.scrollWidth
            maxBottom = element.scrollHeight
        }

        // Quality settings
        // Reduced pixelRatio to 1.5 to save memory/size, usually sufficient for print
        // Use JPEG for massive compression gains over PNG
        const qualityScale = 1.5
        
        const dataUrl = await toJpeg(element, {
            backgroundColor: '#ffffff',
            quality: 0.8,
            pixelRatio: qualityScale,
            width: maxRight,
            height: maxBottom,
        })
        
        const pdf = new jsPDF({
            orientation: config.orientation,
            unit: 'mm',
            format: config.format
        })
        
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        
        // Define Glue Margin in mm
        const GLUE_MARGIN = 20 // 2cm overlap for easier gluing
        
        // Dimensions calculation
        const logicalWidthPx = maxRight
        const logicalHeightPx = maxBottom
        
        // Convert to mm (assuming 96 DPI screen base)
        const imgWidthMm = logicalWidthPx * (25.4 / 96)
        const imgHeightMm = logicalHeightPx * (25.4 / 96)
        
        // Effective content area per page (subtracting margins where overlaps occur)
        const stepX = pdfWidth - GLUE_MARGIN
        const stepY = pdfHeight - GLUE_MARGIN
        
        const cols = Math.ceil(imgWidthMm / stepX)
        const rows = Math.ceil(imgHeightMm / stepY)
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r > 0 || c > 0) pdf.addPage()
                
                // Position image
                pdf.addImage(
                    dataUrl, 
                    'JPEG', 
                    -(c * stepX), 
                    -(r * stepY), 
                    imgWidthMm, 
                    imgHeightMm
                )
                
                // --- GLUE MARGINS & OVERLAYS ---
                
                // Reset styles
                pdf.setDrawColor(200, 200, 200) // Light Gray
                pdf.setTextColor(150, 150, 150) // Gray Text
                pdf.setFontSize(8)
                
                // 1. Right Margin (if not last column)
                if (c < cols - 1) {
                    // Force white fill for the margin strip to mask the underlying tree
                    pdf.setFillColor(255, 255, 255)
                    pdf.rect(pdfWidth - GLUE_MARGIN, 0, GLUE_MARGIN, pdfHeight, 'F')
                    
                    // Draw separator line
                    pdf.setLineDashPattern([3, 3], 0)
                    pdf.line(pdfWidth - GLUE_MARGIN, 0, pdfWidth - GLUE_MARGIN, pdfHeight)
                    pdf.setLineDashPattern([], 0) // Reset
                    
                    // Add text/guides
                    // Manual positioning to ensure absolute control
                    // Rotation -90 (Top-to-Bottom): Text flows downwards.
                    // Baseline is on the Left of the text (if looking at it upright), 
                    // or effectively, the text body extends to the RIGHT of the coordinate x in the pdf space.
                    // We want the text body to be centered in the margin [W-20, W].
                    // Margin center is W-10.
                    // Text height (approx) is 3mm.
                    // So we want the text to occupy [W-11.5, W-8.5].
                    // So we place the baseline (x) at W-11.5.
                    
                    const textStr = 'COLLER PAGE SUIVANTE ICI →'
                    const textW = pdf.getTextWidth(textStr)
                    const xPos = pdfWidth - 10 - (3 / 2) // Approximation of font height centering
                    const yPos = (pdfHeight / 2) + (textW / 2) // Start y so it centers
                    
                    pdf.text(textStr, xPos, yPos, { angle: -90 })
                    
                    // Page info in margin
                    pdf.text(`P. ${r+1}-${c+1}`, pdfWidth - 10, 10, { align: 'center' })
                }

                // 2. Bottom Margin (if not last row)
                if (r < rows - 1) {
                    // Force white fill for the bottom margin strip
                    pdf.setFillColor(255, 255, 255)
                    pdf.rect(0, pdfHeight - GLUE_MARGIN, pdfWidth, GLUE_MARGIN, 'F')
                    
                    // Draw separator line
                    pdf.setLineDashPattern([3, 3], 0)
                    pdf.line(0, pdfHeight - GLUE_MARGIN, pdfWidth, pdfHeight - GLUE_MARGIN)
                    pdf.setLineDashPattern([], 0) // Reset
                    
                    // Place text in the center of the margin
                    pdf.text('COLLER PAGE SUIVANTE ICI ↓', pdfWidth/2, pdfHeight - 5, { align: 'center' })
                    
                    // Corner handling if both margins exist
                    if (c < cols - 1) {
                        // Clear the corner to keep it clean
                         pdf.rect(pdfWidth - GLUE_MARGIN, pdfHeight - GLUE_MARGIN, GLUE_MARGIN, GLUE_MARGIN, 'F')
                    }
                }
                
                // If it's the last page (no margins), put a small page number in corner
                if (c === cols - 1 && r === rows - 1) {
                    pdf.text(`Page ${r+1}-${c+1} (Fin)`, pdfWidth - 20, pdfHeight - 10)
                }
            }
        }
        
        pdf.save(`genealogie-${tree?.name || 'export'}.pdf`)
        
    } catch (e) {
        console.error(e)
        const msg = e instanceof Error ? e.message : 'Erreur inconnue'
        alert('Erreur lors de la génération du PDF: ' + msg)
    } finally {
        setScale(originalScale)
        setIsExportingPdf(false)
        setShowPdfModal(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && <div className="rounded bg-rose-100 text-rose-700 px-3 py-2">{error}</div>}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 border border-slate-200 p-6">
        <h1 className="text-3xl font-semibold text-slate-800">{tree?.name ?? 'Éditeur d\'arbre'}</h1>
        {tree?.description && <p className="mt-1 text-slate-600">{tree.description}</p>}
      </div>
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow min-h-[600px] overflow-hidden relative flex flex-col">
            {/* View Selector */}
            <div className="absolute top-4 left-4 z-10 flex bg-white rounded-lg shadow border border-slate-200 p-1 gap-1">
                <button 
                    onClick={() => setViewMode('standard')}
                    className={`p-2 rounded ${viewMode === 'standard' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Arbre Standard"
                >
                    <Layout size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('fan')}
                    className={`p-2 rounded ${viewMode === 'fan' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Roue d'Ascendance"
                >
                    <Circle size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('wheel')}
                    className={`p-2 rounded ${viewMode === 'wheel' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Roue Familiale (Descendance)"
                >
                    <Users size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('artistic')}
                    className={`p-2 rounded ${viewMode === 'artistic' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Arbre Artistique"
                >
                    <GitFork size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('timeline')}
                    className={`p-2 rounded ${viewMode === 'timeline' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                    title="Frise Temporelle"
                >
                    <Clock size={20} />
                </button>
            </div>

            {/* Controls overlay (Only for standard view or those needing zoom) */}
            {viewMode === 'standard' && (
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                    <button className="bg-white border border-slate-200 shadow rounded p-2 hover:bg-slate-50" onClick={()=>setScale(s=> Math.min(2, s+0.1))}>Zoom +</button>
                    <button className="bg-white border border-slate-200 shadow rounded p-2 hover:bg-slate-50" onClick={()=>setScale(s=> Math.max(0.5, s-0.1))}>Zoom −</button>
                </div>
            )}
            
            <div className="w-full h-full flex-1 relative overflow-auto">
                {centerId ? (
                    <>
                        {viewMode === 'standard' && (
                            <FamilyTree 
                                ref={treeRef}
                                key={key}
                                nodes={treeNodes} 
                                rootId={centerId} 
                                onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                selectedId={selectedPersonId}
                                scale={scale}
                            />
                        )}
                        {viewMode === 'fan' && (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <AncestorFanChart 
                                    persons={persons}
                                    rootId={centerId}
                                    onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                    width={800}
                                    height={600}
                                />
                            </div>
                        )}
                        {viewMode === 'wheel' && (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <DescendantWheel 
                                    persons={persons}
                                    rootId={centerId}
                                    onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                    width={800}
                                    height={600}
                                />
                            </div>
                        )}
                        {viewMode === 'artistic' && (
                            <div className="w-full h-full flex items-center justify-center p-4 bg-[#fdfbf7]">
                                <TreeArtistic 
                                    persons={persons}
                                    rootId={centerId}
                                    onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                    width={800}
                                    height={600}
                                />
                            </div>
                        )}
                        {viewMode === 'timeline' && (
                            <div className="w-full h-full p-4">
                                <TimelineChart 
                                    persons={persons}
                                    rootId={centerId}
                                    onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                    width={1200}
                                    livingThreshold={tree?.livingThreshold}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        Sélectionnez une personne centrale ou ajoutez des personnes
                    </div>
                )}
            </div>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-xl shadow p-6 h-fit">
          <h2 className="text-lg font-semibold text-slate-800">Outils</h2>
          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
              <select className="px-3 py-2 rounded border w-full" value={centerId || ''} onChange={e=> setCenterId(e.target.value)}>
                <option value="">-- Personne centrale --</option>
                {persons.map(p=> <option key={p.id} value={p.id}>{p.firstName} {p.lastName} {p.gedcomId ? `(GED ${p.gedcomId})` : ''}</option>)}
              </select>
            </div>
            <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={async()=>{ if (!id || !centerId) return; await api(`/trees/${id}`, { method:'PATCH', body: JSON.stringify({ rootPersonId: centerId }) }); }}>Définir comme racine</button>
            <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={openAddPersonModal}>Ajouter une personne</button>
            <button className="px-4 py-2 rounded bg-slate-100 text-slate-700" onClick={()=> document.getElementById('add_event')?.showModal()}>Ajouter un événement</button>
            <button className="px-4 py-2 rounded bg-slate-100 text-slate-700" onClick={() => setShowPdfModal(true)}>Exporter en PDF</button>
            <button className="px-4 py-2 rounded bg-slate-100 text-slate-700" onClick={() => document.getElementById('tree_settings')?.showModal()}>Paramètres</button>
            
            <details className="rounded-xl border border-slate-200">
              <summary className="px-4 py-2">Lier parenté</summary>
              <div className="p-4 grid gap-2">
                <select id="child" className="px-3 py-2 rounded border">{persons.map(p=> <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select>
                <select id="father" className="px-3 py-2 rounded border"><option value="">(Père optionnel)</option>{persons.map(p=> <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select>
                <select id="mother" className="px-3 py-2 rounded border"><option value="">(Mère optionnel)</option>{persons.map(p=> <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select>
                <button className="px-4 py-2 rounded bg-emerald-500 text-white" onClick={async()=>{ const child=(document.getElementById('child') as HTMLSelectElement).value; const father=(document.getElementById('father') as HTMLSelectElement).value || null; const mother=(document.getElementById('mother') as HTMLSelectElement).value || null; await api(`/persons/${child}`, { method:'PATCH', body: JSON.stringify({ fatherId: father, motherId: mother }) }); setPersons(prev=> prev.map(p=> p.id===child ? { ...p, fatherId: father, motherId: mother } : p)) }}>Enregistrer</button>
              </div>
            </details>
            
            {id && <a className="px-4 py-2 rounded bg-slate-100 text-slate-700 text-center" href={`/api/gedcom/export/${id}`} target="_blank">Exporter GEDCOM</a>}
          </div>
        </div>
      </div>

      <dialog id="tree_settings" className="rounded-xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow p-6 w-[400px]">
          <h3 className="text-lg font-semibold text-slate-800">Paramètres de l'arbre</h3>
          <form className="mt-4 grid gap-3" onSubmit={async (e) => {
            e.preventDefault()
            if (!tree) return
            const val = parseInt((document.getElementById('livingThreshold') as HTMLInputElement).value)
            if (isNaN(val)) return
            await api(`/trees/${tree.id}`, { method: 'PATCH', body: JSON.stringify({ livingThreshold: val }) })
            setTree({ ...tree, livingThreshold: val })
            ;(document.getElementById('tree_settings') as HTMLDialogElement).close()
          }}>
             <div className="space-y-1">
               <label className="text-sm font-medium text-slate-700">Seuil de vie (années)</label>
               <p className="text-xs text-slate-500">Âge au-delà duquel une personne sans date de décès est considérée comme décédée.</p>
               <input 
                 id="livingThreshold" 
                 type="number" 
                 min="1" 
                 max="200"
                 defaultValue={tree?.livingThreshold ?? 100}
                 className="w-full px-3 py-2 border rounded-md" 
               />
             </div>
             <div className="flex justify-end gap-2 mt-2">
               <button type="button" className="px-4 py-2 rounded bg-slate-100 text-slate-700" onClick={() => (document.getElementById('tree_settings') as HTMLDialogElement).close()}>Annuler</button>
               <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Enregistrer</button>
             </div>
          </form>
        </div>
      </dialog>

      <dialog id="add_person" className="rounded-xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow p-6 w-[1024px] max-w-[95vw]">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Nouvelle personne
            {nextGedcomId && <span className="text-xs font-mono font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">{nextGedcomId}</span>}
          </h3>
          <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={async (e)=>{ 
            e.preventDefault(); 
            if (!id) return; 
            
            const payload: { treeId:string, firstName:string, lastName:string, gender?:string, middleName?:string, maidenName?:string, occupation?:string, isLiving?:boolean, notes?:string, biography?:string, gedcomId?:string } = { treeId:id, firstName:newPerson.firstName, lastName:newPerson.lastName, gender:newPerson.gender }; 
            
            if (nextGedcomId) payload.gedcomId = nextGedcomId;
            
            const middle=(document.getElementById('middleName') as HTMLInputElement).value; 
            if(middle) payload.middleName=middle; 
            
            const maiden=(document.getElementById('maidenName') as HTMLInputElement).value; 
            if(maiden) payload.maidenName=maiden; 
            
            const occ=(document.getElementById('occupation') as HTMLInputElement).value; 
            if(occ) payload.occupation=occ; 
            
            const living=(document.getElementById('isLiving') as HTMLInputElement).checked; 
            payload.isLiving=living; 
            
            const notes=(document.getElementById('notes') as HTMLTextAreaElement).value; 
            if(notes) payload.notes=notes; 
            
            const bio=(document.getElementById('biography') as HTMLTextAreaElement).value; 
            if(bio) payload.biography=bio; 
            
            const created = await api<Person>('/persons', { method:'POST', body: JSON.stringify(payload) });
            
            // créer les événements dynamiques
            for (const ev of newEvents) {
              const r = await api<{id:string}>('/events', { method:'POST', body: JSON.stringify({ personId: created.id, type: ev.type, date: ev.date, time: ev.time, place: ev.place, placeSubdivision: ev.placeSubdivision, description: ev.description, isPrivate: ev.isPrivate }) })
              if (ev.files && Array.isArray(ev.files)) {
                for (const f of ev.files) {
                  const fd = new FormData(); fd.append('file', f); fd.append('personId', created.id); fd.append('eventId', r.id || '');
                  await fetch('/api/media', { method:'POST', body: fd })
                }
              }
            }
            setPersons(prev=>[...prev, created]); setNewPerson({ firstName:'', lastName:'', gender:'M' }); setNewEvents([]); (document.getElementById('add_person') as HTMLDialogElement).close(); 
          }}>
            <input className="px-3 py-2 rounded border" placeholder="Prénom" value={newPerson.firstName} onChange={e=>setNewPerson(v=>({ ...v, firstName: e.target.value }))} />
            <input id="middleName" className="px-3 py-2 rounded border" placeholder="Second prénom" />
            <input className="px-3 py-2 rounded border" placeholder="Nom" value={newPerson.lastName} onChange={e=>setNewPerson(v=>({ ...v, lastName: e.target.value }))} />
            <input id="maidenName" className="px-3 py-2 rounded border" placeholder="Nom de naissance" />
            <select className="px-3 py-2 rounded border" value={newPerson.gender} onChange={e=>setNewPerson(v=>({ ...v, gender: e.target.value }))}>
              <option value="M">Homme</option>
              <option value="F">Femme</option>
            </select>
            <input id="occupation" className="px-3 py-2 rounded border" placeholder="Profession" />
            <label className="col-span-2 flex items-center gap-2"><input id="isLiving" type="checkbox" defaultChecked className="rounded" /> Vivant</label>
            
            <div className="col-span-2 mt-2">
              <h4 className="text-md font-semibold text-slate-800 mb-2">Événements</h4>
              <div className="grid gap-3">
                {newEvents.map((ev, idx)=> (
                  <div key={idx} className="grid grid-cols-6 gap-2 items-center border border-slate-200 rounded p-2">
                    <select className="px-3 py-2 rounded border" value={ev.type} onChange={e=>{ const v=e.target.value; setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, type:v } : x)) }}>
                      <option value="BIRTH">Naissance</option>
                      <option value="BAPTISM">Baptême</option>
                      <option value="MARRIAGE">Mariage</option>
                      <option value="DEATH">Décès</option>
                      <option value="OTHER">Autre</option>
                    </select>
                    <input type="date" className="px-3 py-2 rounded border" value={ev.date||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, date:e.target.value } : x)) } />
                    <input type="time" className="px-3 py-2 rounded border" value={ev.time||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, time:e.target.value } : x)) } />
                    <input className="px-3 py-2 rounded border" placeholder="Lieu" value={ev.place||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, place:e.target.value } : x)) } />
                    <input className="px-3 py-2 rounded border" placeholder="Subdivision" value={ev.placeSubdivision||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, placeSubdivision:e.target.value } : x)) } />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={!!ev.isPrivate} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, isPrivate: e.target.checked } : x)) } /> Privé</label>
                      <button type="button" className="px-3 py-2 rounded bg-rose-500 text-white" onClick={()=> setNewEvents(list=> list.filter((_,i)=> i!==idx))}>Supprimer</button>
                    </div>
                    <div className="col-span-6">
                      <input multiple type="file" className="px-3 py-2 rounded border w-full" onChange={e=>{ const files=Array.from(e.target.files||[]); setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, files } : x)) }} />
                    </div>
                    <textarea className="col-span-6 px-3 py-2 rounded border" placeholder="Description / Cause" value={ev.description||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, description:e.target.value } : x)) } />
                  </div>
                ))}
                <button type="button" className="px-4 py-2 rounded bg-slate-100 text-slate-700" onClick={()=> setNewEvents(list=> [...list, { type:'BIRTH' }])}>Ajouter un événement</button>
              </div>
            </div>
            <div className="col-span-2 mt-4">
              <h4 className="text-md font-semibold text-slate-800 mb-2">Notes & Biographie</h4>
              <textarea id="notes" className="col-span-2 px-3 py-2 rounded border w-full" placeholder="Notes"></textarea>
              <textarea id="biography" className="col-span-2 px-3 py-2 rounded border w-full mt-2" placeholder="Biographie"></textarea>
            </div>

            <div className="col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={()=> (document.getElementById('add_person') as HTMLDialogElement).close()}>Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      </dialog>

      <dialog id="add_event" className="rounded-xl">
        <div className="bg-white rounded-xl border border-slate-200 shadow p-6 w-[720px] max-w-full">
          <h3 className="text-lg font-semibold text-slate-800">Nouvel événement</h3>
          <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={async (e)=>{ e.preventDefault(); const personSel=(document.getElementById('eventPerson') as HTMLSelectElement).value || persons[0]?.id; const type=(document.getElementById('eventType') as HTMLSelectElement).value; const date=(document.getElementById('eventDate') as HTMLInputElement).value; const time=(document.getElementById('eventTime') as HTMLInputElement).value; const place=(document.getElementById('eventPlace') as HTMLInputElement).value; const sub=(document.getElementById('eventPlaceSub') as HTMLInputElement).value; const desc=(document.getElementById('eventDesc') as HTMLTextAreaElement).value; const priv=(document.getElementById('eventPrivate') as HTMLInputElement).checked; await api('/persons/'+personSel+'/events'); await api<{id:string}>('/events', { method:'POST', body: JSON.stringify({ personId: personSel, type, date, time, place, placeSubdivision: sub, description: desc, isPrivate: priv }) }); (document.getElementById('add_event') as HTMLDialogElement).close(); }}>
            <select id="eventPerson" className="px-3 py-2 rounded border">{persons.map(p=> <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select>
            <select id="eventType" className="px-3 py-2 rounded border">
              <option value="BIRTH">Naissance</option>
              <option value="BAPTISM">Baptême</option>
              <option value="MARRIAGE">Mariage</option>
              <option value="DEATH">Décès</option>
              <option value="OTHER">Autre</option>
            </select>
            <input id="eventDate" type="date" className="px-3 py-2 rounded border" />
            <input id="eventTime" type="time" className="px-3 py-2 rounded border" />
            <input id="eventPlace" className="px-3 py-2 rounded border" placeholder="Lieu" />
            <input id="eventPlaceSub" className="px-3 py-2 rounded border" placeholder="Subdivision du lieu" />
            <label className="flex items-center gap-2"><input id="eventPrivate" type="checkbox" className="rounded" /> Événement privé</label>
            <textarea id="eventDesc" className="col-span-2 px-3 py-2 rounded border" placeholder="Description / Cause"></textarea>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={()=> (document.getElementById('add_event') as HTMLDialogElement).close()}>Annuler</button>
              <button type="submit" className="px-4 py-2 rounded bg-emerald-500 text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      </dialog>

      <PersonEditor 
        personId={isEditorOpen ? selectedPersonId : null}
        onClose={() => { setIsEditorOpen(false); setCreationMode(null); }}
        onUpdate={handlePersonUpdate}
        onPersonCreated={handlePersonCreated}
        onSelect={(id) => { setSelectedPersonId(id); setCreationMode(null); setIsEditorOpen(true); }}
        livingThreshold={tree?.livingThreshold ?? 100}
        initialData={creationMode?.initialData}
        creationContext={creationMode?.context}
        onRequestCreate={handleRequestCreate}
      />

      <ExportPdfModal 
        isOpen={showPdfModal} 
        onClose={() => setShowPdfModal(false)} 
        onExport={handleExportPdf}
        isProcessing={isExportingPdf}
      />
    </div>
  )
}
