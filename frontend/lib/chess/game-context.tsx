"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  GameState, Player, GameMode, PieceColor, Square, Move,
  TakeMeState, LeaderboardEntry
} from './types'
import { gameApi, handleApiError, type ApiGameState, type ApiLeaderboardEntry } from '../api/client'
import { getBotMove, generateBotName, generateBotAvatar } from './bot'

type GameScreen = 'menu' | 'setup' | 'game' | 'leaderboard'

interface GameContextType {
  // Screen navigation
  currentScreen: GameScreen
  setCurrentScreen: (screen: GameScreen) => void

  // Game mode and setup
  gameMode: GameMode | null
  setGameMode: (mode: GameMode) => void

  // Players
  players: Player[]
  setPlayerName: (index: number, name: string) => void

  // Game state
  gameState: GameState | null
  isLoading: boolean
  error: string | null

  // Actions
  startGame: () => Promise<void>
  selectPiece: (square: Square) => Promise<void>
  movePiece: (to: Square) => Promise<void>
  declareTakeMe: () => void
  cancelTakeMe: () => void
  confirmTakeMe: () => Promise<void>
  declareMove: () => void
  setPendingMove: (move: { from: Square; to: Square } | null) => void
  resetGame: () => void
  endGame: () => Promise<void>

  // Leaderboard
  leaderboard: LeaderboardEntry[]
  loadLeaderboard: (gameMode?: GameMode) => Promise<void>

  // Audio
  isMuted: boolean
  toggleMute: () => void
  playSound: (sound: 'move' | 'capture' | 'takeme') => void
}

const GameContext = createContext<GameContextType | null>(null)

// Convert API types to frontend types
const convertApiGameState = (apiState: ApiGameState): GameState => ({
  id: apiState.id,
  board: apiState.board,
  currentTurn: apiState.currentTurn,
  players: apiState.players.map(player => ({
    id: player.id,
    name: player.name,
    color: player.color,
    isBot: player.isBot,
    avatar: player.avatar
  })),
  status: apiState.status,
  winner: apiState.winner ? {
    id: apiState.winner.id,
    name: apiState.winner.name,
    color: apiState.winner.color,
    isBot: apiState.winner.isBot,
    avatar: apiState.winner.avatar
  } : null,
  selectedPiece: apiState.selectedPiece || null,
  legalMoves: apiState.legalMoves || [],
  takeMeState: {
    declared: apiState.takeMeState.declared,
    declarer: apiState.takeMeState.declarer || null,
    exposedPieces: apiState.takeMeState.exposedPieces,
    capturablePieces: apiState.takeMeState.capturablePieces,
    mustCapture: apiState.takeMeState.mustCapture
  },
  moveHistory: apiState.moveHistory,
  pieceCount: apiState.pieceCount,
  pendingMove: null,
  createdAt: apiState.createdAt,
  updatedAt: apiState.updatedAt
})

