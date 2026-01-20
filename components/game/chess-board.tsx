"use client"

import { useGame } from '@/lib/chess/game-context'
import { ChessPiece } from './chess-pieces'
import { cn } from '@/lib/utils'

export function ChessBoard() {
  const { gameState, selectPiece, movePiece } = useGame()
  
  if (!gameState) return null
  
  const { board, selectedPiece, legalMoves, takeMeState, currentTurn } = gameState
  
  const handleSquareClick = (row: number, col: number) => {
    const piece = board[row][col]
    
    // Check if clicking on a legal move destination
    const isLegalMove = legalMoves.some(m => m.row === row && m.col === col)
    if (isLegalMove && selectedPiece) {
      movePiece({ row, col })
      return
    }
    
    // Check if clicking on own piece to select it
    if (piece && piece.color === currentTurn) {
      selectPiece({ row, col })
    }
  }
  
  const isSquareSelected = (row: number, col: number) => {
    return selectedPiece?.row === row && selectedPiece?.col === col
  }
  
  const isLegalMoveSquare = (row: number, col: number) => {
    return legalMoves.some(m => m.row === row && m.col === col)
  }
  
  const isCapturableSquare = (row: number, col: number) => {
    return takeMeState.capturablePieces.some(p => p.row === row && p.col === col)
  }
  
  const isExposedSquare = (row: number, col: number) => {
    return takeMeState.exposedPieces.some(p => p.row === row && p.col === col)
  }
  
  return (
    <div className="relative">
      {/* Board container with shadow and rounded corners */}
      <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-foreground/20">
        <div className="grid grid-cols-8 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] md:w-[480px] md:h-[480px]">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0
              const isSelected = isSquareSelected(rowIndex, colIndex)
              const isLegal = isLegalMoveSquare(rowIndex, colIndex)
              const isCapturable = isCapturableSquare(rowIndex, colIndex)
              const isExposed = isExposedSquare(rowIndex, colIndex)
              const hasPiece = piece !== null
              
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  className={cn(
                    "relative flex items-center justify-center transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    isLight ? "bg-square-light" : "bg-square-dark",
                    isSelected && "ring-4 ring-inset ring-primary",
                    isLegal && !hasPiece && "after:absolute after:w-1/4 after:h-1/4 after:rounded-full after:bg-foreground/30",
                    isLegal && hasPiece && "ring-4 ring-inset ring-destructive",
                    isCapturable && "bg-square-danger animate-pulse",
                    isExposed && takeMeState.declared && "ring-4 ring-inset ring-takeme-glow",
                    "hover:brightness-95 active:brightness-90"
                  )}
                  aria-label={`Square ${String.fromCharCode(97 + colIndex)}${8 - rowIndex}${piece ? ` with ${piece.color} ${piece.type}` : ''}`}
                >
                  {piece && (
                    <div className={cn(
                      "transform transition-transform duration-200",
                      isSelected && "scale-110",
                      isCapturable && "animate-bounce"
                    )}>
                      <ChessPiece 
                        type={piece.type} 
                        color={piece.color}
                        size={36}
                      />
                    </div>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
      
      {/* File labels (a-h) */}
      <div className="flex justify-around mt-2 px-1">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
          <span key={file} className="text-xs font-medium text-muted-foreground w-[40px] sm:w-[50px] md:w-[60px] text-center">
            {file}
          </span>
        ))}
      </div>
      
      {/* Rank labels (1-8) */}
      <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-around -ml-5">
        {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
          <span key={rank} className="text-xs font-medium text-muted-foreground h-[40px] sm:h-[50px] md:h-[60px] flex items-center">
            {rank}
          </span>
        ))}
      </div>
    </div>
  )
}
