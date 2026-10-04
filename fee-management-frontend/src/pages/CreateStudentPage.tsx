import {
  createStudent,
  getClassFeeStructures,
  getTransportLocations,
  type ClassFeeStructure,
  type StudentCreatePayload,
  type StudentProfile,
  type TransportLocation,
} from "@/api/adminApi/adminApi"
import axios from "axios"
import { CheckCircle2, ChevronLeft, UserPlus } from "lucide-react"
import { type FormEvent, type ReactNode, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

type CreateStudentPageProps = {
  portal: "admin" | "staff"
}

type FormValues = Omit<StudentCreatePayload, "transport_location"> & {
  transport_location: string
}

const initialFormValues: FormValues = {
  student_id: "",
  full_name: "",
  date_of_birth: "",
  email: "",
  phone: "",
  class_name: "",
  section: "",
  parent_name: "",
  parent_phone: "",
  address: "",
  transport_location: "",
  password: "",
  password_confirmation: "",
}

const inputClassName =
  "mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"

const currentAcademicYear = () => {
  const today = new Date()
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  return `${startYear}-${String(startYear + 1).slice(-2)}`
}

const formatApiError = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return "Unable to create the student. Please try again."
  }

  const data = error.response?.data
  if (typeof data?.detail === "string") {
    return data.detail
  }
  if (data && typeof data === "object") {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (typeof message === "string") {
      return field ? `${field.replaceAll("_", " ")}: ${message}` : message
    }
  }
  return error.response
    ? "Unable to create the student. Please review the form."
    : "Unable to reach the backend. Check that it is running."
}

const Field = ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) => (
  <label className="block text-sm font-semibold text-slate-700">
    {label}
    {children}
  </label>
)

export const CreateStudentPage = ({ portal }: CreateStudentPageProps) => {
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>(initialFormValues)
  const [createdStudent, setCreatedStudent] = useState<StudentProfile | null>(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classFees, setClassFees] = useState<ClassFeeStructure[]>([])
  const [transportLocations, setTransportLocations] = useState<TransportLocation[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const studentListPath = `/${portal}/students`

  useEffect(() => {
    const loadFeeOptions = async () => {
      try {
        const [classes, locations] = await Promise.all([
          getClassFeeStructures(currentAcademicYear()),
          getTransportLocations(true),
        ])
        setClassFees(classes.filter((classFee) => classFee.is_active))
        setTransportLocations(locations)
      } catch {
        setError("Unable to load class and transport fee options. Please refresh the page.")
      } finally {
        setIsLoadingOptions(false)
      }
    }
    void loadFeeOptions()
  }, [])

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setCreatedStudent(null)

    if (values.password !== values.password_confirmation) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)
    try {
      const { transport_location, ...studentValues } = values
      const student = await createStudent({
        ...studentValues,
        transport_location: transport_location ? Number(transport_location) : null,
        student_id: values.student_id.trim(),
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        class_name: values.class_name.trim(),
        section: values.section.trim(),
        parent_name: values.parent_name.trim(),
        parent_phone: values.parent_phone.trim(),
        address: values.address.trim(),
      })
      setCreatedStudent(student)
      setValues(initialFormValues)
    } catch (submissionError) {
      setError(formatApiError(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {portal === "admin" ? "Owner portal" : "Office staff workspace"}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Add a student
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Create the student profile and their secure portal sign-in together.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          onClick={() => navigate(studentListPath)}
          type="button"
        >
          <ChevronLeft className="size-4" /> Student records
        </button>
      </header>

      {createdStudent && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">{createdStudent.full_name} was added successfully.</p>
              <p className="mt-1 text-sm text-emerald-800">
                Portal username: <span className="font-semibold">{createdStudent.username}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <form
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900">Student admission details</h3>
              <p className="mt-0.5 text-sm text-slate-500">Fields marked required are needed to create the account.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-5 sm:p-6">
          <section>
            <h4 className="text-sm font-bold text-slate-900">Student details</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Student ID *">
                <input className={inputClassName} onChange={(event) => updateValue("student_id", event.target.value)} placeholder="e.g. STU-2026-00003" required value={values.student_id} />
              </Field>
              <Field label="Full name *">
                <input className={inputClassName} onChange={(event) => updateValue("full_name", event.target.value)} placeholder="Student's full name" required value={values.full_name} />
              </Field>
              <Field label="Date of birth *">
                <input className={inputClassName} max={new Date().toISOString().slice(0, 10)} onChange={(event) => updateValue("date_of_birth", event.target.value)} required type="date" value={values.date_of_birth} />
              </Field>
              <Field label="Email">
                <input className={inputClassName} onChange={(event) => updateValue("email", event.target.value)} placeholder="student@example.com" type="email" value={values.email} />
              </Field>
              <Field label="Phone">
                <input className={inputClassName} onChange={(event) => updateValue("phone", event.target.value)} placeholder="9876543210" value={values.phone} />
              </Field>
              <Field label="Class *">
                <select className={inputClassName} disabled={isLoadingOptions || classFees.length === 0} onChange={(event) => updateValue("class_name", event.target.value)} required value={values.class_name}>
                  <option value="">{isLoadingOptions ? "Loading classes..." : "Select a class"}</option>
                  {classFees.map((classFee) => <option key={classFee.id} value={classFee.class_name}>Class {classFee.class_name} — ₹{classFee.monthly_school_fee}/month</option>)}
                </select>
              </Field>
              <Field label="Section *">
                <input className={inputClassName} onChange={(event) => updateValue("section", event.target.value)} placeholder="e.g. A" required value={values.section} />
              </Field>
              <Field label="Transport location">
                <select className={inputClassName} disabled={isLoadingOptions} onChange={(event) => updateValue("transport_location", event.target.value)} value={values.transport_location}>
                  <option value="">No transport required</option>
                  {transportLocations.map((location) => <option key={location.id} value={location.id}>{location.location_name} — ₹{location.monthly_transport_fee}/month</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-8">
            <h4 className="text-sm font-bold text-slate-900">Parent or guardian</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Parent or guardian name *">
                <input className={inputClassName} onChange={(event) => updateValue("parent_name", event.target.value)} placeholder="Parent's full name" required value={values.parent_name} />
              </Field>
              <Field label="Parent or guardian phone *">
                <input className={inputClassName} onChange={(event) => updateValue("parent_phone", event.target.value)} placeholder="9876543210" required value={values.parent_phone} />
              </Field>
              <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
                Address *
                <textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100" onChange={(event) => updateValue("address", event.target.value)} placeholder="House number, street, city, and PIN code" required value={values.address} />
              </label>
            </div>
          </section>

          <section className="border-t border-slate-100 pt-8">
            <h4 className="text-sm font-bold text-slate-900">Portal sign-in</h4>
            <p className="mt-1 text-sm text-slate-500">The student ID becomes the portal username.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Temporary password *">
                <input className={inputClassName} minLength={8} onChange={(event) => updateValue("password", event.target.value)} required type="password" value={values.password} />
              </Field>
              <Field label="Confirm password *">
                <input className={inputClassName} minLength={8} onChange={(event) => updateValue("password_confirmation", event.target.value)} required type="password" value={values.password_confirmation} />
              </Field>
            </div>
          </section>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200" disabled={isSubmitting} onClick={() => navigate(studentListPath)} type="button">Cancel</button>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            <UserPlus className="size-4" /> {isSubmitting ? "Creating student..." : "Create student"}
          </button>
        </footer>

        {error && <p className="mx-5 mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 sm:mx-6" role="alert">{error}</p>}
      </form>
    </div>
  )
}
