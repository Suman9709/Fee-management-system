import axios, { type InternalAxiosRequestConfig } from "axios"

export type UserRole = "admin" | "staff" | "student" | "user"

export interface LoginCredentials {
  username: string
  password: string
}

export interface User {
  id: number
  username: string
  email: string
  is_staff: boolean
  is_superuser: boolean
}

export interface StudentProfile {
  id: number
  student_id: string
  username: string
  full_name: string
  date_of_birth: string
  email: string
  phone: string
  class_name: string
  section: string
  parent_name: string
  parent_phone: string
  address: string
  uses_transport: boolean
  must_change_password: boolean
  created_at: string
  updated_at: string
}

export interface CurrentUserResponse {
  authenticated: true
  role: UserRole
  user: User
  profile: StudentProfile | null
}

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
})

let refreshRequest: Promise<void> | null = null

const isAuthenticationEndpoint = (url?: string) =>
  ["/api/auth/login/", "/api/auth/refresh/", "/api/auth/logout/"].some((endpoint) =>
    url?.endsWith(endpoint),
  )

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined

    if (
      error.response?.status !== 401 ||
      !request ||
      request._retried ||
      isAuthenticationEndpoint(request.url)
    ) {
      return Promise.reject(error)
    }

    request._retried = true

    try {
      refreshRequest ??= adminApi.post("/api/auth/refresh/").then(() => undefined)
      await refreshRequest
      return adminApi(request)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    } finally {
      refreshRequest = null
    }
  },
)

export const ensureCsrfCookie = async (): Promise<void> => {
  await adminApi.get("/api/auth/csrf/")
}

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  const response = await adminApi.get<CurrentUserResponse>("/api/auth/me/")
  return response.data
}

export const userLogin = async (credentials: LoginCredentials): Promise<CurrentUserResponse> => {
  await ensureCsrfCookie()
  await adminApi.post("/api/auth/login/", credentials)
  return getCurrentUser()
}

export const userLogout = async (): Promise<void> => {
  await ensureCsrfCookie()
  await adminApi.post("/api/auth/logout/")
}

export default adminApi
