import type { BoardState, Piece, PieceColor, PieceType, Square, Move, GameState, TakeMeState } from './types'

// Initialize the starting board
export function createInitialBoard(): BoardState {
  const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
  
  // Set up pawns
  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: 'pawn', color: 'black' }
    board[6][col] = { type: 'pawn', color: 'white' }
  }
  
  // Set up other pieces
  const pieceOrder: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
  
  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieceOrder[col], color: 'black' }
    board[7][col] = { type: pieceOrder[col], color: 'white' }
  }
  
  return board
}

// Count pieces for each player
export function countPieces(board: BoardState): { white: number; black: number } {
  let white = 0
  let black = 0
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece) {
        if (piece.color === 'white') white++
        else black++
      }
    }
  }
  
  return { white, black }
}

// Check if a square is on the board
function isValidSquare(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

// Get all legal moves for a piece (standard chess rules)
export function getLegalMoves(board: BoardState, square: Square, ignoreTakeMeRestrictions = false): Square[] {
  const piece = board[square.row][square.col]
  if (!piece) return []
  
  const moves: Square[] = []
  const { row, col } = square
  const direction = piece.color === 'white' ? -1 : 1
  
  switch (piece.type) {
    case 'pawn': {
      // Forward move
      const newRow = row + direction
      if (isValidSquare(newRow, col) && !board[newRow][col]) {
        moves.push({ row: newRow, col })
        // Double move from starting position
        const startRow = piece.color === 'white' ? 6 : 1
        if (row === startRow) {
          const doubleRow = row + 2 * direction
          if (!board[doubleRow][col]) {
            moves.push({ row: doubleRow, col })
          }
        }
      }
      // Diagonal captures
      for (const dc of [-1, 1]) {
        const captureCol = col + dc
        if (isValidSquare(newRow, captureCol)) {
          const target = board[newRow][captureCol]
          if (target && target.color !== piece.color) {
            moves.push({ row: newRow, col: captureCol })
          }
        }
      }
      break
    }
    
    case 'knight': {
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ]
      for (const [dr, dc] of knightMoves) {
        const newRow = row + dr
        const newCol = col + dc
        if (isValidSquare(newRow, newCol)) {
          const target = board[newRow][newCol]
          if (!target || target.color !== piece.color) {
            moves.push({ row: newRow, col: newCol })
          }
        }
      }
      break
    }
    
    case 'bishop': {
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i
          const newCol = col + dc * i
          if (!isValidSquare(newRow, newCol)) break
          const target = board[newRow][newCol]
          if (!target) {
            moves.push({ row: newRow, col: newCol })
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol })
            }
            break
          }
        }
      }
      break
    }
    
    case 'rook': {
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i
          const newCol = col + dc * i
          if (!isValidSquare(newRow, newCol)) break
          const target = board[newRow][newCol]
          if (!target) {
            moves.push({ row: newRow, col: newCol })
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol })
            }
            break
          }
        }
      }
      break
    }
    
    case 'queen': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ]
      for (const [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const newRow = row + dr * i
          const newCol = col + dc * i
          if (!isValidSquare(newRow, newCol)) break
          const target = board[newRow][newCol]
          if (!target) {
            moves.push({ row: newRow, col: newCol })
          } else {
            if (target.color !== piece.color) {
              moves.push({ row: newRow, col: newCol })
            }
            break
          }
        }
      }
      break
    }
    
    case 'king': {
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
      ]
      for (const [dr, dc] of directions) {
        const newRow = row + dr
        const newCol = col + dc
        if (isValidSquare(newRow, newCol)) {
          const target = board[newRow][newCol]
          if (!target || target.color !== piece.color) {
            moves.push({ row: newRow, col: newCol })
          }
        }
      }
      break
    }
  }
  
  return moves
}

// Get all pieces that can capture enemy pieces
export function getCaptureMoves(board: BoardState, color: PieceColor): { from: Square; to: Square }[] {
  const captures: { from: Square; to: Square }[] = []
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row, col }, true)
        for (const move of moves) {
          const target = board[move.row][move.col]
          if (target && target.color !== color) {
            captures.push({ from: { row, col }, to: move })
          }
        }
      }
    }
  }
  
  return captures
}

// Find pieces that are under attack (for "Take Me!" highlighting)
export function findExposedPieces(board: BoardState, color: PieceColor): Square[] {
  const exposed: Square[] = []
  const enemyColor = color === 'white' ? 'black' : 'white'
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        // Check if any enemy piece can capture this piece
        const enemyCaptures = getCaptureMoves(board, enemyColor)
        for (const capture of enemyCaptures) {
          if (capture.to.row === row && capture.to.col === col) {
            exposed.push({ row, col })
            break
          }
        }
      }
    }
  }
  
  return exposed
}

// Make a move on the board
export function makeMove(board: BoardState, move: Move): BoardState {
  const newBoard = board.map(row => [...row])
  
  // Handle pawn promotion
  if (move.isPromotion && move.promotionPiece) {
    newBoard[move.to.row][move.to.col] = { 
      type: move.promotionPiece, 
      color: move.piece.color 
    }
  } else {
    newBoard[move.to.row][move.to.col] = move.piece
  }
  
  newBoard[move.from.row][move.from.col] = null
  
  return newBoard
}

// Check if a pawn should be promoted
export function shouldPromote(piece: Piece, toRow: number): boolean {
  if (piece.type !== 'pawn') return false
  return (piece.color === 'white' && toRow === 0) || (piece.color === 'black' && toRow === 7)
}

// Check if a player has any legal moves
export function hasLegalMoves(board: BoardState, color: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row, col })
        if (moves.length > 0) return true
      }
    }
  }
  return false
}

// Check win condition: a player wins when they lose ALL their pieces
export function checkWinCondition(pieceCount: { white: number; black: number }): PieceColor | null {
  if (pieceCount.white === 0) return 'white' // White wins by losing all pieces
  if (pieceCount.black === 0) return 'black' // Black wins by losing all pieces
  return null
}

// Check for stalemate (draw)
export function checkStalemate(board: BoardState, color: PieceColor): boolean {
  return !hasLegalMoves(board, color)
}

// Initialize Take-Me state
export function createInitialTakeMeState(): TakeMeState {
  return {
    declared: false,
    declarer: null,
    exposedPieces: [],
    capturablePieces: [],
    mustCapture: false
  }
}

// Get pieces that can be captured after "Take Me!" declaration
export function getCapturablePiecesAfterTakeMe(
  board: BoardState, 
  attackerColor: PieceColor
): Square[] {
  const captures = getCaptureMoves(board, attackerColor)
  const capturableSquares = new Set<string>()
  
  for (const capture of captures) {
    capturableSquares.add(`${capture.to.row},${capture.to.col}`)
  }
  
  return Array.from(capturableSquares).map(key => {
    const [row, col] = key.split(',').map(Number)
    return { row, col }
  })
}

// Square to algebraic notation (for display)
export function squareToNotation(square: Square): string {
  const files = 'abcdefgh'
  const ranks = '87654321'
  return files[square.col] + ranks[square.row]
}
