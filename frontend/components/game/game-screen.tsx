"use client"

import { useGame } from '@/lib/chess/game-context'
import { ChessBoard } from './chess-board'
import { PlayerPanel } from './player-panel'
import { TakeMeControls } from './take-me-controls'
import { GameOverModal } from './game-over-modal'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Home } from 'lucide-react'

export function GameScreen() {
  const { gameState, isMuted, toggleMute, resetGame } = useGame()
  
  if (!gameState) return null
  
  const whitePlayer = gameState.players.find(p => p.color === 'white')!
  const blackPlayer = gameState.players.find(p => p.color === 'black')!
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={resetGame}>
          <Home className="w-4 h-4 mr-2" />
          Menu
        </Button>
        
        <h1 className="text-lg font-bold text-foreground">Take-Me Chess</h1>
        
        <Button variant="ghost" size="icon" onClick={toggleMute}>
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </header>
      
      {/* Main game area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {/* Top player (Black) */}
        <PlayerPanel 
          player={blackPlayer} 
          pieceCount={gameState.pieceCount.black}
          isCurrentTurn={gameState.currentTurn === 'black'}
          isTop
        />
        
        {/* Chess board */}
        <div className="relative">
          <ChessBoard />
          
          {/* Take Me! controls */}
          <TakeMeControls />
        </div>
        
        {/* Bottom player (White) */}
        <PlayerPanel 
          player={whitePlayer} 
          pieceCount={gameState.pieceCount.white}
          isCurrentTurn={gameState.currentTurn === 'white'}
        />
        
        {/* Game status indicator */}
        {gameState.takeMeState.mustCapture && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-6 py-3 rounded-full shadow-lg animate-bounce">
            <span className="font-bold">You must capture a piece!</span>
          </div>
        )}
      </main>
      
      {/* Game over modal */}
      {(gameState.status === 'win' || gameState.status === 'draw') && (
        <GameOverModal />
      )}
    </div>
  )
}
