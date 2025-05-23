
// src/domain/usecases/SignUpUseCase.ts
import { UserRepository } from '../repositories/UserRepository';
import { SignUpRequestDTO, SignUpResponseDTO } from '../../data/dtos/SignUpRequestDTO';

export class SignUpUseCase {
    constructor(private userRepo: UserRepository) { }

    execute(request: SignUpRequestDTO): Promise<SignUpResponseDTO> {
        return this.userRepo.signUp(request);
    }
}