import type { Person, Family } from '../types/person'

export interface FamilyNode {
  id: string
  gender: 'male' | 'female'
  parents: { type: 'blood', id: string }[]
  children: { type: 'blood', id: string }[]
  siblings: { type: 'blood', id: string }[]
  spouses: { type: 'married', id: string }[]
  data: Person
}

export function toFamilyTreeNodes(persons: Person[], families: Family[]): FamilyNode[] {
  return persons.map(p => {
    // 1. Find parents
    const parents: { type: 'blood', id: string }[] = []
    if (p.fatherId) parents.push({ type: 'blood', id: p.fatherId })
    if (p.motherId) parents.push({ type: 'blood', id: p.motherId })

    // 2. Find children
    const children = persons
      .filter(c => c.fatherId === p.id || c.motherId === p.id)
      .map(c => ({ type: 'blood' as const, id: c.id }))

    // 3. Find spouses
    const spouses: { type: 'married', id: string }[] = []
    families.forEach(f => {
      // Check if husband/wife exists in persons list to avoid broken links
      if (f.husbandId === p.id && f.wifeId && persons.some(x=>x.id===f.wifeId)) {
        spouses.push({ type: 'married', id: f.wifeId })
      }
      if (f.wifeId === p.id && f.husbandId && persons.some(x=>x.id===f.husbandId)) {
        spouses.push({ type: 'married', id: f.husbandId })
      }
    })

    // 4. Find siblings (share at least one parent)
    const siblings = persons
      .filter(s => s.id !== p.id && (
        (s.fatherId && p.fatherId && s.fatherId === p.fatherId) || 
        (s.motherId && p.motherId && s.motherId === p.motherId)
      ))
      .map(s => ({ type: 'blood' as const, id: s.id }))

    return {
      id: p.id,
      gender: p.gender === 'F' ? 'female' : 'male',
      parents,
      children,
      siblings,
      spouses,
      data: p
    }
  })
}
