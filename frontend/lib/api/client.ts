// lib/api/client.ts
// Version: 5.0 (Internal Proxy + Snake Case API Types)

const API_BASE_URL = '/api';

if (typeof window !== 'undefined') {
  console.log('API Client (v5.0) initialized. Using internal proxy: /api -> http://localhost:8000');
}

// Helper for fetch calls
async function fetchApi(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (typeof window !== 'undefined') {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (typeof window !== 'undefined') {
      console.log(`API Response: ${response.status} ${url}`);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw { response: { status: response.status, data: errorData }, message: `HTTP ${response.status}` };
    }

    return await response.json();
  } catch (error: any) {
    if (typeof window !== 'undefined') {
      console.error('API Error:', error.message || error);
    }
    throw error;
  }
}

// Types based on OpenAPI spec (MATCHING BACKEND SNAKE_CASE)
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
  captured_piece?: ApiPiece
  is_promotion?: boolean
  promotion_piece?: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
}

export type ApiBoardState = (ApiPiece | null)[][]

export interface ApiPlayer {
  id: string
  name: string
  color: 'white' | 'black'
  is_bot: boolean
  avatar?: string
  score: number
}

export type ApiGameStatus = 'setup' | 'active' | 'win' | 'draw'
export type ApiGameMode = '1P' | '2P'

export interface ApiTakeMeState {
  declared: boolean
  declarer?: 'white' | 'black'
  exposed_pieces: ApiSquare[]
  capturable_pieces: ApiSquare[]
  must_capture: boolean
}

export interface ApiGameState {
  id: string
  board: ApiBoardState
  current_turn: 'white' | 'black'
  players: ApiPlayer[]
  status: ApiGameStatus
  winner?: ApiPlayer
  selected_piece?: ApiSquare
  legal_moves?: ApiSquare[]
  take_me_state: ApiTakeMeState
  move_history: ApiMove[]
  piece_count: { white: number; black: number }
  message?: string | null
  created_at: string
  updated_at: string
}

export interface ApiLeaderboardEntry {
  player_name: string
  wins: number
  losses: number
  draws: number
  score: number
  game_mode: ApiGameMode
  last_played: string
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
  promotion_piece?: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
}

export interface DeclareTakeMeRequest {
  from: ApiSquare
  to: ApiSquare
  promotion_piece?: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
}

export interface BotMoveResponse {
  move: ApiMove
  declare_take_me: boolean
}

export interface ValidationResponse {
  valid: boolean
  legal_moves?: ApiSquare[]
  error?: string
}

export interface ErrorResponse {
  error: string
  code: string
  details?: any
}

// API Client Functions
export const gameApi = {
  createGame: (request: CreateGameRequest): Promise<ApiGameState> =>
    fetchApi('/games', { method: 'POST', body: JSON.stringify(request) }),

  getGame: (gameId: string): Promise<ApiGameState> =>
    fetchApi(`/games/${gameId}`),

  makeMove: (gameId: string, request: MakeMoveRequest): Promise<ApiGameState> =>
    fetchApi(`/games/${gameId}/moves`, { method: 'POST', body: JSON.stringify(request) }),

  validateMove: (gameId: string, request: MakeMoveRequest): Promise<ValidationResponse> =>
    fetchApi(`/games/${gameId}/moves/validate`, { method: 'POST', body: JSON.stringify(request) }),

  declareTakeMe: (gameId: string, request: DeclareTakeMeRequest): Promise<ApiGameState> =>
    fetchApi(`/games/${gameId}/take-me`, { method: 'POST', body: JSON.stringify(request) }),

  getBotMove: (gameId: string): Promise<{ gameState: ApiGameState; botMove: BotMoveResponse }> =>
    fetchApi(`/games/${gameId}/bot-move`, { method: 'POST' }),

  getLegalMoves: (gameId: string, row: number, col: number): Promise<{ legal_moves: ApiSquare[] }> =>
    fetchApi(`/games/${gameId}/legal-moves?row=${row}&col=${col}`),

  endGame: (gameId: string): Promise<{ message: string; finalState: ApiGameState }> =>
    fetchApi(`/games/${gameId}`, { method: 'DELETE' }),

  getLeaderboard: (gameMode?: ApiGameMode, limit = 10): Promise<{ leaderboard: ApiLeaderboardEntry[] }> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (gameMode) params.append('game_mode', gameMode);
    return fetchApi(`/leaderboard?${params.toString()}`);
  },

  submitGameResult: (request: any): Promise<any> =>
    fetchApi('/leaderboard', { method: 'POST', body: JSON.stringify(request) }),

  healthCheck: (): Promise<{ status: string; timestamp: string }> =>
    fetchApi('/health')
};

export const handleApiError = (error: any): ErrorResponse => {
  if (error.response?.data) {
    return error.response.data;
  }
  return {
    error: 'Network error',
    code: 'NETWORK_ERROR',
    details: error.message || 'Unknown error'
  };
};