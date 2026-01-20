"use client"

import { useGame } from '@/lib/chess/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Medal, Award, User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LeaderboardScreen() {
  const { leaderboard, setCurrentScreen } = useGame()
  
  // Sort by wins descending
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const aScore = a.wins - a.losses
    const bScore = b.wins - b.losses
    return bScore - aScore
  })
  
  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="w-6 h-6 flex items-center justify-center text-muted-foreground font-bold">{index + 1}</span>
  }
  
  const getRankBg = (index: number) => {
    if (index === 0) return "bg-yellow-500/10 border-yellow-500/30"
    if (index === 1) return "bg-gray-400/10 border-gray-400/30"
    if (index === 2) return "bg-amber-600/10 border-amber-600/30"
    return "bg-muted/30 border-transparent"
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 border-b border-border">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentScreen('menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
      </header>
      
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Top Players
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No players yet!</p>
                <p className="text-sm">Play a game to appear on the leaderboard.</p>
              </div>
            ) : (
              sortedLeaderboard.map((entry, index) => (
                <div 
                  key={entry.playerName}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                    getRankBg(index)
                  )}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  
                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate">
                        {entry.playerName}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        entry.gameMode === '1P' 
                          ? "bg-accent/20 text-accent-foreground" 
                          : "bg-primary/20 text-primary"
                      )}>
                        {entry.gameMode === '1P' ? (
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3" /> vs Bot
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> 2P
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <span className="font-bold text-primary">{entry.wins}</span>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-destructive">{entry.losses}</span>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-muted-foreground">{entry.draws}</span>
                      <p className="text-xs text-muted-foreground">Draws</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        
        {/* Info card */}
        <Card className="mt-4 bg-muted/50 border-dashed">
          <CardContent className="pt-4 pb-4">
            <p className="text-center text-sm text-muted-foreground">
              Play games to climb the leaderboard! Your stats are saved locally.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