const convertApiLeaderboard = (apiLeaderboard: ApiLeaderboardEntry[]): LeaderboardEntry[] => {
  return apiLeaderboard.map(entry => ({
    playerName: entry.playerName,
    wins: entry.wins,
    losses: entry.losses,
    draws: entry.draws,
    gameMode: entry.gameMode,
    lastPlayed: entry.lastPlayed
  }))
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu')
  const [gameMode, setGameModeState] = useState<GameMode | null>(null)
  const [players, setPlayers] = useState<Player[]>([
    { name: '', color: 'white', isBot: false },
    { name: '', color: 'black', isBot: false }
  ])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode)
    if (mode === '1P') {
      // Auto-generate bot player
      setPlayers([
        { name: '', color: 'white', isBot: false },
        { name: generateBotName(), color: 'black', isBot: true, avatar: generateBotAvatar() }
      ])
    } else {
      setPlayers([
        { name: '', color: 'white', isBot: false },
        { name: '', color: 'black', isBot: false }
      ])
    }
    setCurrentScreen('setup')
  }, [])

  const setPlayerName = useCallback((index: number, name: string) => {
    setPlayers(prev => {
      const newPlayers = [...prev]
      newPlayers[index] = { ...newPlayers[index], name }
      return newPlayers
    })
  }, [])

  const startGame = useCallback(async () => {
    if (!gameMode) return

    setIsLoading(true)
    setError(null)

    try {
      const apiPlayers = players.map(player => ({
        name: player.name,
        is_bot: player.isBot
      }))

      const apiGameState = await gameApi.createGame({
        game_mode: gameMode,
        players: apiPlayers
      })

      const frontendGameState = convertApiGameState(apiGameState)
      setGameState(frontendGameState)
      setCurrentScreen('game')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameMode, players])

  const selectPiece = useCallback(async (square: Square) => {
    if (!gameState || gameState.status !== 'active' || !gameState.id) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await gameApi.getLegalMoves(gameState.id, square.row, square.col)

      setGameState(prev => prev ? {
        ...prev,
        selectedPiece: square,
        legalMoves: response.legalMoves,
        pendingMove: null
      } : null)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameState])

  const movePiece = useCallback(async (to: Square) => {
    if (!gameState || !gameState.selectedPiece || !gameState.id) return

    setIsLoading(true)
    setError(null)

    try {
      const moveRequest = {
        from: gameState.selectedPiece,
        to
      }

      const apiGameState = await gameApi.makeMove(gameState.id, moveRequest)
      const frontendGameState = convertApiGameState(apiGameState)

      setGameState(frontendGameState)

      // Check if it's bot's turn and handle bot move
      if (frontendGameState.status === 'active' && frontendGameState.players.find(p => p.color === frontendGameState.currentTurn)?.isBot) {
        // Bot's turn - get bot move
        try {
          const botResponse = await gameApi.getBotMove(frontendGameState.id!)
          const updatedGameState = convertApiGameState(botResponse.gameState)
          setGameState(updatedGameState)
        } catch (botErr) {
          const apiError = handleApiError(botErr)
          setError(`Bot move failed: ${apiError.error}`)
        }
      }

      playSound('move')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameState])

  const declareTakeMe = useCallback(() => {
    // This would be implemented for Take Me! declarations
    // For now, just a placeholder
  }, [])

  const cancelTakeMe = useCallback(() => {
    // This would be implemented for Take Me! cancellations
    // For now, just a placeholder
  }, [])

  const confirmTakeMe = useCallback(async () => {
    // This would be implemented for Take Me! confirmations
    // For now, just a placeholder
  }, [])

  const declareMove = useCallback(() => {
    // This would be implemented for move declarations
    // For now, just a placeholder
  }, [])

  const setPendingMove = useCallback((move: { from: Square; to: Square } | null) => {
    setGameState(prev => prev ? { ...prev, pendingMove: move } : null)
  }, [])

  const resetGame = useCallback(() => {
    setGameState(null)
    setCurrentScreen('menu')
    setGameModeState(null)
    setError(null)
  }, [])

  const endGame = useCallback(async () => {
    if (!gameState?.id) return

    setIsLoading(true)
    try {
      await gameApi.endGame(gameState.id)
      setGameState(null)
      setCurrentScreen('menu')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameState])

  const loadLeaderboard = useCallback(async (gameMode?: GameMode) => {
    setIsLoading(true)
    try {
      const response = await gameApi.getLeaderboard(gameMode)
      const frontendLeaderboard = convertApiLeaderboard(response.leaderboard)
      setLeaderboard(frontendLeaderboard)
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const playSound = useCallback((sound: 'move' | 'capture' | 'takeme') => {
    if (isMuted) return
    // Sound effects would be played here
    // Using Web Audio API or audio elements
  }, [isMuted])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  const value: GameContextType = {
    currentScreen,
    setCurrentScreen,
    gameMode,
    setGameMode,
    players,
    setPlayerName,
    gameState,
    isLoading,
    error,
    startGame,
    selectPiece,
    movePiece,
    declareTakeMe,
    cancelTakeMe,
    confirmTakeMe,
    declareMove,
    setPendingMove,
    resetGame,
    endGame,
    leaderboard,
    loadLeaderboard,
    isMuted,
    toggleMute,
    playSound
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
