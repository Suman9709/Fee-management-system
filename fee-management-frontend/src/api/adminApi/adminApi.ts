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

export interface Classroom {
  id: number
  academic_year: string
  class_name: string
  section: string
  class_teacher: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ClassroomPayload = Pick<
  Classroom,
  "academic_year" | "class_name" | "section" | "class_teacher" | "is_active"
>

export interface StudentAttendance {
  id: number
  student: number
  student_id: string
  student_name: string
  attendance_month: string
  working_days: number
  days_present: number
  attendance_percentage: number
  created_at: string
  updated_at: string
}

export type StudentAttendancePayload = Pick<
  StudentAttendance,
  "student" | "attendance_month" | "working_days" | "days_present"
>

export interface StudentFeeInvoice {
  id: number
  academic_year: string
  billing_month: string
  school_fee_amount: string
  transport_fee_amount: string
  total_amount: string
  paid_amount: string
  outstanding_amount: string
  due_date: string
  status: string
}

export interface StudentDashboardResponse {
  student: StudentProfile
  classroom: Pick<Classroom, "academic_year" | "class_name" | "section" | "class_teacher"> | null
  attendance: StudentAttendance[]
  invoices: StudentFeeInvoice[]
  fee_summary: { total_outstanding: string }
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

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "overdue" | "cancelled"

export interface FeeInvoice {
  id: number
  student: number
  student_id: string
  student_name: string
  class_name: string
  section: string
  academic_year: string
  billing_month: string
  school_fee_amount: string
  transport_fee_amount: string
  total_amount: string
  paid_amount: string
  outstanding_amount: string
  payment_count: number
  due_date: string
  status: InvoiceStatus
  created_at: string
  updated_at: string
}

export interface InvoiceGenerationPayload {
  billing_month: string
  student_ids?: number[]
}

export interface InvoiceGenerationResult {
  created: number
  updated: number
  invoices: FeeInvoice[]
}

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "upi"

export interface FeePayment {
  id: number
  invoice: number
  invoice_student_id: string
  invoice_student_name: string
  invoice_billing_month: string
  amount: string
  payment_date: string
  method: PaymentMethod
  reference_number: string
  received_by: number
  received_by_name: string
  created_at: string
}

export interface PaymentPayload {
  invoice: number
  amount: string
  payment_date: string
  method: PaymentMethod
  reference_number?: string
}

export interface FeeDashboardSummary {
  student_count: number
  invoice_count: number
  total_invoiced: string
  total_collected: string
  total_outstanding: string
  collection_rate: string
  paid_count: number
  partial_count: number
  unpaid_count: number
  overdue_count: number
}

export interface FeeDashboardResponse {
  academic_year: string
  summary: FeeDashboardSummary
  monthly_collections: Array<{ month: string; collected: string }>
  class_collections: Array<{
    class_name: string
    invoiced: string
    collected: string
    collection_rate: string
  }>
  recent_payments: FeePayment[]
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

export const createStudent = async (
  student: StudentCreatePayload,
): Promise<StudentProfile> => {
  await ensureCsrfCookie()
  const response = await adminApi.post<StudentProfile>("/api/students/", student)
  return response.data
}

export const getStudents = async (): Promise<StudentProfile[]> => {
  const response = await adminApi.get<StudentProfile[]>("/api/students/")
  return response.data
}

export const updateStudent = async (
  studentId: string,
  payload: Partial<Omit<StudentCreatePayload, "student_id" | "password" | "password_confirmation">>,
): Promise<StudentProfile> => {
  await ensureCsrfCookie()
  const response = await adminApi.patch<StudentProfile>(`/api/students/${studentId}/`, payload)
  return response.data
}

export const getClassrooms = async (academicYear?: string): Promise<Classroom[]> => {
  const response = await adminApi.get<Classroom[]>("/api/classrooms/", {
    params: academicYear ? { academic_year: academicYear } : undefined,
  })
  return response.data
}

export const createClassroom = async (payload: ClassroomPayload): Promise<Classroom> => {
  await ensureCsrfCookie()
  const response = await adminApi.post<Classroom>("/api/classrooms/", payload)
  return response.data
}

export const updateClassroom = async (
  id: number,
  payload: ClassroomPayload,
): Promise<Classroom> => {
  await ensureCsrfCookie()
  const response = await adminApi.put<Classroom>(`/api/classrooms/${id}/`, payload)
  return response.data
}

export const getStudentAttendance = async (studentId?: number): Promise<StudentAttendance[]> => {
  const response = await adminApi.get<StudentAttendance[]>("/api/attendance/", {
    params: studentId ? { student: studentId } : undefined,
  })
  return response.data
}

export const createStudentAttendance = async (
  payload: StudentAttendancePayload,
): Promise<StudentAttendance> => {
  await ensureCsrfCookie()
  const response = await adminApi.post<StudentAttendance>("/api/attendance/", payload)
  return response.data
}

export const updateStudentAttendance = async (
  id: number,
  payload: StudentAttendancePayload,
): Promise<StudentAttendance> => {
  await ensureCsrfCookie()
  const response = await adminApi.put<StudentAttendance>(`/api/attendance/${id}/`, payload)
  return response.data
}

export const getStudentDashboard = async (): Promise<StudentDashboardResponse> => {
  const response = await adminApi.get<StudentDashboardResponse>("/api/student-dashboard/")
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

export const getFeeInvoices = async (params?: {
  student?: number
  student_id?: string
  academic_year?: string
  billing_month?: string
  status?: InvoiceStatus
}): Promise<FeeInvoice[]> => {
  const response = await adminApi.get<FeeInvoice[]>("/api/fees/invoices/", { params })
  return response.data
}

export const generateFeeInvoices = async (
  payload: InvoiceGenerationPayload,
): Promise<InvoiceGenerationResult> => {
  await ensureCsrfCookie()
  const response = await adminApi.post<InvoiceGenerationResult>("/api/fees/invoices/", payload)
  return response.data
}

export const getFeeDefaulters = async (academicYear?: string): Promise<FeeInvoice[]> => {
  const response = await adminApi.get<FeeInvoice[]>("/api/fees/invoices/defaulters/", {
    params: academicYear ? { academic_year: academicYear } : undefined,
  })
  return response.data
}

export const getFeePayments = async (params?: {
  invoice?: number
  student?: number
}): Promise<FeePayment[]> => {
  const response = await adminApi.get<FeePayment[]>("/api/fees/payments/", { params })
  return response.data
}

export const recordFeePayment = async (payload: PaymentPayload): Promise<FeePayment> => {
  await ensureCsrfCookie()
  const response = await adminApi.post<FeePayment>("/api/fees/payments/", payload)
  return response.data
}

export const getFeeDashboard = async (academicYear?: string): Promise<FeeDashboardResponse> => {
  const response = await adminApi.get<FeeDashboardResponse>("/api/fees/dashboard/", {
    params: academicYear ? { academic_year: academicYear } : undefined,
  })
  return response.data
}

export default adminApi
