import { queryClient, queryKeys } from '@/src/shared/api/queryClient';

describe('QueryClient compartido', () => {
  it('permite resolver requests con el adaptador offline', () => {
    expect(queryClient.getDefaultOptions().queries?.networkMode).toBe('always');
    expect(queryClient.getDefaultOptions().mutations?.networkMode).toBe('always');
  });

  it('usa una clave estable para el usuario autenticado', () => {
    expect(queryKeys.user(42)).toEqual(['user', '42']);
    expect(queryKeys.user('42')).toEqual(['user', '42']);
  });
});
