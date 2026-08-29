import axios, { AxiosError } from 'axios';
import { ApiError, getApiErrorMessage, normalizeApiError } from '../errors';

describe('normalizeApiError', () => {
  it('normalizes a FastAPI string detail', () => {
    const error = normalizeApiError({
      response: { status: 404, data: { detail: 'Lista no encontrada' } },
    });

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe('Lista no encontrada');
    expect(error.status).toBe(404);
  });

  it('normalizes a FastAPI object detail without exposing arbitrary fields', () => {
    const error = normalizeApiError({
      response: {
        status: 422,
        data: {
          detail: { field: 'Correo', msg: 'El correo no es válido' },
          refresh_token: 'secret-token',
        },
      },
    });

    expect(error.message).toBe('El correo no es válido');
    expect(error.details).toEqual({
      field: 'Correo',
      msg: 'El correo no es válido',
    });
  });

  it('normalizes validation errors in an array', () => {
    const error = normalizeApiError({
      response: {
        status: 422,
        data: {
          detail: [
            { loc: ['body', 'Correo'], msg: 'Campo requerido', type: 'value_error' },
            { loc: ['body', 'Clave'], msg: 'Campo requerido', type: 'value_error' },
          ],
        },
      },
    });

    expect(error.message).toBe('Campo requerido. Campo requerido');
    expect(error.details).toHaveLength(2);
  });

  it('normalizes a message response', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'No autorizado' } } }))
      .toBe('No autorizado');
  });

  it('normalizes a plain string', () => {
    expect(normalizeApiError('Error de validación').message).toBe(
      'Error de validación'
    );
  });

  it('uses a safe network message for Axios network errors', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(normalizeApiError(error).message).toBe(
      'No se pudo conectar con el servidor.'
    );
  });

  it('normalizes Axios response errors and preserves status/code', () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST');
    error.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as never,
      data: { detail: 'Solicitud inválida' },
    };

    const normalized = normalizeApiError(error);
    expect(normalized.message).toBe('Solicitud inválida');
    expect(normalized.status).toBe(400);
    expect(normalized.code).toBe('ERR_BAD_REQUEST');
  });

  it('redacts tokens from string errors', () => {
    expect(axios.isAxiosError(new AxiosError('x'))).toBe(true);
    expect(normalizeApiError('Bearer super-secret-token').message).toBe(
      'Bearer [redacted]'
    );
  });
});
