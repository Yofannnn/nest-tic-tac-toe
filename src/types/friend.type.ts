export interface IFriend {
  id: number;
  user_id: number;
  friend_id: number;
  status: FRIEND_STATUS;
  createdAt: Date;
  updatedAt: Date;
}

export enum FRIEND_STATUS {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}

export interface IResponseGetFriends {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
