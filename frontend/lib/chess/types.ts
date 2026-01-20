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
  name: string
  color: PieceColor
  isBot: boolean
  avatar?: string
}

export type GameStatus = 'setup' | 'active' | 'win' | 'draw'
export type GameMode = '1P' | '2P'

export interface TakeMeState {
  declared: boolean
  declarer: PieceColor | null
  exposedPieces: Square[]
  capturablePieces: Square[]
  mustCapture: boolean
}

export interface GameState {
  board: BoardState
  currentTurn: PieceColor
  players: Player[]
  status: GameStatus
  winner: Player | null
  selectedPiece: Square | null
  legalMoves: Square[]
  takeMeState: TakeMeState
  moveHistory: Move[]
  pieceCount: { white: number; black: number }
  pendingMove: { from: Square; to: Square } | null
}

export interface LeaderboardEntry {
  playerName: string
  wins: number
  losses: number
  draws: number
  gameMode: GameMode
}
