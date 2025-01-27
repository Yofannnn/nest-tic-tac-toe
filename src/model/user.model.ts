export class RegisterUserRequest {
  name: string;
  email: string;
  password: string;
}

export class LoginUserRequest {
  email: string;
  password: string;
}
