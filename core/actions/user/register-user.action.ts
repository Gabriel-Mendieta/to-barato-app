import { toBaratoApi } from "@/core/api/to-barato-api";
import { SignupUserResponse } from "@/infrastructure/interfaces/signup-user-responde";

export const registerUserAction = async () => {
    try {

        const { data } = await toBaratoApi.post<SignupUserResponse>('/signup');

        console.log(JSON.stringify(data, null, 2));

        return [];
    } catch (error) {
        console.log(error);
        throw new Error('Error al registrar el usuario');
    }
}