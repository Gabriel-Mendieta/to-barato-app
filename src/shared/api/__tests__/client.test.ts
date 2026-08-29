import { env, DEFAULT_API_URL } from '@/src/shared/config/env';
import { endpoints } from '@/src/shared/api/endpoints';
import { api } from '@/src/shared/api/client';
import { parseRecipeMarkdown } from '@/src/features/recipes/parseRecipe';
import { setOfflineMode, __resetDevModeForTests } from '@/src/shared/dev';
import { setMockDelayMs } from '@/src/shared/dev/mockDelay';

describe('API config', () => {
  it('uses a single documented default base URL', () => {
    expect(DEFAULT_API_URL).toBe('https://tobaratoapi.alirizvi.dev/api/');
    expect(env.apiUrl.endsWith('/')).toBe(true);
    expect(api.defaults.baseURL).toBe(env.apiUrl);
  });

  it('exposes relative endpoint paths only', () => {
    expect(endpoints.login).toBe('login');
    expect(endpoints.signup).toBe('signup');
    expect(endpoints.verificarOtp).toBe('verificar-otp');
    expect(endpoints.refresh).toBe('refresh_token');
    expect(endpoints.listaProductoItem(7, 3)).toBe('listas/7/productos/3');
    expect(endpoints.usuario(7)).toBe('usuario/7');
    expect(endpoints.login.startsWith('http')).toBe(false);
  });
});

describe('API offline adapter', () => {
  beforeEach(async () => {
    setMockDelayMs(0);
    __resetDevModeForTests();
    await setOfflineMode(true);
  });

  afterAll(() => {
    setMockDelayMs(null);
    __resetDevModeForTests();
  });

  it('returns mock proveedores when offline mode is on', async () => {
    const { data } = await api.get<Array<{ Nombre: string }>>(endpoints.proveedor);
    const names = data.map((p) => p.Nombre);
    expect(names).toEqual(expect.arrayContaining(['Nacional', 'Jumbo']));
  });
});

describe('parseRecipeMarkdown', () => {
  it('extracts ingredients and steps from markdown-ish text', () => {
    const raw = `# Sancocho
## Ingredientes
- 2 lb de pollo
- 1 yuca
## Pasos
1. Sofreír el pollo
2. Agregar vegetales`;
    const parsed = parseRecipeMarkdown(raw);
    expect(parsed.title).toContain('Sancocho');
    expect(parsed.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(parsed.steps.length).toBe(2);
    expect(parsed.steps[0].text).toMatch(/Sofreír/i);
  });
});
