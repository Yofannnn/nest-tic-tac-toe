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
