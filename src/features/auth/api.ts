import { api, endpoints } from '@/src/shared/api';
import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
  SignUpRequest,
  SignUpResponse,
  VerifyOtpRequest,
} from '@/src/shared/api/dto';
import { clearSession, getAccessToken, getUserId, saveSession } from '@/src/shared/api/session';

export type SignUpRequestDTO = SignUpRequest;
export type SignUpResponseDTO = SignUpResponse;
export type { LoginRequest, LoginResponse };

export async function requestOtp(email: string): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(endpoints.solicitarOtp, null, {
    params: { email },
  });
  return data;
}

export async function verifyOtp(request: VerifyOtpRequest): Promise<MessageResponse> {
  const { data } = await api.post<MessageResponse>(endpoints.verificarOtp, null, {
    params: request,
  });
  return data;
}

export async function signUp(payload: SignUpRequestDTO): Promise<SignUpResponseDTO> {
  const { data } = await api.post<SignUpResponseDTO>(endpoints.signup, payload);
  return data;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>(endpoints.login, credentials);
  return data;
}

export async function validateStoredSession(): Promise<boolean> {
  const storedToken = await getAccessToken();
  const storedUserId = await getUserId();
  if (!storedToken || !storedUserId) return false;

  try {
    await api.get(endpoints.usuario(storedUserId));
    return true;
  } catch {
    await clearSession();
    return false;
  }
}

export async function persistLoginSession(response: LoginResponse): Promise<void> {
  await saveSession({
    accessToken: response.tokens.access_token,
    refreshToken: response.tokens.refresh_token,
    userId: response.usuario.id.toString(),
  });
}
