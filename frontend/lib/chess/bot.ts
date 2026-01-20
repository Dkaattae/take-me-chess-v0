import type { BoardState, PieceColor, Square, Move, Piece } from './types'
import { getLegalMoves, getCaptureMoves, makeMove, shouldPromote, countPieces } from './game-logic'

// Bot name generator
const botFirstNames = [
  'Chippy', 'Buddy', 'Sparky', 'Ziggy', 'Fuzzy', 'Bumble', 'Twinkle', 'Whiskers',
  'Pebbles', 'Sunny', 'Biscuit', 'Noodle', 'Pickle', 'Muffin', 'Cookie', 'Bubbles'
]

const botLastNames = [
  'Bot', 'Knight', 'Pawn', 'Rook', 'Bishop', 'King', 'Queen', 'Chess',
  'Move', 'Play', 'Think', 'Smart', 'Quick', 'Clever', 'Wise', 'Fun'
]

export function generateBotName(): string {
  const firstName = botFirstNames[Math.floor(Math.random() * botFirstNames.length)]
  const lastName = botLastNames[Math.floor(Math.random() * botLastNames.length)]
  return `${firstName} ${lastName}`
}

// Bot avatars (emoji-style icons represented as text)
const botAvatars = ['🤖', '🎮', '🎯', '🎲', '🧠', '⚡', '🌟', '🎪']

export function generateBotAvatar(): string {
  return botAvatars[Math.floor(Math.random() * botAvatars.length)]
}

// Simple bot AI for "Take-Me Chess"
// Strategy: Try to give away pieces (opposite of normal chess!)
export function getBotMove(
  board: BoardState, 
  color: PieceColor,
  mustCapture: boolean = false,
  capturablePieces: Square[] = []
): { move: Move; declareTakeMe: boolean } | null {
  
  // If must capture due to opponent's "Take Me!" declaration
  if (mustCapture && capturablePieces.length > 0) {
    const captures = getCaptureMoves(board, color)
    const validCaptures = captures.filter(c => 
      capturablePieces.some(p => p.row === c.to.row && p.col === c.to.col)
    )
    
    if (validCaptures.length > 0) {
      const randomCapture = validCaptures[Math.floor(Math.random() * validCaptures.length)]
      const piece = board[randomCapture.from.row][randomCapture.from.col]!
      const capturedPiece = board[randomCapture.to.row][randomCapture.to.col]!
      
      return {
        move: {
          from: randomCapture.from,
          to: randomCapture.to,
          piece,
          capturedPiece,
          isPromotion: shouldPromote(piece, randomCapture.to.row),
          promotionPiece: shouldPromote(piece, randomCapture.to.row) ? 'queen' : undefined
        },
        declareTakeMe: false
      }
    }
  }
  
  // Get all possible moves
  const allMoves: { from: Square; to: Square; piece: Piece }[] = []
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (piece && piece.color === color) {
        const moves = getLegalMoves(board, { row, col })
        for (const move of moves) {
          allMoves.push({ from: { row, col }, to: move, piece })
        }
      }
    }
  }
  
  if (allMoves.length === 0) return null
  
  // Bot strategy for Take-Me Chess:
  // 1. Prefer moves that put pieces in danger (to get captured!)
  // 2. Consider declaring "Take Me!" when pieces are exposed
  
  // Evaluate each move
  const movesWithScores = allMoves.map(move => {
    const newBoard = makeMove(board, {
      from: move.from,
      to: move.to,
      piece: move.piece
    })
    
    // Score: Higher is better (we WANT to lose pieces!)
    let score = 0
    
    // Check if this move puts our piece in danger
    const enemyColor = color === 'white' ? 'black' : 'white'
    const enemyCaptures = getCaptureMoves(newBoard, enemyColor)
    
    for (const capture of enemyCaptures) {
      if (capture.to.row === move.to.row && capture.to.col === move.to.col) {
        // Great! This piece can be captured
        score += 10
        
        // Bonus for offering higher value pieces
        const pieceValues: Record<string, number> = {
          'pawn': 1, 'knight': 3, 'bishop': 3, 'rook': 5, 'queen': 9, 'king': 15
        }
        score += pieceValues[move.piece.type] || 1
      }
    }
    
    // Small bonus for captures (removes opponent's pieces, but also progresses game)
    const capturedPiece = board[move.to.row][move.to.col]
    if (capturedPiece) {
      score += 2
    }
    
    // Add some randomness for variety
    score += Math.random() * 3
    
    return { move, score }
  })
  
  // Sort by score (descending) and pick one of the top moves
  movesWithScores.sort((a, b) => b.score - a.score)
  
  // Pick from top 3 moves for variety
  const topMoves = movesWithScores.slice(0, Math.min(3, movesWithScores.length))
  const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)]
  
  const capturedPiece = board[selectedMove.move.to.row][selectedMove.move.to.col]
  
  const finalMove: Move = {
    from: selectedMove.move.from,
    to: selectedMove.move.to,
    piece: selectedMove.move.piece,
    capturedPiece: capturedPiece || undefined,
    isPromotion: shouldPromote(selectedMove.move.piece, selectedMove.move.to.row),
    promotionPiece: shouldPromote(selectedMove.move.piece, selectedMove.move.to.row) ? 'queen' : undefined
  }
  
  // Decide whether to declare "Take Me!"
  // Bot will sometimes declare it when the move puts a piece in danger
  const newBoard = makeMove(board, finalMove)
  const enemyColor = color === 'white' ? 'black' : 'white'
  const postMoveCaptures = getCaptureMoves(newBoard, enemyColor)
  
  // Check if the moved piece is now attackable
  const pieceIsExposed = postMoveCaptures.some(
    c => c.to.row === finalMove.to.row && c.to.col === finalMove.to.col
  )
  
  // 60% chance to declare "Take Me!" if piece is exposed
  const declareTakeMe = pieceIsExposed && Math.random() < 0.6
  
  return { move: finalMove, declareTakeMe }
}
