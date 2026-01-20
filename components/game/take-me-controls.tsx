"use client"

import { useGame } from '@/lib/chess/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Megaphone, X, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TakeMeControls() {
  const { gameState, declareTakeMe, cancelTakeMe, confirmTakeMe } = useGame()
  
  if (!gameState || gameState.status !== 'active') return null
  
  const { selectedPiece, takeMeState, currentTurn, players } = gameState
  const currentPlayer = players.find(p => p.color === currentTurn)
  
  // Don't show controls for bot players
  if (currentPlayer?.isBot) return null
  
  // If opponent declared Take Me!, show warning
  if (takeMeState.mustCapture && takeMeState.declarer !== currentTurn) {
    return (
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-full max-w-[280px]">
        <Card className="border-2 border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Take Me! Declared</p>
                <p className="text-sm text-muted-foreground">You must capture a highlighted piece!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // If Take Me! is being declared (confirmation step)
  if (takeMeState.declared && takeMeState.declarer === currentTurn) {
    return (
      <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-full max-w-[280px]">
        <Card className="border-2 border-accent bg-accent/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center animate-pulse">
                <Megaphone className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="font-bold text-foreground">Confirm Take Me!</p>
                <p className="text-sm text-muted-foreground">Your opponent must capture you!</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={cancelTakeMe}
                className="flex-1 bg-transparent"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={confirmTakeMe}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Show "Take Me!" button when a piece is selected
  if (selectedPiece && gameState.legalMoves.length > 0) {
    return (
      <div className="absolute -top-16 left-1/2 -translate-x-1/2">
        <Button 
          onClick={declareTakeMe}
          size="lg"
          className={cn(
            "h-12 px-6 text-lg font-bold",
            "bg-accent hover:bg-accent/90 text-accent-foreground",
            "shadow-lg hover:shadow-xl transition-all",
            "animate-in fade-in slide-in-from-bottom-2 duration-200"
          )}
        >
          <Megaphone className="w-5 h-5 mr-2" />
          Take Me!
        </Button>
      </div>
    )
  }
  
  return null
}
