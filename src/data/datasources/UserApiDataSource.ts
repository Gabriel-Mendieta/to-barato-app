// src/data/datasources/UserApiDataSource.ts
import { api } from '../../infrastructure/api/axios';
import { SignUpRequestDTO, SignUpResponseDTO } from '../dtos/SignUpRequestDTO';

export class UserApiDataSource {
    async signUp(payload: SignUpRequestDTO): Promise<SignUpResponseDTO> {
        const { data } = await api.post<SignUpResponseDTO>('signup', payload);
        return data;
    }
}