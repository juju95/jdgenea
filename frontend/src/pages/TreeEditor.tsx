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

import { ZoomPanContainer } from '../components/ZoomPanContainer'

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

  const sortedPersons = useMemo(() => {
      return [...persons].sort((a, b) => {
          const la = (a.lastName || '').toLowerCase()
          const lb = (b.lastName || '').toLowerCase()
          if (la !== lb) return la.localeCompare(lb)
          
          const fa = (a.firstName || '').toLowerCase()
          const fb = (b.firstName || '').toLowerCase()
          return fa.localeCompare(fb)
      })
  }, [persons])

  useEffect(()=>{ (async()=>{ try { if (id) { const t = await api<{id:string,name:string,description?:string, rootPersonId?: string, livingThreshold?: number}>(`/trees/${id}`); setTree(t) } } catch(e){ if(e instanceof Error) setError(e.message) } })() },[id])
  useEffect(()=>{ (async()=>{ try { if (id) { const list = await api<Person[]>(`/persons?treeId=${id}`); setPersons(list); const fam = await api<Array<{id:string,treeId:string,husbandId?:string|null,wifeId?:string|null}>>(`/families?treeId=${id}`); setFamilies(fam) } } catch(e){ if(e instanceof Error) setError(e.message) } })() },[id])

  const [centerId, setCenterId] = useState<string|string|undefined>()
  const [vizRootId, setVizRootId] = useState<string|undefined>() // Pour la navigation locale dans les vues
  const [vizDepth, setVizDepth] = useState<number>(4)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [creationMode, setCreationMode] = useState<{
      initialData: Partial<Person>,
      context: { type: 'father' | 'mother' | 'spouse' | 'child', sourcePerson: Person }
  } | null>(null)

  useEffect(() => {
    if (viewMode === 'standard') {
      setScale(0.6)
    } else if (['fan', 'wheel', 'artistic', 'timeline'].includes(viewMode)) {
      setScale(1)
    }
  }, [viewMode])

  useEffect(()=>{ if (tree && tree.rootPersonId) setCenterId(tree.rootPersonId) },[tree])
  // Réinitialiser la vue locale si la racine principale change
  useEffect(() => { setVizRootId(undefined) }, [centerId])

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
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      {error && (
        <div role="alert" className="alert alert-error shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      
      <div className="card bg-base-100 shadow-sm border border-base-200 shrink-0">
        <div className="card-body py-4 flex-row items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-primary">{tree?.name ?? 'Éditeur d\'arbre'}</h1>
                {tree?.description && <p className="text-sm text-base-content/70">{tree.description}</p>}
            </div>
            <div className="join shadow-sm">
                <button 
                    onClick={() => setViewMode('standard')}
                    className={`btn btn-sm join-item ${viewMode === 'standard' ? 'btn-primary' : 'btn-ghost'}`}
                    title="Arbre Standard"
                >
                    <Layout size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('fan')}
                    className={`btn btn-sm join-item ${viewMode === 'fan' ? 'btn-primary' : 'btn-ghost'}`}
                    title="Roue d'Ascendance"
                >
                    <Circle size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('wheel')}
                    className={`btn btn-sm join-item ${viewMode === 'wheel' ? 'btn-primary' : 'btn-ghost'}`}
                    title="Roue Familiale (Descendance)"
                >
                    <Users size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('artistic')}
                    className={`btn btn-sm join-item ${viewMode === 'artistic' ? 'btn-primary' : 'btn-ghost'}`}
                    title="Arbre Artistique"
                >
                    <GitFork size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('timeline')}
                    className={`btn btn-sm join-item ${viewMode === 'timeline' ? 'btn-primary' : 'btn-ghost'}`}
                    title="Frise Temporelle"
                >
                    <Clock size={18} />
                </button>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-6 flex-1 min-h-0 overflow-hidden">
        <div className="card bg-base-100 shadow-xl border border-base-200 h-full relative flex flex-col overflow-hidden">
            {/* Controls overlay */}
            <div className="absolute top-4 right-4 z-[60] join join-vertical shadow-sm">
                <button className="btn btn-sm btn-circle btn-ghost join-item bg-base-100" onClick={()=>setScale(s=> Math.min(2, s+0.1))}>+</button>
                <button className="btn btn-sm btn-circle btn-ghost join-item bg-base-100" onClick={()=>setScale(s=> Math.max(0.2, s-0.1))}>−</button>
            </div>
            
            <div className="w-full h-full flex-1 relative overflow-auto bg-base-200/30">
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
                                livingThreshold={tree?.livingThreshold}
                            />
                        )}
                        {viewMode === 'fan' && (
                            <div className="w-full h-full flex flex-col overflow-hidden">
                                <div className="p-2 border-b border-base-200 bg-base-100/80 backdrop-blur flex items-center gap-2 z-10 shrink-0">
                                    <span className="text-sm font-semibold text-base-content/70">Personne centrale (Vue) :</span>
                                    <select 
                                        className="select select-bordered select-sm max-w-xs" 
                                        value={vizRootId || centerId || ''} 
                                        onChange={e=> setVizRootId(e.target.value)}
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        {sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>)}
                                    </select>
                                    <span className="text-sm font-semibold text-base-content/70 ml-4">Niveaux :</span>
                                    <select 
                                        className="select select-bordered select-sm w-20" 
                                        value={vizDepth} 
                                        onChange={e=> setVizDepth(parseInt(e.target.value))}
                                    >
                                        {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <ZoomPanContainer scale={scale} contentWidth={Math.max(800, vizDepth * 160)} contentHeight={Math.max(600, vizDepth * 120)}>
                                    <AncestorFanChart 
                                        persons={persons}
                                        rootId={vizRootId || centerId}
                                        onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                        width={Math.max(800, vizDepth * 160)}
                                        height={Math.max(600, vizDepth * 120)}
                                        maxDepth={vizDepth}
                                    />
                                </ZoomPanContainer>
                            </div>
                        )}
                        {viewMode === 'wheel' && (
                            <div className="w-full h-full flex flex-col overflow-hidden">
                                <div className="p-2 border-b border-base-200 bg-base-100/80 backdrop-blur flex items-center gap-2 z-10 shrink-0">
                                    <span className="text-sm font-semibold text-base-content/70">Personne centrale (Vue) :</span>
                                    <select 
                                        className="select select-bordered select-sm max-w-xs" 
                                        value={vizRootId || centerId || ''} 
                                        onChange={e=> setVizRootId(e.target.value)}
                                    >
                                        <option value="">-- Sélectionner --</option>
                                        {sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>)}
                                    </select>
                                    <span className="text-sm font-semibold text-base-content/70 ml-4">Niveaux :</span>
                                    <select 
                                        className="select select-bordered select-sm w-20" 
                                        value={vizDepth} 
                                        onChange={e=> setVizDepth(parseInt(e.target.value))}
                                    >
                                        {[3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <ZoomPanContainer scale={scale} contentWidth={Math.max(800, vizDepth * 160)} contentHeight={Math.max(600, vizDepth * 120)}>
                                    <DescendantWheel 
                                        persons={persons}
                                        rootId={vizRootId || centerId}
                                        onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                        width={Math.max(800, vizDepth * 160)}
                                        height={Math.max(600, vizDepth * 120)}
                                        maxDepth={vizDepth}
                                    />
                                </ZoomPanContainer>
                            </div>
                        )}
                        {viewMode === 'artistic' && (
                            <ZoomPanContainer scale={scale} contentWidth={800} contentHeight={600} className="bg-[#fdfbf7]">
                                <TreeArtistic 
                                    persons={persons}
                                    rootId={centerId}
                                    onSelect={(id) => { setSelectedPersonId(id); setIsEditorOpen(true); }}
                                    width={800}
                                    height={600}
                                />
                            </ZoomPanContainer>
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
        
        <div className="card bg-base-100 shadow-xl border border-base-200 h-fit">
          <div className="card-body">
            <h2 className="card-title text-lg font-bold text-base-content">Outils</h2>
            <div className="mt-4 grid gap-3">
              <div className="form-control w-full">
                <select className="select select-bordered select-sm w-full" value={centerId || ''} onChange={e=> setCenterId(e.target.value)}>
                  <option value="">-- Personne centrale --</option>
                  {sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''} {p.gedcomId ? `(GED ${p.gedcomId})` : ''}</option>)}
                </select>
              </div>
              <button className="btn btn-sm btn-primary w-full text-white" onClick={async()=>{ if (!id || !centerId) return; await api(`/trees/${id}`, { method:'PATCH', body: JSON.stringify({ rootPersonId: centerId }) }); }}>Définir comme racine</button>
              <button className="btn btn-sm btn-outline btn-primary w-full" onClick={openAddPersonModal}>Ajouter une personne</button>
              <button className="btn btn-sm btn-ghost w-full border border-base-300" onClick={()=> document.getElementById('add_event')?.showModal()}>Ajouter un événement</button>
              <button className="btn btn-sm btn-ghost w-full border border-base-300" onClick={() => setShowPdfModal(true)}>Exporter en PDF</button>
              <button className="btn btn-sm btn-ghost w-full border border-base-300" onClick={() => document.getElementById('tree_settings')?.showModal()}>Paramètres</button>
              
              <div className="collapse collapse-arrow border border-base-200 bg-base-100 rounded-box">
                <input type="checkbox" /> 
                <div className="collapse-title font-medium">
                  Lier parenté
                </div>
                <div className="collapse-content">
                  <div className="grid gap-2 pt-2">
                    <select id="child" className="select select-bordered select-xs w-full">{sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>)}</select>
                    <select id="father" className="select select-bordered select-xs w-full"><option value="">(Père optionnel)</option>{sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>)}</select>
                    <select id="mother" className="select select-bordered select-xs w-full"><option value="">(Mère optionnel)</option>{sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>)}</select>
                    <button className="btn btn-xs btn-success text-white w-full" onClick={async()=>{ const child=(document.getElementById('child') as HTMLSelectElement).value; const father=(document.getElementById('father') as HTMLSelectElement).value || null; const mother=(document.getElementById('mother') as HTMLSelectElement).value || null; await api(`/persons/${child}`, { method:'PATCH', body: JSON.stringify({ fatherId: father, motherId: mother }) }); setPersons(prev=> prev.map(p=> p.id===child ? { ...p, fatherId: father, motherId: mother } : p)) }}>Enregistrer</button>
                  </div>
                </div>
              </div>
              
              {id && <a className="btn btn-sm btn-neutral w-full" href={`/api/gedcom/export/${id}`} target="_blank">Exporter GEDCOM</a>}
            </div>
          </div>
        </div>
      </div>

      <dialog id="tree_settings" className="modal">
        <div className="modal-box w-11/12 max-w-lg overflow-x-hidden">
          <h3 className="font-bold text-lg">Paramètres de l'arbre</h3>
          <form className="mt-4 grid gap-3" onSubmit={async (e) => {
            e.preventDefault()
            if (!tree) return
            const val = parseInt((document.getElementById('livingThreshold') as HTMLInputElement).value)
            if (isNaN(val)) return
            await api(`/trees/${tree.id}`, { method: 'PATCH', body: JSON.stringify({ livingThreshold: val }) })
            setTree({ ...tree, livingThreshold: val })
            ;(document.getElementById('tree_settings') as HTMLDialogElement).close()
          }}>
             <div className="form-control">
               <label className="label">
                 <span className="label-text">Seuil de vie (années)</span>
               </label>
               <input 
                 id="livingThreshold" 
                 type="number" 
                 min="1" 
                 max="200"
                 defaultValue={tree?.livingThreshold ?? 100}
                 className="input input-bordered w-full" 
               />
               <label className="label max-w-full">
                 <span className="label-text-alt text-base-content/60 whitespace-normal break-words">Âge au-delà duquel une personne sans date de décès est considérée comme décédée.</span>
               </label>
             </div>
             <div className="modal-action">
               <button type="button" className="btn btn-ghost" onClick={() => (document.getElementById('tree_settings') as HTMLDialogElement).close()}>Annuler</button>
               <button type="submit" className="btn btn-primary">Enregistrer</button>
             </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
      </dialog>

      <dialog id="add_person" className="modal">
        <div className="modal-box w-11/12 max-w-5xl overflow-x-hidden">
          <h3 className="font-bold text-lg flex items-center gap-2">
            Nouvelle personne
            {nextGedcomId && <div className="badge badge-neutral font-mono">{nextGedcomId}</div>}
          </h3>
          <form className="mt-4 grid grid-cols-2 gap-4" onSubmit={async (e)=>{ 
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
            <div className="form-control">
              <label className="label">
                <span className="label-text">Prénom</span>
              </label>
              <input className="input input-bordered w-full" placeholder="Ex: Jean" value={newPerson.firstName} onChange={e=>setNewPerson(v=>({ ...v, firstName: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Second prénom</span>
              </label>
              <input id="middleName" className="input input-bordered w-full" placeholder="Ex: Pierre" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom</span>
              </label>
              <input className="input input-bordered w-full uppercase" placeholder="Ex: DUPONT" value={newPerson.lastName} onChange={e=>setNewPerson(v=>({ ...v, lastName: e.target.value }))} />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom de naissance</span>
              </label>
              <input id="maidenName" className="input input-bordered w-full uppercase" placeholder="Si différent" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Sexe</span>
              </label>
              <select className="select select-bordered w-full" value={newPerson.gender} onChange={e=>setNewPerson(v=>({ ...v, gender: e.target.value }))}>
                <option value="M">Homme</option>
                <option value="F">Femme</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Profession</span>
              </label>
              <input id="occupation" className="input input-bordered w-full" placeholder="Ex: Boulanger" />
            </div>
            
            <div className="form-control col-span-2">
               <label className="label cursor-pointer justify-start gap-3">
                 <input id="isLiving" type="checkbox" defaultChecked className="checkbox" /> 
                 <span className="label-text">Personne vivante</span>
               </label>
            </div>
            
            <div className="col-span-2 mt-4">
              <h4 className="text-md font-bold text-base-content mb-4 flex items-center gap-2">
                Événements
                <div className="badge badge-sm badge-ghost">{newEvents.length}</div>
              </h4>
              <div className="grid gap-3">
                {newEvents.map((ev, idx)=> (
                  <div key={idx} className="grid grid-cols-6 gap-3 items-end border border-base-200 rounded-lg p-4 bg-base-50/50">
                    <div className="col-span-2 form-control">
                        <label className="label"><span className="label-text-alt">Type</span></label>
                        <select className="select select-bordered select-sm w-full" value={ev.type} onChange={e=>{ const v=e.target.value; setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, type:v } : x)) }}>
                          <option value="BIRTH">Naissance</option>
                          <option value="BAPTISM">Baptême</option>
                          <option value="MARRIAGE">Mariage</option>
                          <option value="DEATH">Décès</option>
                          <option value="OTHER">Autre</option>
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text-alt">Date</span></label>
                        <input type="date" className="input input-bordered input-sm w-full" value={ev.date||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, date:e.target.value } : x)) } />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text-alt">Heure</span></label>
                        <input type="time" className="input input-bordered input-sm w-full" value={ev.time||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, time:e.target.value } : x)) } />
                    </div>
                    <div className="col-span-2 form-control">
                        <label className="label"><span className="label-text-alt">Lieu</span></label>
                        <input className="input input-bordered input-sm w-full" placeholder="Lieu" value={ev.place||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, place:e.target.value } : x)) } />
                    </div>
                    
                    <div className="col-span-2 form-control">
                        <label className="label"><span className="label-text-alt">Subdivision</span></label>
                        <input className="input input-bordered input-sm w-full" placeholder="Subdivision" value={ev.placeSubdivision||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, placeSubdivision:e.target.value } : x)) } />
                    </div>
                    <div className="col-span-2 flex items-center gap-2 pb-1">
                      <label className="label cursor-pointer gap-2"><input type="checkbox" className="checkbox checkbox-sm" checked={!!ev.isPrivate} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, isPrivate: e.target.checked } : x)) } /><span className="label-text">Privé</span></label>
                    </div>
                    <div className="col-span-2 pb-1 flex justify-end">
                      <button type="button" className="btn btn-sm btn-error btn-ghost text-error" onClick={()=> setNewEvents(list=> list.filter((_,i)=> i!==idx))}>Supprimer</button>
                    </div>
                    
                    <div className="col-span-3 form-control">
                      <input multiple type="file" className="file-input file-input-bordered file-input-sm w-full" onChange={e=>{ const files=Array.from(e.target.files||[]); setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, files } : x)) }} />
                    </div>
                    <div className="col-span-3 form-control">
                        <textarea className="textarea textarea-bordered textarea-sm w-full h-10 min-h-[2.5rem]" placeholder="Description / Cause" value={ev.description||''} onChange={e=> setNewEvents(list=> list.map((x,i)=> i===idx? { ...x, description:e.target.value } : x)) } />
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline btn-primary border-dashed" onClick={()=> setNewEvents(list=> [...list, { type:'BIRTH' }])}>
                    + Ajouter un événement
                </button>
              </div>
            </div>
            <div className="col-span-2 mt-4 grid gap-4">
              <h4 className="text-md font-bold text-base-content">Notes & Biographie</h4>
              <div className="form-control">
                  <label className="label"><span className="label-text">Notes</span></label>
                  <textarea id="notes" className="textarea textarea-bordered w-full h-24" placeholder="Notes privées..."></textarea>
              </div>
              <div className="form-control">
                  <label className="label"><span className="label-text">Biographie</span></label>
                  <textarea id="biography" className="textarea textarea-bordered w-full h-32" placeholder="Biographie publique..."></textarea>
              </div>
            </div>

            <div className="col-span-2 modal-action">
              <button type="button" className="btn btn-ghost" onClick={()=> (document.getElementById('add_person') as HTMLDialogElement).close()}>Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
      </dialog>

      <dialog id="add_event" className="modal">
        <div className="modal-box w-11/12 max-w-3xl">
          <h3 className="font-bold text-lg">Nouvel événement</h3>
          <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={async (e)=>{ e.preventDefault(); const personSel=(document.getElementById('eventPerson') as HTMLSelectElement).value || persons[0]?.id; const type=(document.getElementById('eventType') as HTMLSelectElement).value; const date=(document.getElementById('eventDate') as HTMLInputElement).value; const time=(document.getElementById('eventTime') as HTMLInputElement).value; const place=(document.getElementById('eventPlace') as HTMLInputElement).value; const sub=(document.getElementById('eventPlaceSub') as HTMLInputElement).value; const desc=(document.getElementById('eventDesc') as HTMLTextAreaElement).value; const priv=(document.getElementById('eventPrivate') as HTMLInputElement).checked; await api('/persons/'+personSel+'/events'); await api<{id:string}>('/events', { method:'POST', body: JSON.stringify({ personId: personSel, type, date, time, place, placeSubdivision: sub, description: desc, isPrivate: priv }) }); (document.getElementById('add_event') as HTMLDialogElement).close(); }}>
            <div className="col-span-2 form-control">
              <label className="label">
                <span className="label-text">Personne concernée</span>
              </label>
              <select id="eventPerson" className="select select-bordered w-full">{sortedPersons.map(p=> <option key={p.id} value={p.id}>{p.lastName?.toUpperCase()} {p.firstName} {p.sosa ? `(SOSA ${p.sosa})` : ''}</option>)}</select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Type d'événement</span>
              </label>
              <select id="eventType" className="select select-bordered w-full">
                <option value="BIRTH">Naissance</option>
                <option value="BAPTISM">Baptême</option>
                <option value="MARRIAGE">Mariage</option>
                <option value="DEATH">Décès</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Date</span>
              </label>
              <input id="eventDate" type="date" className="input input-bordered w-full" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Heure</span>
              </label>
              <input id="eventTime" type="time" className="input input-bordered w-full" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Lieu</span>
              </label>
              <input id="eventPlace" className="input input-bordered w-full" placeholder="Ex: Paris" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Subdivision</span>
              </label>
              <input id="eventPlaceSub" className="input input-bordered w-full" placeholder="Ex: Hôpital Saint-Louis" />
            </div>
            <div className="form-control">
               <label className="label cursor-pointer justify-start gap-3">
                 <input id="eventPrivate" type="checkbox" className="checkbox" /> 
                 <span className="label-text">Événement privé</span>
               </label>
            </div>
            <div className="col-span-2 form-control">
              <label className="label">
                <span className="label-text">Description / Cause</span>
              </label>
              <textarea id="eventDesc" className="textarea textarea-bordered w-full" placeholder="Détails supplémentaires..."></textarea>
            </div>
            <div className="col-span-2 modal-action">
              <button type="button" className="btn btn-ghost" onClick={()=> (document.getElementById('add_event') as HTMLDialogElement).close()}>Annuler</button>
              <button type="submit" className="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
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
