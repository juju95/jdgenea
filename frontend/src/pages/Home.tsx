import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 border border-slate-200">
        <div className="max-w-3xl mx-auto text-center py-16 px-6">
          <h1 className="text-5xl font-bold text-slate-800">JdGenea</h1>
          <p className="mt-4 text-slate-600">Outil de généalogie pastel, moderne et compatible GEDCOM.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/register" className="px-6 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700">Créer un compte</Link>
            <Link to="/login" className="px-6 py-3 rounded-full bg-emerald-500 text-white hover:bg-emerald-600">Se connecter</Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Fonctionnalités clés</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800">Éditeur d’arbre</h3>
            <p className="mt-2 text-slate-600">Créez et reliez vos ancêtres avec une interface fluide.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800">GEDCOM Import/Export</h3>
            <p className="mt-2 text-slate-600">Importez et exportez vos données selon le standard GEDCOM.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-slate-800">Médias & Sources</h3>
            <p className="mt-2 text-slate-600">Ajoutez photos, documents et références sourcées.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
