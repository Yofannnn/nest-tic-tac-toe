export interface IDirectMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResponseGetUserConversations {
  user_id: number;
  message: string;
  conversations: IUserConversations[];
}

interface IUserConversations {
  id: number;
  createdAt: Date;
  messages: IDirectMessage[];
  participants: IUserOnConversation[];
}

interface IUserOnConversation {
  user_id: number;
  conversation_id: number;
  createdAt: Date;
  deleted_at: Date | null;
}

export interface IResponseGetDirectMessages {
  direct_messages: IDirectMessage[];
  friend: IFriend;
}

interface IFriend {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
