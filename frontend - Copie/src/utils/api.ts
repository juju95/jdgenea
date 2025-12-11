const BASE_URL = 'http://localhost:8081'

export async function fetchPersons(treeId?: string) {
  const u = new URL(BASE_URL + '/api/persons')
  if (treeId) u.searchParams.set('treeId', treeId)
  const r = await fetch(u.toString(), { credentials: 'include' })
  if (!r.ok) throw new Error('Erreur API persons')
  return r.json()
}

export async function fetchPerson(id: string) {
  const r = await fetch(BASE_URL + '/api/persons/' + id, { credentials: 'include' })
  if (!r.ok) throw new Error('Erreur API person')
  return r.json()
}

export async function fetchTrees() {
  const r = await fetch(BASE_URL + '/api/trees', { credentials: 'include' })
  if (!r.ok) throw new Error('Erreur API trees')
  return r.json()
}

export async function fetchTree(id: string) {
  const r = await fetch(BASE_URL + '/api/trees/' + id, { credentials: 'include' })
  if (!r.ok) throw new Error('Erreur API tree')
  return r.json()
}
