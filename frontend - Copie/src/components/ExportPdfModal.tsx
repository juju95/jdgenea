import React, { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onExport: (config: { format: 'a4' | 'a3', orientation: 'portrait' | 'landscape', scale: number }) => void
  isProcessing: boolean
}

export function ExportPdfModal({ isOpen, onClose, onExport, isProcessing }: Props) {
  const [format, setFormat] = useState<'a4' | 'a3'>('a4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape')
  const [scale, setScale] = useState(1)

  if (!isOpen) return null

  return (
    <dialog open className="modal modal-open bg-black/50 fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-96 max-w-full">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Exporter en PDF</h3>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 rounded border ${format === 'a4' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200'}`}
                onClick={() => setFormat('a4')}
              >
                A4
              </button>
              <button 
                className={`flex-1 py-2 rounded border ${format === 'a3' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200'}`}
                onClick={() => setFormat('a3')}
              >
                A3
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Orientation</label>
            <div className="flex gap-2">
              <button 
                className={`flex-1 py-2 rounded border ${orientation === 'portrait' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200'}`}
                onClick={() => setOrientation('portrait')}
              >
                Portrait
              </button>
              <button 
                className={`flex-1 py-2 rounded border ${orientation === 'landscape' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200'}`}
                onClick={() => setOrientation('landscape')}
              >
                Paysage
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Échelle (Qualité)</label>
            <select 
                className="w-full px-3 py-2 rounded border border-slate-200"
                value={scale}
                onChange={e => setScale(parseFloat(e.target.value))}
            >
                <option value={0.5}>50% (Compact)</option>
                <option value={0.75}>75%</option>
                <option value={1}>100% (Taille réelle)</option>
                <option value={1.5}>150% (Haute qualité)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
                Une échelle plus grande augmentera la lisibilité mais générera plus de pages.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button 
            className="px-4 py-2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            onClick={onClose}
            disabled={isProcessing}
          >
            Annuler
          </button>
          <button 
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            onClick={() => onExport({ format, orientation, scale })}
            disabled={isProcessing}
          >
            {isProcessing ? 'Génération...' : 'Générer PDF'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
