// src/data/datasources/UserApiDataSource.ts
import { api, endpoints } from '../../shared/api';
import { SignUpRequestDTO, SignUpResponseDTO } from '../dtos/SignUpRequestDTO';

export class UserApiDataSource {
    async signUp(payload: SignUpRequestDTO): Promise<SignUpResponseDTO> {
        const { data } = await api.post<SignUpResponseDTO>(
            endpoints.signup,
            payload
        );
        return data;
    }
}