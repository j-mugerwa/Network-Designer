import { User } from "firebase/auth";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  company: string;
  role: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
