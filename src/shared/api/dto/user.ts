export type UserDTO = {
  IdTipoUsuario: number;
  NombreUsuario: string;
  Correo: string;
  Telefono: string;
  Clave?: string;
  Nombres: string;
  Apellidos: string;
  Estado: boolean;
  UrlPerfil: string | null;
  FechaNacimiento: string;
  IdUsuario: number;
  FechaCreacion: string;
};

export type SignUpRequest = Omit<
  UserDTO,
  'IdUsuario' | 'FechaCreacion' | 'Clave'
> & {
  Clave: string;
};

export type SignUpResponse = UserDTO;
