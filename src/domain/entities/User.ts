// src/domain/entities/User.ts
export interface User {
    id: number;
    tipoUsuario: number;
    nombreUsuario: string;
    correo: string;
    telefono: string;
    nombres: string;
    apellidos: string;
    estado: boolean;
    urlPerfil: string | null;
    fechaNacimiento: Date;
    fechaCreacion: Date;
}