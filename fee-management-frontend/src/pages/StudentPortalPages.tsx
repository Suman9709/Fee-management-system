import {
  getAnnouncements,
  getStudentDashboard,
  type StudentDashboardResponse,
  type StudentFeeInvoice,
} from "@/api/adminApi/adminApi"
import { InvoiceDownloadButton } from "@/components/InvoiceDownloadButton"
import { useQuery } from "@tanstack/react-query"
import { Bell, CalendarDays, GraduationCap, ReceiptText, UserRound, WalletCards } from "lucide-react"
import type { ReactNode } from "react"

const currency = (value: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value))

const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  )

const monthName = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  )

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
)

const PageHeader = ({ title, description }: { title: string; description: string }) => (
  <header>
    <p className="text-sm font-semibold text-blue-600">Student portal</p>
    <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
    <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p>
  </header>
)

const Loading = () => <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading your school information…</p>

const LoadError = () => (
  <p className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm font-medium text-rose-700" role="alert">
    Your school information could not be loaded. Please refresh the page or contact the school office.
  </p>
)

const useStudentDashboard = () =>
  useQuery({ queryKey: ["student-dashboard"], queryFn: getStudentDashboard, staleTime: 15_000, refetchInterval: 30_000 })

const AttendanceOverview = ({ dashboard }: { dashboard: StudentDashboardResponse }) => {
  const latest = dashboard.attendance[0]
  if (!latest) return <p className="text-sm text-slate-500">Attendance has not been published by the school yet.</p>
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold tracking-tight text-slate-900">{latest.attendance_percentage}%</p>
          <p className="mt-1 text-sm text-slate-500">{monthName(latest.attendance_month)}</p>
        </div>
        <p className="text-right text-sm font-semibold text-slate-700">{latest.days_present} / {latest.working_days}<span className="block text-xs font-normal text-slate-400">days present</span></p>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, latest.attendance_percentage)}%` }} />
      </div>
    </div>
  )
}

const FeeStatus = ({ invoice }: { invoice: StudentFeeInvoice }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${invoice.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
    {invoice.status.replaceAll("_", " ")}
  </span>
)

const fallbackDashboardNotices = [
  { id: "meeting", title: "Parent–teacher meeting", message: "Meeting slots are available through the school office.", date: "School update" },
  { id: "fee-deadline", title: "Fee payment reminder", message: "Please review outstanding fee invoices before their due date.", date: "Fee update" },
  { id: "science", title: "Science exhibition", message: "Students interested in participating can register with their class teacher.", date: "School update" },
]

export const StudentDashboardPage = () => {
  const { data, isPending, isError } = useStudentDashboard()
  const noticesQuery = useQuery({ queryKey: ["announcements"], queryFn: getAnnouncements, staleTime: 30_000 })
  if (isPending) return <Loading />
  if (isError || !data) return <LoadError />

  const latestInvoice = data.invoices[0]
  const classTeacher = data.classroom?.class_teacher || "Not assigned yet"
  const dashboardNotices = noticesQuery.data?.length
    ? noticesQuery.data.slice(0, 3).map((notice) => ({
        id: String(notice.id),
        title: notice.title,
        message: notice.message,
        date: shortDate(notice.published_at),
      }))
    : fallbackDashboardNotices
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <PageHeader title={`Welcome, ${data.student.full_name.split(" ")[0]}`} description="Your profile, class information, attendance, and fee details in one place." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5"><p className="text-sm font-medium text-slate-500">Class & section</p><p className="mt-2 text-2xl font-bold text-slate-900">{data.student.class_name}-{data.student.section}</p><p className="mt-1 text-xs text-slate-400">{data.classroom?.academic_year ?? "Current academic year"}</p></Card>
        <Card className="p-5"><p className="text-sm font-medium text-slate-500">Class teacher</p><p className="mt-2 truncate text-lg font-bold text-slate-900">{classTeacher}</p><p className="mt-1 text-xs text-slate-400">Set by the school office</p></Card>
        <Card className="p-5"><p className="text-sm font-medium text-slate-500">Latest attendance</p><p className="mt-2 text-2xl font-bold text-emerald-600">{data.attendance[0] ? `${data.attendance[0].attendance_percentage}%` : "—"}</p><p className="mt-1 text-xs text-slate-400">{data.attendance[0] ? monthName(data.attendance[0].attendance_month) : "Not published"}</p></Card>
        <Card className="p-5"><p className="text-sm font-medium text-slate-500">Total fee due</p><p className="mt-2 text-2xl font-bold text-amber-600">{currency(data.fee_summary.total_outstanding)}</p><p className="mt-1 text-xs text-slate-400">Across all invoices</p></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-5 sm:p-6 xl:col-span-3"><div className="mb-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CalendarDays className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Attendance</h3><p className="text-sm text-slate-500">Most recently published monthly attendance</p></div></div><AttendanceOverview dashboard={data} /></Card>
        <Card className="p-5 sm:p-6 xl:col-span-2"><div className="mb-5 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><WalletCards className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Latest fee invoice</h3><p className="text-sm text-slate-500">Current billing details</p></div></div>{latestInvoice ? <div><p className="text-2xl font-bold text-slate-900">{currency(latestInvoice.outstanding_amount)}</p><p className="mt-1 text-sm text-slate-500">Due {shortDate(latestInvoice.due_date)}</p>{latestInvoice.latest_payment_date && <p className="mt-1 text-sm font-medium text-emerald-700">Last paid {shortDate(latestInvoice.latest_payment_date)}</p>}<div className="mt-4"><FeeStatus invoice={latestInvoice} /></div></div> : <p className="text-sm text-slate-500">No fee invoice has been issued yet.</p>}</Card>
      </div>
      <Card className="overflow-hidden"><div className="flex items-start justify-between border-b border-slate-100 p-5 sm:px-6"><div><h3 className="font-semibold text-slate-900">Latest notices</h3><p className="mt-1 text-sm text-slate-500">{noticesQuery.data?.length ? "Updates published by the school office." : "School updates while new announcements are being published."}</p></div><Bell className="size-5 text-blue-600" /></div><div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">{dashboardNotices.map((notice) => <article className="p-5 sm:p-6" key={notice.id}><p className="text-xs font-semibold text-slate-400">{notice.date}</p><h4 className="mt-2 font-semibold text-slate-900">{notice.title}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{notice.message}</p></article>)}</div></Card>
    </div>
  )
}

export const StudentProfilePage = () => {
  const { data, isPending, isError } = useStudentDashboard()
  if (isPending) return <Loading />
  if (isError || !data) return <LoadError />
  const rows = [
    ["Student ID", data.student.student_id], ["Class", `${data.student.class_name}-${data.student.section}`],
    ["Class teacher", data.classroom?.class_teacher || "Not assigned yet"], ["Parent / guardian", data.student.parent_name],
    ["Parent phone", data.student.parent_phone], ["Email", data.student.email || "Not provided"],
    ["Phone", data.student.phone || "Not provided"], ["Address", data.student.address],
  ]
  return <div className="mx-auto max-w-5xl space-y-6 pb-8"><PageHeader title="My profile" description="Your school record and class assignment." /><Card className="overflow-hidden"><div className="flex items-center gap-4 border-b border-slate-100 p-5 sm:p-6"><span className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><UserRound className="size-6" /></span><div><h3 className="text-lg font-bold text-slate-900">{data.student.full_name}</h3><p className="mt-1 text-sm text-slate-500">{data.student.student_id}</p></div></div><dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">{rows.map(([label, value]) => <div className="p-5 sm:p-6" key={label}><dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</dt><dd className="mt-2 text-sm font-semibold text-slate-800">{value}</dd></div>)}</dl></Card></div>
}

export const StudentFeesPage = () => {
  const { data, isPending, isError } = useStudentDashboard()
  if (isPending) return <Loading />
  if (isError || !data) return <LoadError />
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><PageHeader title="Fees & payments" description="Fee invoices and payments recorded by the school office. Updates refresh automatically." /><div className="grid gap-4 sm:grid-cols-2"><Card className="p-5"><p className="text-sm text-slate-500">Total outstanding</p><p className="mt-2 text-3xl font-bold text-amber-600">{currency(data.fee_summary.total_outstanding)}</p></Card><Card className="p-5"><p className="text-sm text-slate-500">Invoices issued</p><p className="mt-2 text-3xl font-bold text-slate-900">{data.invoices.length}</p></Card></div><Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6"><ReceiptText className="size-5 text-blue-600" /><div><h3 className="font-semibold text-slate-900">Invoices</h3><p className="text-sm text-slate-500">School charges, payment date, balance, and a downloadable PDF invoice.</p></div></div>{data.invoices.length ? <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3">Month</th><th className="px-5 py-3">School fee</th><th className="px-5 py-3">Transport</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Paid date</th><th className="px-5 py-3">Outstanding</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Invoice</th></tr></thead><tbody className="divide-y divide-slate-100">{data.invoices.map((invoice) => <tr key={invoice.id}><td className="px-5 py-4 font-semibold text-slate-800">{monthName(invoice.billing_month)}</td><td className="px-5 py-4">{currency(invoice.school_fee_amount)}</td><td className="px-5 py-4">{currency(invoice.transport_fee_amount)}</td><td className="px-5 py-4 font-semibold text-emerald-700">{currency(invoice.paid_amount)}</td><td className="px-5 py-4 text-slate-700">{invoice.latest_payment_date ? shortDate(invoice.latest_payment_date) : "Not paid"}</td><td className="px-5 py-4 font-semibold">{currency(invoice.outstanding_amount)}</td><td className="px-5 py-4">{shortDate(invoice.due_date)}</td><td className="px-5 py-4"><FeeStatus invoice={invoice} /></td><td className="px-5 py-4"><InvoiceDownloadButton invoiceId={invoice.id} /></td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-slate-500">No fee invoices have been issued yet.</p>}</Card></div>
}

export const StudentAttendancePage = () => {
  const { data, isPending, isError } = useStudentDashboard()
  if (isPending) return <Loading />
  if (isError || !data) return <LoadError />
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><PageHeader title="Attendance" description="Monthly attendance published by the school office." /><Card className="overflow-hidden"><div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6"><GraduationCap className="size-5 text-emerald-600" /><div><h3 className="font-semibold text-slate-900">Monthly attendance records</h3><p className="text-sm text-slate-500">Records are updated by the school office.</p></div></div>{data.attendance.length ? <div className="divide-y divide-slate-100">{data.attendance.map((record) => <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" key={record.id}><div><p className="font-semibold text-slate-800">{monthName(record.attendance_month)}</p><p className="mt-1 text-sm text-slate-500">{record.days_present} days present out of {record.working_days} working days</p></div><span className="text-xl font-bold text-emerald-600">{record.attendance_percentage}%</span></div>)}</div> : <p className="p-5 text-sm text-slate-500">Attendance has not been published by the school yet.</p>}</Card></div>
}
