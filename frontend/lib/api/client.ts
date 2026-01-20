import axios from 'axios'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types based on OpenAPI spec
export interface ApiPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
  color: 'white' | 'black'
}

export interface ApiSquare {
  row: number
  col: number
}

export interface ApiMove {
  from: ApiSquare
  to: ApiSquare
  piece: ApiPiece
  capturedPiece?: ApiPiece
  isPromotion?: boolean
  promotionPiece?: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
}

export type ApiBoardState = (ApiPiece | null)[][]

export interface ApiPlayer {
  id: string
  name: string
  color: 'white' | 'black'
  isBot: boolean
  avatar?: string
}

export type ApiGameStatus = 'setup' | 'active' | 'win' | 'draw'
export type ApiGameMode = '1P' | '2P'

export interface ApiTakeMeState {
  declared: boolean
  declarer?: 'white' | 'black'
  exposedPieces: ApiSquare[]
  capturablePieces: ApiSquare[]
  mustCapture: boolean
}

export interface ApiGameState {
  id: string
  board: ApiBoardState
  currentTurn: 'white' | 'black'
  players: ApiPlayer[]
  status: ApiGameStatus
  winner?: ApiPlayer
  selectedPiece?: ApiSquare
  legalMoves?: ApiSquare[]
  takeMeState: ApiTakeMeState
  moveHistory: ApiMove[]
  pieceCount: { white: number; black: number }
  createdAt: string
  updatedAt: string
}

export interface ApiLeaderboardEntry {
  playerName: string
  wins: number
  losses: number
  draws: number
  gameMode: ApiGameMode
  lastPlayed: string
}

export interface CreateGameRequest {
  game_mode: ApiGameMode
  players: Array<{
    name: string
    is_bot?: boolean
  }>
}

export interface MakeMoveRequest {
  from: ApiSquare
  to: ApiSquare
  promotionPiece?: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
}

export interface DeclareTakeMeRequest {
  from: ApiSquare
  to: ApiSquare
  promotionPiece?: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
}

export interface BotMoveResponse {
  move: ApiMove
  declareTakeMe: boolean
}

export interface ValidationResponse {
  valid: boolean
  legalMoves?: ApiSquare[]
  error?: string
}

export interface ErrorResponse {
  error: string
  code: string
  details?: any
}

// API Client Functions
export const gameApi = {
  // Create a new game
  createGame: async (request: CreateGameRequest): Promise<ApiGameState> => {
    const response = await api.post('/games', request)
    return response.data
  },

  // Get game state
  getGame: async (gameId: string): Promise<ApiGameState> => {
    const response = await api.get(`/games/${gameId}`)
    return response.data
  },

  // Make a move
  makeMove: async (gameId: string, request: MakeMoveRequest): Promise<ApiGameState> => {
    const response = await api.post(`/games/${gameId}/moves`, request)
    return response.data
  },

  // Validate a move
  validateMove: async (gameId: string, request: MakeMoveRequest): Promise<ValidationResponse> => {
    const response = await api.post(`/games/${gameId}/moves/validate`, request)
    return response.data
  },

  // Declare Take Me!
  declareTakeMe: async (gameId: string, request: DeclareTakeMeRequest): Promise<ApiGameState> => {
    const response = await api.post(`/games/${gameId}/take-me`, request)
    return response.data
  },

  // Get bot move
  getBotMove: async (gameId: string): Promise<{ gameState: ApiGameState; botMove: BotMoveResponse }> => {
    const response = await api.post(`/games/${gameId}/bot-move`)
    return response.data
  },

  // Get legal moves for a piece
  getLegalMoves: async (gameId: string, row: number, col: number): Promise<{ legalMoves: ApiSquare[] }> => {
    const response = await api.get(`/games/${gameId}/legal-moves`, {
      params: { row, col }
    })
    return response.data
  },

  // End game
  endGame: async (gameId: string): Promise<{ message: string; finalState: ApiGameState }> => {
    const response = await api.delete(`/games/${gameId}`)
    return response.data
  },

  // Get leaderboard
  getLeaderboard: async (gameMode?: ApiGameMode, limit = 10): Promise<{ leaderboard: ApiLeaderboardEntry[] }> => {
    const response = await api.get('/leaderboard', {
      params: { game_mode: gameMode, limit }
    })
    return response.data
  },

  // Submit game result
  submitGameResult: async (request: {
    game_id: string
    winner: { name: string; is_bot: boolean }
    game_mode: ApiGameMode
    duration: number
  }): Promise<{ message: string; updatedLeaderboard: ApiLeaderboardEntry[] }> => {
    const response = await api.post('/leaderboard', request)
    return response.data
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await api.get('/health')
    return response.data
  }
}

// Error handling
export const handleApiError = (error: any): ErrorResponse => {
  if (error.response?.data) {
    return error.response.data
  }
  return {
    error: 'Network error',
    code: 'NETWORK_ERROR',
    details: error.message
  }
}