"use client"

import { useGame } from '@/lib/chess/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function GameOverModal() {
  const { gameState, resetGame, startGame } = useGame()
  
  if (!gameState) return null
  
  const isWin = gameState.status === 'win'
  const isDraw = gameState.status === 'draw'
  
  if (!isWin && !isDraw) return null
  
  return (
    <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className={cn(
        "w-full max-w-md border-4 animate-in zoom-in-95 duration-300",
        isWin ? "border-primary" : "border-muted"
      )}>
        <CardHeader className="text-center space-y-4 pb-2">
          <div className={cn(
            "w-20 h-20 mx-auto rounded-full flex items-center justify-center",
            isWin ? "bg-primary" : "bg-muted"
          )}>
            {isWin ? (
              <Trophy className="w-10 h-10 text-primary-foreground" />
            ) : (
              <Medal className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          <div>
            <CardTitle className="text-3xl">
              {isWin ? 'Victory!' : 'Draw!'}
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {isWin ? (
                <>
                  <span className="font-bold text-primary">{gameState.winner?.name}</span> wins by losing all their pieces!
                </>
              ) : (
                'The game ended in a stalemate!'
              )}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-4">
          {/* Game stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{gameState.moveHistory.length}</p>
              <p className="text-sm text-muted-foreground">Total Moves</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {gameState.pieceCount.white + gameState.pieceCount.black}
              </p>
              <p className="text-sm text-muted-foreground">Pieces Left</p>
            </div>
          </div>
          
          {/* Final piece counts */}
          <div className="flex justify-around">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--piece-white)] border border-border" />
              <span className="font-medium">{gameState.pieceCount.white} pieces</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--piece-black)] border border-border" />
              <span className="font-medium">{gameState.pieceCount.black} pieces</span>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={resetGame}
              className="flex-1 bg-transparent"
            >
              <Home className="w-4 h-4 mr-2" />
              Menu
            </Button>
            <Button 
              onClick={startGame}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Play Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
