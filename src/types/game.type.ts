export interface IRoom {
  id: number;
  name: string;
  player1_id: number;
  player2_id: number;
  status: ROOM_STATUS;
}

export enum ROOM_STATUS {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface iResponseRoom {
  message: string;
  data: {
    id: number;
    name: string;
    player1_id: number;
    status: string;
    player2_id: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
  user_id: number;
}
