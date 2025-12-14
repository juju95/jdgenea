export interface Person {
  id: string
  treeId: string
  firstName: string
  middleName?: string
  lastName: string
  maidenName?: string
  gender?: string
  fatherId?: string | null
  motherId?: string | null
  birthDate?: string
  birthDateOriginal?: string
  birthTime?: string
  birthPlace?: string
  birthLatitude?: string
  birthLongitude?: string
  baptismDate?: string
  baptismDateOriginal?: string
  baptismTime?: string
  baptismPlace?: string
  baptismLatitude?: string
  baptismLongitude?: string
  deathDate?: string
  deathDateOriginal?: string
  deathTime?: string
  deathPlace?: string
  deathLatitude?: string
  deathLongitude?: string
  occupation?: string
  isLiving?: boolean
  notes?: string
  biography?: string
  posX?: number
  posY?: number
  gedcomId?: string
  sosa?: string
  mediaCount?: number
  status?: 'complete' | 'partial' | 'incomplete'
}

export interface Family {
  id: string
  treeId: string
  husbandId?: string | null
  wifeId?: string | null
  marriageDate?: string
}