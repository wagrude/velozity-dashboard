import { api, refreshAccessTokenOnce } from "./client";
import type { User } from "../types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AuthData {
  accessToken: string;
  user: User;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthData> {
  const response = await api.post<ApiResponse<AuthData>>(
    "/auth/login",
    {
      email,
      password,
    },
  );

  return response.data.data;
}

export async function refreshAccessToken(): Promise<string> {
  return refreshAccessTokenOnce();
}

export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>("/auth/me");

  return response.data.data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
