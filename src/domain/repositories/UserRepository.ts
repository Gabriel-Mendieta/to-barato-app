import { SignUpRequestDTO, SignUpResponseDTO } from '../../data/dtos/SignUpRequestDTO';

export interface UserRepository {
    signUp(request: SignUpRequestDTO): Promise<SignUpResponseDTO>;
}