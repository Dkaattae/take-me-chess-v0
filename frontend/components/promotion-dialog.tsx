import React from 'react'
import { PieceType } from '@/lib/chess/types'

interface PromotionDialogProps {
    isOpen: boolean
    onSelect: (pieceType: PieceType) => void
    color: 'white' | 'black'
}

const PIECE_OPTIONS: { type: PieceType; label: string; symbol: string }[] = [
    { type: 'queen', label: 'Queen', symbol: '♕' },
    { type: 'rook', label: 'Rook', symbol: '♖' },
    { type: 'bishop', label: 'Bishop', symbol: '♗' },
    { type: 'knight', label: 'Knight', symbol: '♘' },
    { type: 'king', label: 'King', symbol: '♔' },
    { type: 'pawn', label: 'Pawn', symbol: '♙' },
]

export function PromotionDialog({ isOpen, onSelect, color }: PromotionDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    Pawn Promotion
                </h2>
                <p className="text-slate-400 text-center mb-6">
                    Choose which piece your pawn becomes
                </p>

                <div className="grid grid-cols-3 gap-4">
                    {PIECE_OPTIONS.map(({ type, label, symbol }) => (
                        <button
                            key={type}
                            onClick={() => onSelect(type)}
                            className="group relative bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600 hover:border-amber-500 rounded-xl p-6 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20"
                        >
                            <div className="text-center">
                                <div
                                    className={`text-6xl mb-2 transition-transform group-hover:scale-110 ${color === 'white' ? 'text-white' : 'text-slate-900'
                                        }`}
                                    style={{
                                        filter: color === 'black' ? 'drop-shadow(0 0 2px rgba(255,255,255,0.3))' : 'none'
                                    }}
                                >
                                    {symbol}
                                </div>
                                <div className="text-sm font-medium text-slate-300 group-hover:text-amber-400">
                                    {label}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="mt-6 text-center text-xs text-slate-500">
                    Click on a piece to promote
                </div>
            </div>
        </div>
    )
}
