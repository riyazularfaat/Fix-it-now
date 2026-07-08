export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  activeStatus?: boolean;
  profilePhoto?: string;
  bio?: string;
  yearsExperience?: number;
  hourlyRate?: number;
}
