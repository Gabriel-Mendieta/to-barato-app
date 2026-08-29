import type { ProviderDTO } from '@/src/shared/api';

function isValidProviderId(id: number | null): id is number {
  return id != null && Number.isInteger(id) && id > 0;
}

export function resolveEffectiveProviderId(
  selectedProviderId: number | null,
  requestedProviderId: number | null,
  providers: ProviderDTO[] | undefined,
): number | null {
  if (isValidProviderId(selectedProviderId)) return selectedProviderId;
  if (isValidProviderId(requestedProviderId)) return requestedProviderId;
  return (
    providers?.find((provider) => isValidProviderId(provider.IdProveedor))?.IdProveedor ?? null
  );
}
