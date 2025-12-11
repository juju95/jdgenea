import type { Person } from '../../types/person'

export interface ChartProps {
    persons: Person[]
    rootId: string
    onSelect: (id: string) => void
    width?: number
    height?: number
    livingThreshold?: number
}

// Helper to build hierarchy
export interface HierarchyNode extends Partial<Person> {
    children?: HierarchyNode[]
    generation?: number
    isEmpty?: boolean
}

export function buildAncestorHierarchy(persons: Person[], rootId: string | undefined | null, depth: number = 0, maxDepth: number = 6): HierarchyNode {
    if (depth > maxDepth) return { isEmpty: true, generation: depth }
    
    const person = rootId ? persons.find(p => p.id === rootId) : null
    
    if (!person) {
        // Return a placeholder node to maintain the structure (fan chart needs balanced tree for equal arcs)
        // But if we return just one empty node, d3 might expand it. 
        // For a fan chart, we usually want to stop if no person, BUT if we want to show gaps, we need structure.
        // D3 partition with .sum() will distribute space.
        // If we want equal distribution per generation, we need to fill the tree.
        return { isEmpty: true, generation: depth, children: [
            buildAncestorHierarchy(persons, null, depth + 1, maxDepth), // Father slot
            buildAncestorHierarchy(persons, null, depth + 1, maxDepth)  // Mother slot
        ]}
    }

    const node: HierarchyNode = { ...person, children: [], generation: depth, isEmpty: false }
    
    // Always add 2 children: Father then Mother
    node.children = [
        buildAncestorHierarchy(persons, person.fatherId, depth + 1, maxDepth),
        buildAncestorHierarchy(persons, person.motherId, depth + 1, maxDepth)
    ]
    
    return node
}

export function buildDescendantHierarchy(persons: Person[], rootId: string, depth: number = 0, maxDepth: number = 6): HierarchyNode | null {
    if (depth > maxDepth) return null
    const person = persons.find(p => p.id === rootId)
    if (!person) return null

    const node: HierarchyNode = { ...person, children: [], generation: depth, isEmpty: false }
    
    // Find children
    const children = persons.filter(p => p.fatherId === rootId || p.motherId === rootId)
    
    // Sort by birth date
    children.sort((a, b) => (a.birthDate || '9999').localeCompare(b.birthDate || '9999'))
    
    if (children.length > 0) {
        node.children = children.map(child => buildDescendantHierarchy(persons, child.id, depth + 1, maxDepth)).filter((n): n is HierarchyNode => n !== null)
    }
    
    return node
}

export function getMaxAncestorDepth(persons: Person[], rootId: string): number {
    const person = persons.find(p => p.id === rootId)
    if (!person) return 0
    
    let max = 0
    if (person.fatherId) max = Math.max(max, 1 + getMaxAncestorDepth(persons, person.fatherId))
    if (person.motherId) max = Math.max(max, 1 + getMaxAncestorDepth(persons, person.motherId))
    
    return max
}
