// src/data/repositories/UserRepositoryImpl.ts
import { UserRepository } from '../../domain/repositories/UserRepository';
import { SignUpRequestDTO, SignUpResponseDTO } from '../dtos/SignUpRequestDTO';
import { UserApiDataSource } from '../datasources/UserApiDataSource';

export class UserRepositoryImpl implements UserRepository {
    private api = new UserApiDataSource();

    signUp(request: SignUpRequestDTO): Promise<SignUpResponseDTO> {
        return this.api.signUp(request);
    }
}
