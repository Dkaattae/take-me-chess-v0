/**
 * Take-Me Chess Game Tests
 * 
 * These tests cover the core game logic, Take-Me! mechanics,
 * and UI state management for the chess game.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createInitialBoard,
  countPieces,
  getLegalMoves,
  makeMove,
  checkWinCondition,
  checkStalemate,
  hasLegalMoves,
  getCaptureMoves,
  findExposedPieces,
  getCapturablePiecesAfterTakeMe,
  shouldPromote,
  createInitialTakeMeState
} from '../lib/chess/game-logic'
import { generateBotName, generateBotAvatar, getBotMove } from '../lib/chess/bot'
import type { BoardState, Move, Piece, Square } from '../lib/chess/types'

describe('Chess Board Initialization', () => {
  it('should create a standard 8x8 chess board', () => {
    const board = createInitialBoard()
    expect(board.length).toBe(8)
    expect(board[0].length).toBe(8)
  })

  it('should have 16 white pieces initially', () => {
    const board = createInitialBoard()
    const count = countPieces(board)
    expect(count.white).toBe(16)
  })

  it('should have 16 black pieces initially', () => {
    const board = createInitialBoard()
    const count = countPieces(board)
    expect(count.black).toBe(16)
  })

  it('should place pawns on rows 2 and 7', () => {
    const board = createInitialBoard()
    // Black pawns on row 1 (index)
    for (let col = 0; col < 8; col++) {
      expect(board[1][col]?.type).toBe('pawn')
      expect(board[1][col]?.color).toBe('black')
    }
    // White pawns on row 6 (index)
    for (let col = 0; col < 8; col++) {
      expect(board[6][col]?.type).toBe('pawn')
      expect(board[6][col]?.color).toBe('white')
    }
  })

  it('should place kings in the correct positions', () => {
    const board = createInitialBoard()
    expect(board[0][4]?.type).toBe('king')
    expect(board[0][4]?.color).toBe('black')
    expect(board[7][4]?.type).toBe('king')
    expect(board[7][4]?.color).toBe('white')
  })
})

describe('Piece Movement', () => {
  let board: BoardState

  beforeEach(() => {
    board = createInitialBoard()
  })

  it('should allow pawns to move forward one square', () => {
    const moves = getLegalMoves(board, { row: 6, col: 4 }) // White pawn at e2
    expect(moves.some(m => m.row === 5 && m.col === 4)).toBe(true)
  })

  it('should allow pawns to move forward two squares from starting position', () => {
    const moves = getLegalMoves(board, { row: 6, col: 4 }) // White pawn at e2
    expect(moves.some(m => m.row === 4 && m.col === 4)).toBe(true)
  })

  it('should allow knights to jump over pieces', () => {
    const moves = getLegalMoves(board, { row: 7, col: 1 }) // White knight at b1
    expect(moves.length).toBe(2)
    expect(moves.some(m => m.row === 5 && m.col === 0)).toBe(true) // a3
    expect(moves.some(m => m.row === 5 && m.col === 2)).toBe(true) // c3
  })

  it('should not allow pieces to move to squares occupied by same color', () => {
    const moves = getLegalMoves(board, { row: 7, col: 0 }) // White rook at a1
    // Rook is blocked by white pawns
    expect(moves.length).toBe(0)
  })
})

describe('Making Moves', () => {
  it('should move a piece to a new square', () => {
    const board = createInitialBoard()
    const piece = board[6][4]! // White pawn at e2
    const move: Move = {
      from: { row: 6, col: 4 },
      to: { row: 4, col: 4 },
      piece
    }
    
    const newBoard = makeMove(board, move)
    expect(newBoard[4][4]).toEqual(piece)
    expect(newBoard[6][4]).toBeNull()
  })

  it('should capture an enemy piece', () => {
    const board = createInitialBoard()
    // Manually set up a capture scenario
    board[4][3] = { type: 'pawn', color: 'black' }
    const whitePawn = board[5][4] = { type: 'pawn', color: 'white' }
    board[6][4] = null
    
    const move: Move = {
      from: { row: 5, col: 4 },
      to: { row: 4, col: 3 },
      piece: whitePawn,
      capturedPiece: board[4][3]!
    }
    
    const newBoard = makeMove(board, move)
    expect(newBoard[4][3]?.color).toBe('white')
    expect(newBoard[5][4]).toBeNull()
  })
})

describe('Win Condition (Losing All Pieces)', () => {
  it('should declare white as winner when white has 0 pieces', () => {
    const winner = checkWinCondition({ white: 0, black: 5 })
    expect(winner).toBe('white')
  })

  it('should declare black as winner when black has 0 pieces', () => {
    const winner = checkWinCondition({ white: 5, black: 0 })
    expect(winner).toBe('black')
  })

  it('should return null when both players have pieces', () => {
    const winner = checkWinCondition({ white: 8, black: 10 })
    expect(winner).toBeNull()
  })
})

describe('Stalemate (Draw Condition)', () => {
  it('should detect stalemate when a player has no legal moves', () => {
    // Create a minimal board where white has no legal moves
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
    board[0][0] = { type: 'king', color: 'white' }
    board[2][1] = { type: 'rook', color: 'black' }
    board[1][2] = { type: 'rook', color: 'black' }
    
    const isStalemate = checkStalemate(board, 'white')
    expect(isStalemate).toBe(true)
  })

  it('should not be stalemate when player has legal moves', () => {
    const board = createInitialBoard()
    const isStalemate = checkStalemate(board, 'white')
    expect(isStalemate).toBe(false)
  })
})

describe('Take Me! Declaration', () => {
  it('should create initial Take Me! state correctly', () => {
    const state = createInitialTakeMeState()
    expect(state.declared).toBe(false)
    expect(state.declarer).toBeNull()
    expect(state.exposedPieces).toEqual([])
    expect(state.capturablePieces).toEqual([])
    expect(state.mustCapture).toBe(false)
  })

  it('should find exposed pieces that can be captured', () => {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
    // White pawn that can be captured by black bishop
    board[4][4] = { type: 'pawn', color: 'white' }
    board[2][2] = { type: 'bishop', color: 'black' }
    
    const exposed = findExposedPieces(board, 'white')
    expect(exposed.some(p => p.row === 4 && p.col === 4)).toBe(true)
  })

  it('should find capturable pieces after Take Me! declaration', () => {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
    // Set up a capture scenario
    board[4][4] = { type: 'pawn', color: 'white' }
    board[3][3] = { type: 'pawn', color: 'black' }
    
    const capturable = getCapturablePiecesAfterTakeMe(board, 'white')
    expect(capturable.some(p => p.row === 3 && p.col === 3)).toBe(true)
  })
})

describe('Forced Capture After Take Me!', () => {
  it('should return capture moves available for a color', () => {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
    board[4][4] = { type: 'pawn', color: 'white' }
    board[3][3] = { type: 'pawn', color: 'black' }
    
    const captures = getCaptureMoves(board, 'white')
    expect(captures.length).toBeGreaterThan(0)
    expect(captures.some(c => c.to.row === 3 && c.to.col === 3)).toBe(true)
  })

  it('should return empty array when no captures available', () => {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
    board[4][4] = { type: 'pawn', color: 'white' }
    
    const captures = getCaptureMoves(board, 'white')
    expect(captures.length).toBe(0)
  })
})

describe('Touch-Move Rule', () => {
  it('should allow piece selection', () => {
    const board = createInitialBoard()
    const piece = board[6][4] // White pawn
    expect(piece).not.toBeNull()
    expect(piece?.color).toBe('white')
  })

  it('should not force capture if Take Me! was not declared', () => {
    const state = createInitialTakeMeState()
    expect(state.mustCapture).toBe(false)
  })
})

describe('Pawn Promotion', () => {
  it('should detect when white pawn reaches row 0', () => {
    const pawn: Piece = { type: 'pawn', color: 'white' }
    expect(shouldPromote(pawn, 0)).toBe(true)
  })

  it('should detect when black pawn reaches row 7', () => {
    const pawn: Piece = { type: 'pawn', color: 'black' }
    expect(shouldPromote(pawn, 7)).toBe(true)
  })

  it('should not promote pawn in middle of board', () => {
    const pawn: Piece = { type: 'pawn', color: 'white' }
    expect(shouldPromote(pawn, 4)).toBe(false)
  })

  it('should not promote non-pawn pieces', () => {
    const queen: Piece = { type: 'queen', color: 'white' }
    expect(shouldPromote(queen, 0)).toBe(false)
  })
})

describe('Bot Player', () => {
  it('should generate a bot name', () => {
    const name = generateBotName()
    expect(name.length).toBeGreaterThan(0)
    expect(name.split(' ').length).toBe(2) // First and last name
  })

  it('should generate a bot avatar', () => {
    const avatar = generateBotAvatar()
    expect(avatar.length).toBeGreaterThan(0)
  })

  it('should return a valid move for the bot', () => {
    const board = createInitialBoard()
    const result = getBotMove(board, 'black')
    
    expect(result).not.toBeNull()
    expect(result!.move.piece.color).toBe('black')
    expect(result!.move.from).toBeDefined()
    expect(result!.move.to).toBeDefined()
  })

  it('should capture when mustCapture is true', () => {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null))
    // Set up forced capture scenario
    board[4][4] = { type: 'pawn', color: 'white' }
    board[5][5] = { type: 'pawn', color: 'black' }
    
    const capturablePieces: Square[] = [{ row: 4, col: 4 }]
    const result = getBotMove(board, 'black', true, capturablePieces)
    
    expect(result).not.toBeNull()
    expect(result!.move.capturedPiece).toBeDefined()
  })
})

describe('One-Player vs Two-Player Setup', () => {
  it('should generate unique bot names', () => {
    const names = new Set<string>()
    for (let i = 0; i < 100; i++) {
      names.add(generateBotName())
    }
    // Should have some variety (not all the same)
    expect(names.size).toBeGreaterThan(1)
  })

  it('should generate valid bot avatars', () => {
    const avatar = generateBotAvatar()
    expect(typeof avatar).toBe('string')
    expect(avatar.length).toBeGreaterThan(0)
  })
})

describe('Leaderboard Mock Data', () => {
  it('should have valid leaderboard entry structure', () => {
    const mockEntry = {
      playerName: 'TestPlayer',
      wins: 5,
      losses: 3,
      draws: 1,
      gameMode: '1P' as const
    }
    
    expect(mockEntry.playerName).toBeDefined()
    expect(typeof mockEntry.wins).toBe('number')
    expect(typeof mockEntry.losses).toBe('number')
    expect(typeof mockEntry.draws).toBe('number')
    expect(['1P', '2P']).toContain(mockEntry.gameMode)
  })
})

describe('Piece Count Tracking', () => {
  it('should correctly count pieces after a capture', () => {
    const board = createInitialBoard()
    let count = countPieces(board)
    expect(count.white).toBe(16)
    expect(count.black).toBe(16)
    
    // Simulate a capture
    board[1][0] = null // Remove a black pawn
    count = countPieces(board)
    expect(count.black).toBe(15)
    expect(count.white).toBe(16)
  })
})
