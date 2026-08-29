export type DecimalValue = string | number;

export type LoginRequest = {
  Correo: string;
  Clave: string;
};

export type AuthTokens = {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
};

export type LoginTokens = AuthTokens & {
  refresh_token: string;
};

export type AuthUser = {
  id: number;
  email: string;
  nombre?: string;
};

export type LoginResponse = {
  message?: string;
  tokens: LoginTokens;
  usuario: AuthUser;
};

export type RefreshResponse = {
  access_token?: string;
  token_type?: string;
  token?: string;
  tokens?: AuthTokens;
};

export type OtpRequest = {
  email: string;
};

export type VerifyOtpRequest = OtpRequest & {
  codigo: string;
};

export type MessageResponse = {
  message?: string;
};
