export interface IGameState {
  id: number;
  room_id: number;
  board: string[];
  status: string;
  turn: number;
  winner: number | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface IMatchHistory {
  id: number;
  player1_id: number;
  player2_id: number;
  createdAt: Date;
  updatedAt: Date;
  room_id: number;
  player1_score: number;
  player2_score: number;
  draw_score: number;
  duration: number | null;
}

export interface IInitializeGame {
  initial_game: IGameState;
  room_players: {
    player_1: {
      id: number;
      name: string;
    };
    player_2: {
      id: number;
      name: string;
    };
  };
}
