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
    <dialog className="modal modal-open">
      <div className="modal-box overflow-x-hidden">
        <h3 className="text-lg font-bold mb-4 whitespace-normal break-words">Exporter en PDF</h3>
        
        <div className="grid gap-4">
          <div>
            <label className="label">
              <span className="label-text">Format</span>
            </label>
            <div className="join w-full">
              <button 
                className={`join-item btn flex-1 ${format === 'a4' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFormat('a4')}
              >
                A4
              </button>
              <button 
                className={`join-item btn flex-1 ${format === 'a3' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFormat('a3')}
              >
                A3
              </button>
            </div>
          </div>

          <div>
            <label className="label">
              <span className="label-text">Orientation</span>
            </label>
            <div className="join w-full">
              <button 
                className={`join-item btn flex-1 ${orientation === 'portrait' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOrientation('portrait')}
              >
                Portrait
              </button>
              <button 
                className={`join-item btn flex-1 ${orientation === 'landscape' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOrientation('landscape')}
              >
                Paysage
              </button>
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Échelle (Qualité)</span>
            </label>
            <select 
                className="select select-bordered w-full"
                value={scale}
                onChange={e => setScale(parseFloat(e.target.value))}
            >
                <option value={0.5}>50% (Compact)</option>
                <option value={0.75}>75%</option>
                <option value={1}>100% (Taille réelle)</option>
                <option value={1.5}>150% (Haute qualité)</option>
            </select>
            <label className="label max-w-full">
              <span className="label-text-alt text-base-content/70 whitespace-normal break-words">
                Une échelle plus grande augmentera la lisibilité mais générera plus de pages.
              </span>
            </label>
          </div>
        </div>

        <div className="modal-action">
          <button 
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isProcessing}
          >
            Annuler
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => onExport({ format, orientation, scale })}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading loading-spinner"></span>
                Génération...
              </>
            ) : 'Générer PDF'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
