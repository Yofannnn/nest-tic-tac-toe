import { IMatchHistory } from './game.type';

export interface IRoom {
  id: number;
  name: string;
  player1_id: number;
  player2_id: number | null;
  password: string | null;
  status: ROOM_STATUS;
  createdAt: Date;
  updatedAt: Date;
}

export enum ROOM_STATUS {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export interface IResponseCreateAndJoinRoom {
  message: string;
  room: IRoom;
  user_id: number;
}

export interface IResponseLeaveRoom {
  message: string;
  match_history?: IMatchHistory;
}

export interface IGetRoomsWaitingResponse {
  id: number;
  name: string;
  owner_id: number;
  status: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}
