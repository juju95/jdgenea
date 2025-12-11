import { Link } from 'react-router-dom'

export function Home() {
  return (
    <div className="space-y-10">
      <div className="hero min-h-[50vh] bg-base-200 rounded-box">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold font-display text-primary">JdGenea</h1>
            <p className="py-6">Outil de généalogie pastel, moderne et compatible GEDCOM.</p>
            <div className="flex justify-center gap-4">
              <Link to="/register" className="btn btn-primary text-white">Créer un compte</Link>
              <Link to="/login" className="btn btn-outline btn-primary">Se connecter</Link>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-3xl font-bold text-base-content mb-6 text-center">Fonctionnalités clés</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-primary">Éditeur d’arbre</h3>
              <p>Créez et reliez vos ancêtres avec une interface fluide.</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-primary">GEDCOM Import/Export</h3>
              <p>Importez et exportez vos données selon le standard GEDCOM.</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-primary">Médias & Sources</h3>
              <p>Ajoutez photos, documents et références sourcées.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
