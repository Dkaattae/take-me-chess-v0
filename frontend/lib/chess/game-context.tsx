"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type {
  GameState, Player, GameMode, PieceColor, Square, Move,
  TakeMeState, LeaderboardEntry, PieceType
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

  // Promotion
  promotionState: { isOpen: boolean; color: PieceColor | null; move: { from: Square; to: Square } | null; isTakeMe: boolean } | null
  selectPromotionPiece: (pieceType: PieceType) => Promise<void>

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
  currentTurn: apiState.current_turn,
  players: apiState.players.map(player => ({
    id: player.id,
    name: player.name,
    color: player.color,
    isBot: player.is_bot,
    avatar: player.avatar,
    score: player.score
  })),
  status: apiState.status,
  winner: apiState.winner ? {
    id: apiState.winner.id,
    name: apiState.winner.name,
    color: apiState.winner.color,
    isBot: apiState.winner.is_bot,
    avatar: apiState.winner.avatar,
    score: apiState.winner.score
  } : null,
  selectedPiece: apiState.selected_piece || null,
  legalMoves: apiState.legal_moves || [],
  takeMeState: {
    declared: apiState.take_me_state.declared,
    declarer: apiState.take_me_state.declarer || null,
    exposedPieces: apiState.take_me_state.exposed_pieces,
    capturablePieces: apiState.take_me_state.capturable_pieces,
    mustCapture: apiState.take_me_state.must_capture
  },
  moveHistory: apiState.move_history.map(move => ({
    from: move.from,
    to: move.to,
    piece: move.piece,
    capturedPiece: move.captured_piece,
    isPromotion: move.is_promotion,
    promotionPiece: move.promotion_piece
  })),
  pieceCount: apiState.piece_count,
  message: apiState.message,
  pendingMove: null,
  createdAt: apiState.created_at,
  updatedAt: apiState.updated_at
})

const convertApiLeaderboard = (apiLeaderboard: ApiLeaderboardEntry[]): LeaderboardEntry[] => {
  return apiLeaderboard.map(entry => ({
    playerName: entry.player_name,
    wins: entry.wins,
    losses: entry.losses,
    draws: entry.draws,
    score: entry.score,
    gameMode: entry.game_mode,
    lastPlayed: entry.last_played
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
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [promotionState, setPromotionState] = useState<{ isOpen: boolean; color: PieceColor | null; move: { from: Square; to: Square } | null; isTakeMe: boolean } | null>(null)

  // Audio helpers defined FIRST to avoid ReferenceError
  const playSound = useCallback((sound: 'move' | 'capture' | 'takeme') => {
    if (isMuted) return
    console.log(`Sound triggered: ${sound}`);
  }, [isMuted])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

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
      console.log('Game created successfully:', apiGameState);
      const frontendGameState = convertApiGameState(apiGameState)
      console.log('Converted frontend state:', frontendGameState);

      setGameState(frontendGameState)
      setCurrentScreen('game')
      console.log('Switched screen to: game');
    } catch (err) {
      console.error('Error in startGame:', err);
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
        legalMoves: response.legal_moves,
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

    // Check if this move would result in pawn promotion
    const piece = gameState.board[gameState.selectedPiece.row][gameState.selectedPiece.col]
    if (piece && piece.type === 'pawn') {
      const isWhitePromotion = piece.color === 'white' && to.row === 0
      const isBlackPromotion = piece.color === 'black' && to.row === 7

      if (isWhitePromotion || isBlackPromotion) {
        // Show promotion dialog
        setPromotionState({
          isOpen: true,
          color: piece.color,
          move: { from: gameState.selectedPiece, to },
          isTakeMe: false
        })
        return
      }
    }

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
      playSound('move')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameState, playSound])

  const declareTakeMe = useCallback(() => {
    if (!gameState?.selectedPiece) return
    setGameState(prev => prev ? {
      ...prev,
      takeMeState: {
        ...prev.takeMeState,
        declared: true,
        declarer: gameState.currentTurn
      }
    } : null)
  }, [gameState])

  const cancelTakeMe = useCallback(() => {
    setGameState(prev => prev ? {
      ...prev,
      takeMeState: {
        ...prev.takeMeState,
        declared: false,
        declarer: null
      }
    } : null)
  }, [])

  const confirmTakeMe = useCallback(async () => {
    if (!gameState || !gameState.selectedPiece || !gameState.id) return

    setIsLoading(true)
    setError(null)

    try {
      const request = {
        from: gameState.selectedPiece,
        to: gameState.pendingMove?.to || gameState.selectedPiece, // This shouldn't happen with current UI flow but for safety
      }

      // If no pending move, we might need a different UI flow or use the first legal move
      // But based on take-me-controls, we probably have a selected piece and want to move it
      const apiGameState = await gameApi.declareTakeMe(gameState.id, request)
      const frontendGameState = convertApiGameState(apiGameState)
      setGameState(frontendGameState)
      playSound('takeme')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameState, playSound])

  const declareMove = useCallback(async () => {
    if (!gameState?.pendingMove) return

    // Check if this move would result in pawn promotion
    const piece = gameState.board[gameState.pendingMove.from.row][gameState.pendingMove.from.col]
    if (piece && piece.type === 'pawn') {
      const isWhitePromotion = piece.color === 'white' && gameState.pendingMove.to.row === 0
      const isBlackPromotion = piece.color === 'black' && gameState.pendingMove.to.row === 7

      if (isWhitePromotion || isBlackPromotion) {
        // Show promotion dialog
        setPromotionState({
          isOpen: true,
          color: piece.color,
          move: gameState.pendingMove,
          isTakeMe: true
        })
        return
      }
    }

    // We reuse confirmTakeMe logic but with the pending move
    setIsLoading(true)
    setError(null)

    try {
      const apiGameState = await gameApi.declareTakeMe(gameState.id!, {
        from: gameState.pendingMove.from,
        to: gameState.pendingMove.to
      })
      const frontendGameState = convertApiGameState(apiGameState)
      setGameState(frontendGameState)
      playSound('takeme')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [gameState, playSound])

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
    setError(null)
    try {
      const response = await gameApi.getLeaderboard(gameMode)
      // Backend returns a direct array, not wrapped in { leaderboard: [...] }
      const apiEntries = Array.isArray(response) ? response : (response as any).leaderboard || []
      const frontendLeaderboard = convertApiLeaderboard(apiEntries)
      setLeaderboard(frontendLeaderboard)
    } catch (err) {
      console.error('Failed to load leaderboard:', err)
      const apiError = handleApiError(err)
      setError(apiError.error)
      setLeaderboard([]) // Reset to empty on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectPromotionPiece = useCallback(async (pieceType: PieceType) => {
    if (!promotionState || !gameState?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const moveRequest = {
        from: promotionState.move!.from,
        to: promotionState.move!.to,
        promotion_piece: pieceType
      }

      let apiGameState
      if (promotionState.isTakeMe) {
        apiGameState = await gameApi.declareTakeMe(gameState.id, moveRequest)
      } else {
        apiGameState = await gameApi.makeMove(gameState.id, moveRequest)
      }

      const frontendGameState = convertApiGameState(apiGameState)
      setGameState(frontendGameState)
      setPromotionState(null)
      playSound(promotionState.isTakeMe ? 'takeme' : 'move')
    } catch (err) {
      const apiError = handleApiError(err)
      setError(apiError.error)
    } finally {
      setIsLoading(false)
    }
  }, [promotionState, gameState, playSound])

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
    playSound,
    promotionState,
    selectPromotionPiece
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
