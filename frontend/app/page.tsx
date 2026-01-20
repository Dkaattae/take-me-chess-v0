"use client"

import { GameProvider, useGame } from '@/lib/chess/game-context'
import { MenuScreen } from '@/components/game/menu-screen'
import { SetupScreen } from '@/components/game/setup-screen'
import { GameScreen } from '@/components/game/game-screen'
import { LeaderboardScreen } from '@/components/game/leaderboard-screen'

function GameRouter() {
  const { currentScreen } = useGame()
  
  switch (currentScreen) {
    case 'menu':
      return <MenuScreen />
    case 'setup':
      return <SetupScreen />
    case 'game':
      return <GameScreen />
    case 'leaderboard':
      return <LeaderboardScreen />
    default:
      return <MenuScreen />
  }
}

export default function TakeMeChessPage() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  )
}
