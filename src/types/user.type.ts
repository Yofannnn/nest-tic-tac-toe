export interface IRequestRegisterUser {
  name: string;
  email: string;
  password: string;
}

export interface IRequestLoginUser {
  email: string;
  password: string;
}

export interface IResponseRegisterAndLogin {
  message: string;
  user: IResponseUser;
  access_token: string;
}

interface IResponseUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
