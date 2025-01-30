export interface IRegisterUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface ILoginUserRequest {
  email: string;
  password: string;
}
