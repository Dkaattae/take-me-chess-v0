"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { 
  GameState, Player, GameMode, PieceColor, Square, Move, 
  TakeMeState, LeaderboardEntry 
} from './types'
import { 
  createInitialBoard, createInitialTakeMeState, countPieces, 
  getLegalMoves, makeMove, shouldPromote, checkWinCondition,
  checkStalemate, getCaptureMoves, findExposedPieces,
  getCapturablePiecesAfterTakeMe
} from './game-logic'
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
  
  // Actions
  startGame: () => void
  selectPiece: (square: Square) => void
  movePiece: (to: Square) => void
  declareTakeMe: () => void
  cancelTakeMe: () => void
  confirmTakeMe: () => void
  resetGame: () => void
  
  // Leaderboard
  leaderboard: LeaderboardEntry[]
  
  // Audio
  isMuted: boolean
  toggleMute: () => void
  playSound: (sound: 'move' | 'capture' | 'takeme') => void
}

const GameContext = createContext<GameContextType | null>(null)

// Mock leaderboard data
const mockLeaderboard: LeaderboardEntry[] = [
  { playerName: 'ChessKid123', wins: 15, losses: 5, draws: 2, gameMode: '1P' },
  { playerName: 'PawnMaster', wins: 12, losses: 8, draws: 3, gameMode: '2P' },
  { playerName: 'QueenBee', wins: 10, losses: 4, draws: 1, gameMode: '1P' },
  { playerName: 'KnightRider', wins: 8, losses: 6, draws: 4, gameMode: '2P' },
  { playerName: 'RookieStar', wins: 7, losses: 9, draws: 2, gameMode: '1P' },
]

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu')
  const [gameMode, setGameModeState] = useState<GameMode | null>(null)
  const [players, setPlayers] = useState<Player[]>([
    { name: '', color: 'white', isBot: false },
    { name: '', color: 'black', isBot: false }
  ])
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard)
  const [isMuted, setIsMuted] = useState(false)
  
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
  
  const startGame = useCallback(() => {
    const board = createInitialBoard()
    const pieceCount = countPieces(board)
    
    setGameState({
      board,
      currentTurn: 'white',
      players,
      status: 'active',
      winner: null,
      selectedPiece: null,
      legalMoves: [],
      takeMeState: createInitialTakeMeState(),
      moveHistory: [],
      pieceCount
    })
    setCurrentScreen('game')
  }, [players])
  
  const selectPiece = useCallback((square: Square) => {
    if (!gameState || gameState.status !== 'active') return
    
    const piece = gameState.board[square.row][square.col]
    if (!piece || piece.color !== gameState.currentTurn) return
    
    // Can't select piece if must capture due to Take Me!
    if (gameState.takeMeState.mustCapture) {
      // Only allow selecting pieces that can capture exposed pieces
      const captures = getCaptureMoves(gameState.board, gameState.currentTurn)
      const canCapture = captures.some(c => c.from.row === square.row && c.from.col === square.col)
      if (!canCapture) return
    }
    
    let moves = getLegalMoves(gameState.board, square)
    
    // If must capture, filter to only capture moves on exposed pieces
    if (gameState.takeMeState.mustCapture) {
      moves = moves.filter(move => 
        gameState.takeMeState.capturablePieces.some(
          p => p.row === move.row && p.col === move.col
        )
      )
    }
    
    setGameState(prev => prev ? {
      ...prev,
      selectedPiece: square,
      legalMoves: moves
    } : null)
  }, [gameState])
  
  const playSound = useCallback((sound: 'move' | 'capture' | 'takeme') => {
    if (isMuted) return
    // Sound effects would be played here
    // Using Web Audio API or audio elements
  }, [isMuted])
  
  const checkGameEnd = useCallback((newBoard: (typeof gameState)['board'], newPieceCount: { white: number; black: number }) => {
    if (!gameState) return null
    
    // Check win condition (player with 0 pieces wins!)
    const winner = checkWinCondition(newPieceCount)
    if (winner) {
      const winningPlayer = gameState.players.find(p => p.color === winner)!
      return { status: 'win' as const, winner: winningPlayer }
    }
    
    // Check for stalemate
    const nextTurn = gameState.currentTurn === 'white' ? 'black' : 'white'
    if (checkStalemate(newBoard, nextTurn)) {
      return { status: 'draw' as const, winner: null }
    }
    
    return null
  }, [gameState])
  
  const executeBotMove = useCallback((state: GameState) => {
    if (!state || state.status !== 'active') return
    
    const botPlayer = state.players.find(p => p.isBot)
    if (!botPlayer || state.currentTurn !== botPlayer.color) return
    
    // Add a small delay for better UX
    setTimeout(() => {
      const botResult = getBotMove(
        state.board, 
        botPlayer.color,
        state.takeMeState.mustCapture,
        state.takeMeState.capturablePieces
      )
      
      if (!botResult) return
      
      const { move, declareTakeMe: shouldDeclareTakeMe } = botResult
      
      let newBoard = makeMove(state.board, move)
      const newPieceCount = countPieces(newBoard)
      
      playSound(move.capturedPiece ? 'capture' : 'move')
      
      const gameEnd = checkGameEnd(newBoard, newPieceCount)
      
      let newTakeMeState = createInitialTakeMeState()
      
      // Bot declares Take Me! after the move
      if (shouldDeclareTakeMe && !gameEnd) {
        playSound('takeme')
        const enemyColor = botPlayer.color === 'white' ? 'black' : 'white'
        const capturablePieces = getCapturablePiecesAfterTakeMe(newBoard, enemyColor)
        
        if (capturablePieces.length > 0) {
          newTakeMeState = {
            declared: true,
            declarer: botPlayer.color,
            exposedPieces: findExposedPieces(newBoard, botPlayer.color),
            capturablePieces,
            mustCapture: true
          }
        }
      }
      
      setGameState({
        ...state,
        board: newBoard,
        currentTurn: botPlayer.color === 'white' ? 'black' : 'white',
        selectedPiece: null,
        legalMoves: [],
        takeMeState: newTakeMeState,
        moveHistory: [...state.moveHistory, move],
        pieceCount: newPieceCount,
        status: gameEnd?.status || 'active',
        winner: gameEnd?.winner || null
      })
    }, 800)
  }, [playSound, checkGameEnd])
  
  const movePiece = useCallback((to: Square) => {
    if (!gameState || !gameState.selectedPiece) return
    
    const isLegalMove = gameState.legalMoves.some(
      m => m.row === to.row && m.col === to.col
    )
    if (!isLegalMove) return
    
    const piece = gameState.board[gameState.selectedPiece.row][gameState.selectedPiece.col]!
    const capturedPiece = gameState.board[to.row][to.col]
    
    const move: Move = {
      from: gameState.selectedPiece,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      isPromotion: shouldPromote(piece, to.row),
      promotionPiece: shouldPromote(piece, to.row) ? 'queen' : undefined
    }
    
    let newBoard = makeMove(gameState.board, move)
    const newPieceCount = countPieces(newBoard)
    
    playSound(capturedPiece ? 'capture' : 'move')
    
    const gameEnd = checkGameEnd(newBoard, newPieceCount)
    
    const nextTurn = gameState.currentTurn === 'white' ? 'black' : 'white'
    
    const newState: GameState = {
      ...gameState,
      board: newBoard,
      currentTurn: nextTurn,
      selectedPiece: null,
      legalMoves: [],
      takeMeState: createInitialTakeMeState(),
      moveHistory: [...gameState.moveHistory, move],
      pieceCount: newPieceCount,
      status: gameEnd?.status || 'active',
      winner: gameEnd?.winner || null
    }
    
    setGameState(newState)
    
    // Trigger bot move if it's bot's turn
    if (!gameEnd && newState.players.some(p => p.isBot && p.color === nextTurn)) {
      executeBotMove(newState)
    }
  }, [gameState, playSound, checkGameEnd, executeBotMove])
  
  const declareTakeMe = useCallback(() => {
    if (!gameState || gameState.status !== 'active') return
    if (!gameState.selectedPiece) return
    
    // Find exposed pieces after the potential move
    const exposedPieces = findExposedPieces(gameState.board, gameState.currentTurn)
    
    setGameState(prev => prev ? {
      ...prev,
      takeMeState: {
        ...prev.takeMeState,
        declared: true,
        declarer: prev.currentTurn,
        exposedPieces
      }
    } : null)
    
    playSound('takeme')
  }, [gameState, playSound])
  
  const cancelTakeMe = useCallback(() => {
    setGameState(prev => prev ? {
      ...prev,
      takeMeState: createInitialTakeMeState()
    } : null)
  }, [])
  
  const confirmTakeMe = useCallback(() => {
    if (!gameState || !gameState.selectedPiece) return
    
    // Execute the move and set up forced capture for opponent
    const to = gameState.legalMoves[0] // Must have selected a move
    if (!to) return
    
    const piece = gameState.board[gameState.selectedPiece.row][gameState.selectedPiece.col]!
    const capturedPiece = gameState.board[to.row][to.col]
    
    const move: Move = {
      from: gameState.selectedPiece,
      to,
      piece,
      capturedPiece: capturedPiece || undefined,
      isPromotion: shouldPromote(piece, to.row),
      promotionPiece: shouldPromote(piece, to.row) ? 'queen' : undefined
    }
    
    const newBoard = makeMove(gameState.board, move)
    const newPieceCount = countPieces(newBoard)
    
    playSound('move')
    
    const gameEnd = checkGameEnd(newBoard, newPieceCount)
    
    const nextTurn = gameState.currentTurn === 'white' ? 'black' : 'white'
    const capturablePieces = getCapturablePiecesAfterTakeMe(newBoard, nextTurn)
    
    const newState: GameState = {
      ...gameState,
      board: newBoard,
      currentTurn: nextTurn,
      selectedPiece: null,
      legalMoves: [],
      takeMeState: {
        declared: true,
        declarer: gameState.currentTurn,
        exposedPieces: findExposedPieces(newBoard, gameState.currentTurn),
        capturablePieces,
        mustCapture: capturablePieces.length > 0
      },
      moveHistory: [...gameState.moveHistory, move],
      pieceCount: newPieceCount,
      status: gameEnd?.status || 'active',
      winner: gameEnd?.winner || null
    }
    
    setGameState(newState)
    
    // Trigger bot move if it's bot's turn
    if (!gameEnd && newState.players.some(p => p.isBot && p.color === nextTurn)) {
      executeBotMove(newState)
    }
  }, [gameState, playSound, checkGameEnd, executeBotMove])
  
  const resetGame = useCallback(() => {
    // Update leaderboard with game result
    if (gameState && gameState.status !== 'active') {
      const humanPlayer = gameState.players.find(p => !p.isBot)
      if (humanPlayer) {
        setLeaderboard(prev => {
          const existing = prev.find(e => e.playerName === humanPlayer.name)
          if (existing) {
            return prev.map(e => {
              if (e.playerName === humanPlayer.name) {
                return {
                  ...e,
                  wins: e.wins + (gameState.winner?.name === humanPlayer.name ? 1 : 0),
                  losses: e.losses + (gameState.winner && gameState.winner.name !== humanPlayer.name ? 1 : 0),
                  draws: e.draws + (gameState.status === 'draw' ? 1 : 0)
                }
              }
              return e
            })
          } else {
            return [...prev, {
              playerName: humanPlayer.name,
              wins: gameState.winner?.name === humanPlayer.name ? 1 : 0,
              losses: gameState.winner && gameState.winner.name !== humanPlayer.name ? 1 : 0,
              draws: gameState.status === 'draw' ? 1 : 0,
              gameMode: gameMode || '1P'
            }]
          }
        })
      }
    }
    
    setGameState(null)
    setCurrentScreen('menu')
    setGameModeState(null)
    setPlayers([
      { name: '', color: 'white', isBot: false },
      { name: '', color: 'black', isBot: false }
    ])
  }, [gameState, gameMode])
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])
  
  return (
    <GameContext.Provider value={{
      currentScreen,
      setCurrentScreen,
      gameMode,
      setGameMode,
      players,
      setPlayerName,
      gameState,
      startGame,
      selectPiece,
      movePiece,
      declareTakeMe,
      cancelTakeMe,
      confirmTakeMe,
      resetGame,
      leaderboard,
      isMuted,
      toggleMute,
      playSound
    }}>
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
