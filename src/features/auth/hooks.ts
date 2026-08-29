import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage, queryKeys } from '@/src/shared/api';
import {
  login as loginRequest,
  persistLoginSession,
  requestOtp as requestOtpRequest,
  signUp as signUpRequest,
} from './api';
import type { LoginRequest, LoginResponse, SignUpRequestDTO, SignUpResponseDTO } from './api';

export function useSignUp() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: signUpRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  async function signUp(request: SignUpRequestDTO): Promise<SignUpResponseDTO | null> {
    try {
      return await mutation.mutateAsync(request);
    } catch {
      return null;
    }
  }

  return {
    signUp,
    loading: mutation.isPending,
    error: mutation.error
      ? getApiErrorMessage(mutation.error, 'No se pudo crear la cuenta.')
      : null,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await loginRequest(credentials);
      await persistLoginSession(response);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user(response.usuario.id) });
    },
  });

  async function login(credentials: LoginRequest): Promise<LoginResponse> {
    return mutation.mutateAsync(credentials);
  }

  return {
    login,
    loading: mutation.isPending,
    error: mutation.error ? getApiErrorMessage(mutation.error, 'Credenciales incorrectas.') : null,
  };
}

export function useRequestOtp() {
  const mutation = useMutation({
    mutationFn: (email: string) => requestOtpRequest(email),
  });

  async function requestOtp(email: string) {
    try {
      return await mutation.mutateAsync(email);
    } catch {
      return null;
    }
  }

  return {
    requestOtp,
    loading: mutation.isPending,
    error: mutation.error
      ? getApiErrorMessage(mutation.error, 'No se pudo enviar el código. Inténtalo de nuevo.')
      : null,
  };
}
