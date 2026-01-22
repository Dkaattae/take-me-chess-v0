// Chess piece types
export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type PieceColor = 'white' | 'black'

export interface Piece {
  type: PieceType
  color: PieceColor
}

export interface Square {
  row: number
  col: number
}

export interface Move {
  from: Square
  to: Square
  piece: Piece
  capturedPiece?: Piece
  isPromotion?: boolean
  promotionPiece?: PieceType
}

export type BoardState = (Piece | null)[][]

export interface Player {
  id?: string // Added for API compatibility
  name: string
  color: PieceColor
  isBot: boolean
  avatar?: string
  score?: number
}

export type GameStatus = 'setup' | 'active' | 'win' | 'draw'
export type GameMode = '1P' | '2P'

export interface TakeMeState {
  declared: boolean
  declarer?: PieceColor | null // Made optional for API compatibility
  exposedPieces: Square[]
  capturablePieces: Square[]
  mustCapture: boolean
}

export interface GameState {
  id?: string // Added for API compatibility
  board: BoardState
  currentTurn: PieceColor
  players: Player[]
  status: GameStatus
  winner?: Player | null
  selectedPiece?: Square | null
  legalMoves?: Square[]
  takeMeState: TakeMeState
  moveHistory: Move[]
  pieceCount: { white: number; black: number }
  message?: string | null
  pendingMove?: { from: Square; to: Square } | null
  createdAt?: string // Added for API compatibility
  updatedAt?: string // Added for API compatibility
}

export interface LeaderboardEntry {
  playerName: string
  wins: number
  losses: number
  draws: number
  score: number
  gameMode: GameMode
  lastPlayed?: string // Added for API compatibility
}
