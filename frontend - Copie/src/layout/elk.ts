import ELK, { type ElkNode, type ElkPrimitiveEdge } from 'elkjs/lib/elk.bundled'

type Person = { id:string, firstName:string, lastName:string, gender?:string|null, fatherId?:string|null, motherId?:string|null }
type Family = { id:string, husbandId?:string|null, wifeId?:string|null }

export async function computeLayout(persons: Person[], families: Family[]) {
  console.log('Computing layout for', persons.length, 'persons and', families.length, 'families')
  try {
    const elk = new ELK()
    const nodes: ElkNode[] = persons.map(p=> ({ 
      id: p.id, 
      width: 220, 
      height: 80, 
      labels:[{ text: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Inconnu' }] 
    }))
    
    // Create marriage nodes (small dots)
    const marriageNodes: ElkNode[] = families.map(f=> ({ 
      id: `marriage-${f.id}`, 
      width: 20, 
      height: 20,
      properties: { 'elk.shape': 'round' } // Optional, depends on renderer but good for layout hints
    }))

    const edges: ElkPrimitiveEdge[] = []
    families.forEach(f=> {
      // Parents to marriage node
      if (f.husbandId && persons.find(p=>p.id===f.husbandId)) {
        edges.push({ id:`e-h-${f.id}`, sources:[f.husbandId], targets:[`marriage-${f.id}`] })
      }
      if (f.wifeId && persons.find(p=>p.id===f.wifeId)) {
        edges.push({ id:`e-w-${f.id}`, sources:[f.wifeId], targets:[`marriage-${f.id}`] })
      }
      
      // Marriage node to children
      const children = persons.filter(c=> c.fatherId===f.husbandId || c.motherId===f.wifeId)
      children.forEach(c=> {
        edges.push({ id:`e-c-${f.id}-${c.id}`, sources:[`marriage-${f.id}`], targets:[c.id] })
      })
    })

    const graph: ElkNode = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.layered.spacing.nodeNodeBetweenLayers': '80',
        'elk.spacing.nodeNode': '60',
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP'
      },
      children: [...nodes, ...marriageNodes],
      edges
    }

    const res = await elk.layout(graph)
    const pos: Record<string,{x:number,y:number}> = {}
    
    // Recenter logic could go here, but for now just return positions
    res.children?.forEach((n)=> { 
      if (!n.id.startsWith('marriage-')) {
        pos[n.id] = { x: Math.round(n.x || 0), y: Math.round(n.y || 0) } 
      }
    })
    console.log('Layout computed:', pos)
    return pos
  } catch (err) {
    console.error('ELK Layout Error:', err)
    return {}
  }
}

