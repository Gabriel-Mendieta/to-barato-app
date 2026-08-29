import { useColorScheme } from 'react-native';
import { getThemeColors } from './tokens';

/**
 * Resolves semantic colors at render time for native components.
 * NativeWind's class strategy remains configured separately for className use.
 */
export function useThemeColors() {
  return getThemeColors(useColorScheme());
}
