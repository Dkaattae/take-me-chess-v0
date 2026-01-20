"use client"

import { useGame } from '@/lib/chess/game-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, User, Users, Trophy, Volume2, VolumeX } from 'lucide-react'

export function MenuScreen() {
  const { setGameMode, setCurrentScreen, isMuted, toggleMute } = useGame()
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
      </div>
      
      {/* Audio toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMute}
        className="absolute top-4 right-4 z-10"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </Button>
      
      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Logo and title */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Crown className="w-14 h-14 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-md transform -rotate-6">
                <span className="text-accent-foreground font-bold text-sm">!</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Take-Me Chess
            </h1>
            <p className="text-lg text-muted-foreground">
              The backwards chess game for kids!
            </p>
          </div>
        </div>
        
        {/* Game rules hint */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="pt-4 pb-4">
            <p className="text-center text-sm text-muted-foreground">
              <strong className="text-foreground">Goal:</strong> Be the first to lose all your pieces!
              <br />
              <span className="text-xs">Say &quot;Take Me!&quot; to make your opponent capture you.</span>
            </p>
          </CardContent>
        </Card>
        
        {/* Game mode buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => setGameMode('1P')}
            className="w-full h-16 text-lg font-semibold justify-start px-6 gap-4"
            size="lg"
          >
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div>One Player</div>
              <div className="text-xs font-normal opacity-80">Play against a friendly bot</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setGameMode('2P')}
            variant="secondary"
            className="w-full h-16 text-lg font-semibold justify-start px-6 gap-4"
            size="lg"
          >
            <div className="w-10 h-10 rounded-full bg-secondary-foreground/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div>Two Players</div>
              <div className="text-xs font-normal opacity-80">Play with a friend</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setCurrentScreen('leaderboard')}
            variant="outline"
            className="w-full h-14 text-lg font-semibold gap-3"
            size="lg"
          >
            <Trophy className="w-5 h-5" />
            Leaderboard
          </Button>
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          A fun way to learn chess moves!
        </p>
      </div>
    </div>
  )
}
