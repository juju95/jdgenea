import type { Person } from '../types/person'

export function computeIsLiving(person: Person, livingThreshold: number = 100): boolean {
    // If explicitly marked as dead, respect it
    if (person.isLiving === false) return false

    // If has death details, they are dead
    if (person.deathDate || person.deathPlace) return false

    // Check age threshold
    const currentYear = new Date().getFullYear()
    
    if (person.birthDate) {
        const birthYear = parseInt(person.birthDate.substring(0, 4))
        if (!isNaN(birthYear) && (currentYear - birthYear > livingThreshold)) {
            return false
        }
    }

    // Check marriages (if available in data, though FamilyNode usually has limited data)
    // Note: Person type in FamilyNode might not have marriages populated depending on API
    // but if it's the full Person object, it might not have the array unless expanded.
    // In TreeEditor, we load full persons list, but marriages are in a separate list.
    // The Person object in FamilyNode.data comes from that list.
    // The list endpoint returns flattened Person objects. It does NOT include marriages array.
    // So we can only rely on birthDate here.
    
    return true
}
