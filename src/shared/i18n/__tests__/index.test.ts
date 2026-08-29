import i18n, { resources } from '../index';

describe('recursos i18n de español', () => {
  it('registra el namespace profile antes del primer render', () => {
    expect(i18n.isInitialized).toBe(true);
    expect(resources.es.translation.profile.hello).toBe('Hola');
    expect(i18n.t('profile.hello')).toBe('Hola');
    expect(i18n.t('profile.metricUnavailable')).toBe('No disponible');
    expect(i18n.t('profile.footer', { version: '1.0.0' })).toContain("To' Barato");
  });
});
