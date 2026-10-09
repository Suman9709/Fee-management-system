import {
  createGuardian,
  getAnnouncements,
  getGuardianDashboard,
  getGuardians,
  getStudents,
  type GuardianChildDashboard,
} from "@/api/adminApi/adminApi"
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { CheckCircle2, LoaderCircle, UserPlus } from "lucide-react"
import { type FormEvent, type ReactNode, useState } from "react"

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>

const PageHeader = ({ title, description, eyebrow = "Parent portal" }: { title: string; description: string; eyebrow?: string }) => <header><p className="text-sm font-semibold text-blue-600">{eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">{description}</p></header>

const currency = (value: string) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value))

const monthName = (value: string) => new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`))

const shortDate = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`))

const Loading = () => <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Loading your family information…</p>

const apiError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again."
  const data = error.response?.data
  if (typeof data?.detail === "string") return data.detail
  if (data && typeof data === "object") { const [field, messages] = Object.entries(data)[0] ?? []; const message = Array.isArray(messages) ? messages[0] : messages; if (typeof message === "string") return `${field.replaceAll("_", " ")}: ${message}` }
  return error.response ? "Please review the values and try again." : "Unable to reach the backend."
}

const ErrorBanner = ({ error }: { error: unknown }) => <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700" role="alert">{apiError(error)}</p>

const fallbackDashboardNotices = [
  { id: "meeting", title: "Parent–teacher meeting", message: "Meeting slots are available through the school office.", date: "School update" },
  { id: "fee-deadline", title: "Fee payment reminder", message: "Please review outstanding fee invoices before their due date.", date: "Fee update" },
  { id: "science", title: "Science exhibition", message: "Students interested in participating can register with their class teacher.", date: "School update" },
]

const useGuardianDashboard = () => useQuery({ queryKey: ["guardian-dashboard"], queryFn: getGuardianDashboard, staleTime: 15_000, refetchInterval: 30_000 })

const ChildHeading = ({ child }: { child: GuardianChildDashboard }) => <div><p className="font-semibold text-slate-900">{child.student.full_name}</p><p className="mt-1 text-xs text-slate-400">{child.student.student_id} · Class {child.student.class_name}-{child.student.section}</p></div>

export const GuardianDashboardPage = () => {
  const { data, isPending, error } = useGuardianDashboard()
  const notices = useQuery({ queryKey: ["announcements"], queryFn: getAnnouncements, staleTime: 30_000 })
  if (isPending) return <Loading />
  if (!data) return <ErrorBanner error={error} />
  const totalOutstanding = data.children.reduce((total, child) => total + Number(child.fee_summary.total_outstanding), 0)
  const dashboardNotices = notices.data?.length
    ? notices.data.slice(0, 3).map((notice) => ({
        id: String(notice.id),
        title: notice.title,
        message: notice.message,
        date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
          new Date(`${notice.published_at.slice(0, 10)}T00:00:00`),
        ),
      }))
    : fallbackDashboardNotices
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader title={`Welcome, ${data.guardian.full_name.split(" ")[0]}`} description="Your linked children, school updates, attendance, and fee balances in one place." /><div className="grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-sm text-slate-500">Linked children</p><p className="mt-2 text-3xl font-bold text-slate-900">{data.children.length}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Total outstanding</p><p className="mt-2 text-3xl font-bold text-amber-600">{currency(String(totalOutstanding))}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Published notices</p><p className="mt-2 text-3xl font-bold text-blue-600">{notices.data?.length ?? 0}</p><p className="mt-1 text-xs text-slate-400">Latest updates from the school office.</p></Card></div><div className="grid gap-5 lg:grid-cols-2">{data.children.map((child) => <Card className="p-5 sm:p-6" key={child.student.id}><div className="flex items-start justify-between gap-4"><ChildHeading child={child} /><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{child.classroom?.class_teacher || "Teacher pending"}</span></div><div className="mt-6 grid grid-cols-3 border-t border-slate-100 pt-4 text-sm"><div><p className="text-slate-400">Attendance</p><p className="mt-1 font-bold text-emerald-600">{child.attendance[0] ? `${child.attendance[0].attendance_percentage}%` : "—"}</p></div><div><p className="text-slate-400">Open invoices</p><p className="mt-1 font-bold text-slate-800">{child.invoices.filter((invoice) => Number(invoice.outstanding_amount) > 0).length}</p></div><div><p className="text-slate-400">Fee due</p><p className="mt-1 font-bold text-amber-600">{currency(child.fee_summary.total_outstanding)}</p></div></div></Card>)}</div>{data.children.length === 0 && <Card className="p-6 text-sm text-slate-500">No students are linked to this parent account. Ask the school office to link your child.</Card>}<Card className="overflow-hidden"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Latest notices</h3><p className="mt-1 text-sm text-slate-500">{notices.data?.length ? "Announcements published for your family portal." : "School updates while new announcements are being published."}</p></div><div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">{dashboardNotices.map((notice) => <article className="p-5 sm:p-6" key={notice.id}><p className="text-xs font-semibold text-slate-400">{notice.date}</p><h4 className="mt-2 font-semibold text-slate-900">{notice.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{notice.message}</p></article>)}</div></Card></div>
}

