// src/data/dtos/SignUpRequestDTO.ts
export interface SignUpRequestDTO {
    IdTipoUsuario: number;
    NombreUsuario: string;
    Correo: string;
    Telefono: string;
    Clave: string;
    Nombres: string;
    Apellidos: string;
    Estado: boolean;
    UrlPerfil: string | null;
    FechaNacimiento: string; // ISO
}

// src/data/dtos/SignUpResponseDTO.ts
export interface SignUpResponseDTO extends SignUpRequestDTO {
    IdUsuario: number;
    FechaCreacion: string; // ISO
}
