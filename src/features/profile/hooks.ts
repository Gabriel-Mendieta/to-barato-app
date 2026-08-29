import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/api';
import { getUser, updateUser, type UpdateUserPayload } from './api';

export function useCurrentUser(userId: string | number | null) {
  return useQuery({
    queryKey: userId == null ? ['user', 'anonymous'] : queryKeys.user(userId),
    queryFn: () => {
      if (userId == null) throw new Error('No hay una sesión activa.');
      return getUser(userId);
    },
    enabled: userId != null,
  });
}

export function useUpdateUser(userId: string | number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => {
      if (userId == null) throw new Error('No hay una sesión activa.');
      return updateUser(userId, payload);
    },
    onSuccess: (user) => {
      if (userId != null) {
        queryClient.setQueryData(queryKeys.user(userId), user);
      }
    },
  });
}
