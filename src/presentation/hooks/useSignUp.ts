// src/presentation/hooks/useSignUp.ts

import { useState } from 'react';
import { SignUpRequestDTO, SignUpResponseDTO } from '../../data/dtos/SignUpRequestDTO';
import { SignUpUseCase } from '../../../src/domain/usecases/SignUpUseCase';
import { UserRepositoryImpl } from '../../data/repositories/UserRepositoryImpl';

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
        } catch (e: any) {
            // 👉 Muestra TODO el objeto de respuesta en consola:
            console.error("API error response:", e.response);
            // Y para que el usuario vea algo más útil:
            const msg =
                e.response?.data?.message ||
                JSON.stringify(e.response?.data) ||
                e.message;
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }

    return { signUp, loading, error };
}
