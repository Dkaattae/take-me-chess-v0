"use client"

import { useGame } from '@/lib/chess/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Megaphone, X, Check, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TakeMeControls() {
  const { gameState, declareTakeMe, cancelTakeMe, confirmTakeMe, movePiece, declareMove, setPendingMove } = useGame()

  if (!gameState || gameState.status !== 'active') return null

  const { selectedPiece, takeMeState, currentTurn, players } = gameState
  const currentPlayer = players.find(p => p.color === currentTurn)

  // Don't show controls for bot players
  if (currentPlayer?.isBot) return null

  // If opponent declared Take Me!, show warning AT TOP (bot side)
  if (takeMeState.mustCapture && takeMeState.declarer !== currentTurn) {
    return (
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-auto pointer-events-auto z-50">
        <Card className="border-2 border-destructive bg-destructive text-white shadow-lg animate-bounce">
          <CardContent className="p-1 px-3 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-tight">Opponent says: Take Me!</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show backend message (e.g., "take who??")
  if (gameState.message) {
    return (
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-auto pointer-events-auto z-50">
        <Card className="border-2 border-accent bg-accent text-accent-foreground shadow-lg animate-in fade-in zoom-in duration-300">
          <CardContent className="p-1 px-3 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-tight">{gameState.message}</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If Take Me! is being declared (confirmation step) AT BOTTOM (player side)
  if (takeMeState.declared && takeMeState.declarer === currentTurn) {
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-auto pointer-events-auto z-50">
        <Card className="border-2 border-accent bg-accent text-accent-foreground shadow-2xl">
          <CardContent className="p-1 px-2 flex items-center gap-2">
            <Megaphone className="w-3 h-3" />
            <span className="text-[10px] font-bold">Confirm Take Me?</span>
            <div className="flex gap-1 ml-2">
              <Button
                variant="outline"
                size="icon"
                onClick={cancelTakeMe}
                className="h-6 w-6 rounded-md bg-background/20 border-white/20 hover:bg-destructive"
              >
                <X className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                onClick={confirmTakeMe}
                className="h-6 w-6 rounded-md bg-white text-accent hover:bg-green-500 hover:text-white"
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show move options when a move is pending
  if (gameState.pendingMove) {
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-40">
        <div className="flex gap-2">
          <Button
            onClick={() => {
              movePiece(gameState.pendingMove!.to)
              setPendingMove(null)
            }}
            size="sm"
            className="h-8 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            Move
          </Button>
          <Button
            onClick={() => {
              declareMove()
            }}
            size="sm"
            className={cn(
              "h-8 px-4 text-xs font-bold",
              "bg-accent hover:bg-accent/90 text-accent-foreground",
              "shadow-lg hover:shadow-xl transition-all"
            )}
          >
            <Megaphone className="w-3 h-3 mr-1" />
            Take Me!
          </Button>
        </div>
      </div>
    )
  }

  // Show "Take Me!" button when a piece is selected
  if (selectedPiece && (gameState.legalMoves?.length || 0) > 0) {
    return (
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 z-40">
        <Button
          onClick={declareTakeMe}
          size="sm"
          className={cn(
            "h-8 px-4 text-xs font-bold",
            "bg-accent hover:bg-accent/90 text-accent-foreground",
            "shadow-lg hover:shadow-xl transition-all",
            "animate-in fade-in slide-in-from-bottom-2 duration-200"
          )}
        >
          <Megaphone className="w-3 h-3 mr-1" />
          Take Me!
        </Button>
      </div>
    )
  }

  return null
}
