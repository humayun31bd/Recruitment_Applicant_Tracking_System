export interface User {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  designation?: string;
  branch?: string;
  roles: string[];
  permissions: string[];
  scopes: any[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}