export const GuardianChildrenPage = () => {
  const { data, isPending, error } = useGuardianDashboard()
  if (isPending) return <Loading />
  if (!data) return <ErrorBanner error={error} />
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><PageHeader title="My children" description="Student details and their current class information." />{data.children.map((child) => <Card key={child.student.id}><div className="border-b border-slate-100 p-5 sm:px-6"><ChildHeading child={child} /></div><dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0"><div className="p-5 sm:px-6"><dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Class teacher</dt><dd className="mt-2 text-sm font-semibold text-slate-800">{child.classroom?.class_teacher || "Not assigned"}</dd></div><div className="p-5 sm:px-6"><dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Guardian contact</dt><dd className="mt-2 text-sm font-semibold text-slate-800">{child.student.parent_phone}</dd></div><div className="p-5 sm:px-6"><dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</dt><dd className="mt-2 text-sm font-semibold text-slate-800">{child.student.email || "Not provided"}</dd></div><div className="p-5 sm:px-6"><dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Address</dt><dd className="mt-2 text-sm font-semibold text-slate-800">{child.student.address}</dd></div></dl></Card>)}{data.children.length === 0 && <Card className="p-6 text-sm text-slate-500">No students are linked to this account.</Card>}</div>
}

export const GuardianFeesPage = () => {
  const { data, isPending, error } = useGuardianDashboard()
  if (isPending) return <Loading />
  if (!data) return <ErrorBanner error={error} />
  const invoices = data.children.flatMap((child) => child.invoices.map((invoice) => ({ ...invoice, student: child.student })))
  const outstanding = invoices.reduce((total, invoice) => total + Number(invoice.outstanding_amount), 0)
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader title="Fees & payments" description="Fee bills, paid dates, and downloadable invoices for all linked children. Updates refresh automatically." /><div className="grid gap-4 sm:grid-cols-2"><Card className="p-5"><p className="text-sm text-slate-500">Total outstanding</p><p className="mt-2 text-3xl font-bold text-amber-600">{currency(String(outstanding))}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Invoices issued</p><p className="mt-2 text-3xl font-bold text-slate-900">{invoices.length}</p></Card></div><Card>{invoices.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Student</th><th className="px-5 py-3">Month</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Paid date</th><th className="px-5 py-3">Outstanding</th><th className="px-5 py-3 sm:px-6">Status</th><th className="px-5 py-3 sm:px-6">Invoice</th></tr></thead><tbody className="divide-y divide-slate-100">{invoices.map((invoice) => <tr key={`${invoice.student.id}-${invoice.id}`}><td className="px-5 py-4 font-semibold text-slate-800 sm:px-6">{invoice.student.full_name}</td><td className="px-5 py-4 text-slate-700">{monthName(invoice.billing_month)}</td><td className="px-5 py-4 text-slate-700">{currency(invoice.total_amount)}</td><td className="px-5 py-4 text-emerald-700">{currency(invoice.paid_amount)}</td><td className="px-5 py-4 text-slate-700">{invoice.latest_payment_date ? shortDate(invoice.latest_payment_date) : "Not paid"}</td><td className="px-5 py-4 font-semibold text-amber-700">{currency(invoice.outstanding_amount)}</td><td className="px-5 py-4 sm:px-6"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${invoice.status === "paid" ? "bg-emerald-50 text-emerald-700" : invoice.status === "overdue" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>{invoice.status.replaceAll("_", " ")}</span></td><td className="px-5 py-4 sm:px-6"><InvoiceDownloadButton invoiceId={invoice.id} /></td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-slate-500">No fee invoices have been issued.</p>}</Card></div>
}

export const GuardianAttendancePage = () => {
  const { data, isPending, error } = useGuardianDashboard()
  if (isPending) return <Loading />
  if (!data) return <ErrorBanner error={error} />
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><PageHeader title="Attendance" description="Monthly attendance records published by the school office." />{data.children.map((child) => <Card key={child.student.id}><div className="border-b border-slate-100 p-5 sm:px-6"><ChildHeading child={child} /></div>{child.attendance.length ? <div className="divide-y divide-slate-100">{child.attendance.map((record) => <div className="flex items-center justify-between p-5 sm:px-6" key={record.id}><div><p className="font-semibold text-slate-800">{monthName(record.attendance_month)}</p><p className="mt-1 text-sm text-slate-500">{record.days_present} of {record.working_days} working days</p></div><p className="text-xl font-bold text-emerald-600">{record.attendance_percentage}%</p></div>)}</div> : <p className="p-5 text-sm text-slate-500">Attendance has not been published yet.</p>}</Card>)}</div>
}

type GuardianForm = { full_name: string; phone: string; email: string; username: string; password: string; password_confirmation: string; student_ids: number[] }
const blankGuardian = (): GuardianForm => ({ full_name: "", phone: "", email: "", username: "", password: "", password_confirmation: "", student_ids: [] })

export const GuardianManagementPage = () => {
  const client = useQueryClient()
  const [form, setForm] = useState<GuardianForm>(blankGuardian)
  const guardians = useQuery({ queryKey: ["guardians"], queryFn: getGuardians })
  const students = useQuery({ queryKey: ["students"], queryFn: getStudents })
  const create = useMutation({ mutationFn: () => createGuardian(form), onSuccess: () => { setForm(blankGuardian()); void client.invalidateQueries({ queryKey: ["guardians"] }) } })
  const toggleStudent = (id: number) => setForm((current) => ({ ...current, student_ids: current.student_ids.includes(id) ? current.student_ids.filter((studentId) => studentId !== id) : [...current.student_ids, id] }))
  if (guardians.isPending || students.isPending) return <Loading />
  if (guardians.error) return <ErrorBanner error={guardians.error} />
  if (students.error) return <ErrorBanner error={students.error} />
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader eyebrow="School administration" title="Parent accounts" description="Create a secure parent login and link one or more enrolled students. Parents can then view notices, fees, attendance, and timetables." /><div className="grid gap-6 xl:grid-cols-5"><Card className="h-fit p-5 sm:p-6 xl:col-span-2"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserPlus className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Create parent account</h3><p className="mt-1 text-sm text-slate-500">Select every child this parent may access.</p></div></div><form className="mt-6 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); create.mutate() }}><label className="block text-sm font-semibold text-slate-700">Full name<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} required value={form.full_name} /></label><label className="block text-sm font-semibold text-slate-700">Phone<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required value={form.phone} /></label><label className="block text-sm font-semibold text-slate-700">Email <span className="font-normal text-slate-400">(optional)</span><input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" value={form.email} /></label><label className="block text-sm font-semibold text-slate-700">Username<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required value={form.username} /></label><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><label className="block text-sm font-semibold text-slate-700">Password<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" minLength={8} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required type="password" value={form.password} /></label><label className="block text-sm font-semibold text-slate-700">Confirm password<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" minLength={8} onChange={(event) => setForm((current) => ({ ...current, password_confirmation: event.target.value }))} required type="password" value={form.password_confirmation} /></label></div><fieldset><legend className="text-sm font-semibold text-slate-700">Linked students</legend><div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-3">{students.data?.map((student) => <label className="flex items-center gap-2 text-sm text-slate-700" key={student.id}><input checked={form.student_ids.includes(student.id)} onChange={() => toggleStudent(student.id)} type="checkbox" />{student.full_name} · {student.student_id}</label>)}</div></fieldset>{create.error && <ErrorBanner error={create.error} />}{create.isSuccess && <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> Parent account created.</p>}<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={create.isPending || form.student_ids.length === 0} type="submit"><UserPlus className="size-4" />{create.isPending ? "Creating…" : "Create parent"}</button></form></Card><Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Parent accounts</h3><p className="mt-1 text-sm text-slate-500">Only linked students are visible to each account.</p></div>{guardians.data?.length ? <div className="divide-y divide-slate-100">{guardians.data.map((guardian) => <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={guardian.id}><div><p className="font-semibold text-slate-800">{guardian.full_name}</p><p className="mt-1 text-sm text-slate-500">{guardian.username} · {guardian.phone}</p></div><div className="text-sm text-slate-600"><p className="font-semibold">{guardian.students.length} linked student{guardian.students.length === 1 ? "" : "s"}</p><p className="mt-1 text-xs text-slate-400">{guardian.students.map((student) => student.full_name).join(", ")}</p></div></div>)}</div> : <p className="p-6 text-sm text-slate-500">No parent accounts have been created.</p>}</Card></div></div>
}
