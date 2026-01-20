"use client"

import { useGame } from '@/lib/chess/game-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Crown, Bot, User, Sparkles } from 'lucide-react'

export function SetupScreen() {
  const { 
    gameMode, 
    players, 
    setPlayerName, 
    startGame, 
    setCurrentScreen 
  } = useGame()
  
  const isValid = players.every((p, i) => {
    if (p.isBot) return true
    return p.name.trim().length > 0
  })
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => setCurrentScreen('menu')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-secondary" />
            <h1 className="text-3xl font-bold text-foreground">Player Setup</h1>
          </div>
          <p className="text-muted-foreground">
            {gameMode === '1P' ? 'Enter your name to play against the bot!' : 'Enter both player names to begin!'}
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Player 1 (White) */}
          <Card className="border-2 border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--piece-white)] border-2 border-border flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Player 1</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--piece-white)] border border-border" />
                    White Pieces
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter your name..."
                value={players[0].name}
                onChange={(e) => setPlayerName(0, e.target.value)}
                className="text-lg h-12"
                maxLength={20}
              />
            </CardContent>
          </Card>
          
          {/* Player 2 (Black) */}
          <Card className={`border-2 ${players[1].isBot ? 'border-accent/30 bg-accent/5' : 'border-primary/30'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--piece-black)] border-2 border-border flex items-center justify-center shadow-md">
                  {players[1].isBot ? (
                    <Bot className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <User className="w-6 h-6 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Player 2
                    {players[1].isBot && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">
                        Bot
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-[var(--piece-black)] border border-border" />
                    Black Pieces
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {players[1].isBot ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                  <span className="text-2xl">{players[1].avatar}</span>
                  <div>
                    <p className="font-medium text-foreground">{players[1].name}</p>
                    <p className="text-sm text-muted-foreground">Ready to play!</p>
                  </div>
                </div>
              ) : (
                <Input
                  placeholder="Enter player name..."
                  value={players[1].name}
                  onChange={(e) => setPlayerName(1, e.target.value)}
                  className="text-lg h-12"
                  maxLength={20}
                />
              )}
            </CardContent>
          </Card>
        </div>
        
        <Button 
          onClick={startGame}
          disabled={!isValid}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Game!
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
          Remember: In Take-Me Chess, you win by losing all your pieces!
        </p>
      </div>
    </div>
  )
}
