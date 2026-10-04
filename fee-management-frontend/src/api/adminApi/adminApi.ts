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
  transport_location: number | null
  must_change_password: boolean
  created_at: string
  updated_at: string
}

export interface StudentCreatePayload {
  student_id: string
  full_name: string
  date_of_birth: string
  email: string
  phone: string
  class_name: string
  section: string
  parent_name: string
  parent_phone: string
  address: string
  transport_location?: number | null
  password: string
  password_confirmation: string
}

export interface ClassFeeStructure {
  id: number
  academic_year: string
  class_name: string
  monthly_school_fee: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TransportLocation {
  id: number
  location_name: string
  monthly_transport_fee: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ClassFeePayload = Pick<
  ClassFeeStructure,
  "academic_year" | "class_name" | "monthly_school_fee" | "is_active"
>

export type TransportLocationPayload = Pick<
  TransportLocation,
  "location_name" | "monthly_transport_fee" | "is_active"
>

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

export const createStudent = async (
  student: StudentCreatePayload,
): Promise<StudentProfile> => {
  await ensureCsrfCookie()
  const response = await adminApi.post<StudentProfile>("/api/students/", student)
  return response.data
}

export const getClassFeeStructures = async (academicYear?: string) => {
  const response = await adminApi.get<ClassFeeStructure[]>("/api/fees/class-fees/", {
    params: academicYear ? { academic_year: academicYear } : undefined,
  })
  return response.data
}

export const createClassFeeStructure = async (payload: ClassFeePayload) => {
  await ensureCsrfCookie()
  const response = await adminApi.post<ClassFeeStructure>("/api/fees/class-fees/", payload)
  return response.data
}

export const updateClassFeeStructure = async (
  id: number,
  payload: ClassFeePayload,
) => {
  await ensureCsrfCookie()
  const response = await adminApi.put<ClassFeeStructure>(`/api/fees/class-fees/${id}/`, payload)
  return response.data
}

export const getTransportLocations = async (activeOnly = false) => {
  const response = await adminApi.get<TransportLocation[]>("/api/fees/transport-locations/", {
    params: activeOnly ? { is_active: true } : undefined,
  })
  return response.data
}

export const createTransportLocation = async (payload: TransportLocationPayload) => {
  await ensureCsrfCookie()
  const response = await adminApi.post<TransportLocation>("/api/fees/transport-locations/", payload)
  return response.data
}

export const updateTransportLocation = async (
  id: number,
  payload: TransportLocationPayload,
) => {
  await ensureCsrfCookie()
  const response = await adminApi.put<TransportLocation>(
    `/api/fees/transport-locations/${id}/`,
    payload,
  )
  return response.data
}

export default adminApi
