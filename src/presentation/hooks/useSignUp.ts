// src/presentation/hooks/useSignUp.ts

import { useState } from 'react';
import { SignUpRequestDTO, SignUpResponseDTO } from '../../data/dtos/SignUpRequestDTO';
import { SignUpUseCase } from '../../../src/domain/usecases/SignUpUseCase';
import { UserRepositoryImpl } from '../../data/repositories/UserRepositoryImpl';
import { getApiErrorMessage } from '../../shared/api';

export function useSignUp() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // instanciamos el repositorio y el caso de uso
    const userRepo = new UserRepositoryImpl();
    const signUpUc = new SignUpUseCase(userRepo);

    // función que expone el hook
    async function signUp(
        request: SignUpRequestDTO
    ): Promise<SignUpResponseDTO | null> {
        setLoading(true);
        setError(null);
        try {
            return await signUpUc.execute(request);
        } catch (e) {
            setError(getApiErrorMessage(e, 'No se pudo crear la cuenta.'));
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { signUp, loading, error };
}
