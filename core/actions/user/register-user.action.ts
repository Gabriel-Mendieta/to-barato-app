import { api, endpoints } from '@/src/shared/api';

/** Legacy register helper — prefer OTP flow in `app/auth`. */
export const registerUserAction = async (payload: Record<string, unknown>) => {
  const { data } = await api.post(endpoints.solicitarOtp, null, {
    params: { email: String(payload.email ?? '') },
  });
  return data;
};
