export interface ITokenDetails {
  accessToken: string;
  refreshToken: string;
}

export interface UserDto {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  userType?: string;
}
