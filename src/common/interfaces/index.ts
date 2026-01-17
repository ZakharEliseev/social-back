export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  // exp добавляется автоматически библиотекой при использовании expiresIn
}

export interface AccessTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
