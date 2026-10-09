import {
  generateFeeInvoices,
  getClassFeeStructures,
  getFeeDashboard,
  getFeeDefaulters,
  getFeeInvoices,
  getFeePayments,
  getStudents,
  getTransportLocations,
  recordFeePayment,
  type FeeInvoice,
  type FeePayment,
  type InvoiceStatus,
  type PaymentMethod,
} from "@/api/adminApi/adminApi"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FilePlus2,
  LoaderCircle,
  Plus,
  ReceiptText,
  Search,
  TrendingUp,
} from "lucide-react"
import { type FormEvent, type ReactNode, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const currency = (value: string | number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value))

const shortDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  )

const monthName = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00`),
  )

const firstDayOfThisMonth = () => `${new Date().toISOString().slice(0, 7)}-01`

const currentAcademicYear = () => {
  const now = new Date()
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}-${String(start + 1).slice(-2)}`
}

const apiError = (error: unknown) => {
  if (!axios.isAxiosError(error)) return "Something went wrong. Please try again."
  const data = error.response?.data
  if (typeof data?.detail === "string") return data.detail
  if (data && typeof data === "object") {
    const [field, messages] = Object.entries(data)[0] ?? []
    const message = Array.isArray(messages) ? messages[0] : messages
    if (typeof message === "string") return field ? `${field.replaceAll("_", " ")}: ${message}` : message
  }
  return error.response ? "Please review the values and try again." : "Unable to reach the backend."
}

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
)

const PageHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-500 sm:text-base">{description}</p>
    </div>
    {action}
  </header>
)

const StatusBadge = ({ status }: { status: InvoiceStatus }) => {
  const labels: Record<InvoiceStatus, string> = {
    unpaid: "Unpaid",
    partial: "Partially paid",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Cancelled",
  }
  const colors: Record<InvoiceStatus, string> = {
    paid: "bg-emerald-50 text-emerald-700",
    partial: "bg-amber-50 text-amber-700",
    unpaid: "bg-blue-50 text-blue-700",
    overdue: "bg-rose-50 text-rose-700",
    cancelled: "bg-slate-100 text-slate-600",
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status]}`}>{labels[status]}</span>
}

const Loading = () => <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Loading live fee data…</div>

const ErrorBanner = ({ error }: { error: unknown }) => <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700" role="alert">{apiError(error)}</p>

const Stat = ({ label, value, note, tone = "text-slate-900" }: { label: string; value: string; note: string; tone?: string }) => (
  <Card className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold tracking-tight ${tone}`}>{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></Card>
)

export const LiveFeeDashboardPage = () => {
  const { data, isPending, error } = useQuery({ queryKey: ["fee-dashboard"], queryFn: () => getFeeDashboard() })
  if (isPending) return <Loading />
  if (!data) return <ErrorBanner error={error} />

  const { summary } = data
  const maxCollected = Math.max(...data.monthly_collections.map((item) => Number(item.collected)), 1)
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <PageHeader eyebrow="School owner portal" title="Fee collection overview" description={`Live collection figures for the ${data.academic_year} academic year.`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Collected" value={currency(summary.total_collected)} note={`${summary.paid_count} fully paid invoices`} tone="text-emerald-600" />
        <Stat label="Collection rate" value={`${summary.collection_rate}%`} note={`of ${currency(summary.total_invoiced)} invoiced`} tone="text-blue-600" />
        <Stat label="Outstanding" value={currency(summary.total_outstanding)} note={`${summary.overdue_count} overdue invoices`} tone="text-amber-600" />
        <Stat label="Students billed" value={String(summary.student_count)} note={`${summary.invoice_count} invoices issued`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-5 sm:p-6 xl:col-span-3">
          <div className="flex items-start justify-between"><div><h3 className="font-semibold text-slate-900">Monthly collections</h3><p className="mt-1 text-sm text-slate-500">Payments recorded during this academic year.</p></div><TrendingUp className="size-5 text-blue-600" /></div>
          {data.monthly_collections.length ? <div className="mt-7 flex h-52 items-end gap-3">{data.monthly_collections.map((item) => <div className="flex h-full min-w-0 flex-1 flex-col justify-end" key={item.month}><div className="mx-auto flex w-full max-w-14 flex-1 items-end rounded-t-lg bg-blue-50"><div className="w-full rounded-t-lg bg-blue-600" style={{ height: `${Math.max(6, (Number(item.collected) / maxCollected) * 100)}%` }} title={currency(item.collected)} /></div><p className="mt-2 text-center text-xs font-medium text-slate-500">{monthName(item.month)}</p><p className="mt-1 text-center text-[11px] text-slate-400">{currency(item.collected)}</p></div>)}</div> : <p className="py-12 text-center text-sm text-slate-500">No payments have been recorded for this academic year.</p>}
        </Card>
        <Card className="xl:col-span-2"><div className="border-b border-slate-100 p-5 sm:p-6"><h3 className="font-semibold text-slate-900">Fee health</h3><p className="mt-1 text-sm text-slate-500">Current status across issued invoices.</p></div><div className="divide-y divide-slate-100">{([{ label: "Paid", value: summary.paid_count, color: "bg-emerald-500" }, { label: "Partially paid", value: summary.partial_count, color: "bg-amber-400" }, { label: "Unpaid", value: summary.unpaid_count, color: "bg-blue-500" }, { label: "Overdue", value: summary.overdue_count, color: "bg-rose-500" }]).map((item) => <div className="flex items-center justify-between p-4 sm:px-6" key={item.label}><span className="flex items-center gap-2 text-sm font-medium text-slate-700"><i className={`size-2.5 rounded-full ${item.color}`} />{item.label}</span><span className="font-bold text-slate-900">{item.value}</span></div>)}</div></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Recent collections</h3><p className="mt-1 text-sm text-slate-500">Latest fee payments recorded by the office.</p></div>{data.recent_payments.length ? <div className="divide-y divide-slate-100">{data.recent_payments.map((payment) => <PaymentRow key={payment.id} payment={payment} />)}</div> : <p className="p-6 text-sm text-slate-500">No payments yet.</p>}</Card>
        <Card className="xl:col-span-2"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Class collection</h3><p className="mt-1 text-sm text-slate-500">Billed and collected by class.</p></div><div className="divide-y divide-slate-100">{data.class_collections.length ? data.class_collections.map((item) => <div className="p-4 sm:px-6" key={item.class_name}><div className="flex items-end justify-between"><div><p className="font-semibold text-slate-800">Class {item.class_name}</p><p className="mt-1 text-xs text-slate-400">{currency(item.collected)} of {currency(item.invoiced)}</p></div><span className="text-sm font-bold text-slate-800">{item.collection_rate}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.min(100, Number(item.collection_rate))}%` }} /></div></div>) : <p className="p-6 text-sm text-slate-500">No invoices yet.</p>}</div></Card>
      </div>
    </div>
  )
}

const PaymentRow = ({ payment }: { payment: FeePayment }) => (
  <div className="flex items-center gap-3 p-4 sm:px-6"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><ReceiptText className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{payment.invoice_student_name}</p><p className="mt-0.5 text-xs text-slate-400">{payment.method.replaceAll("_", " ")} · {shortDate(payment.payment_date)}</p></div><p className="text-sm font-bold text-emerald-700">{currency(payment.amount)}</p></div>
)

export const LiveStudentDirectoryPage = ({ portal }: { portal: "admin" | "staff" }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const { data: students, isPending, error } = useQuery({ queryKey: ["students"], queryFn: getStudents })
  const visibleStudents = useMemo(() => (students ?? []).filter((student) => `${student.full_name} ${student.student_id} ${student.parent_name} ${student.class_name} ${student.section}`.toLowerCase().includes(query.toLowerCase())), [query, students])
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader eyebrow="Student records" title="Students" description="Live enrolment records, guardian contacts, and class assignments." action={<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700" onClick={() => navigate(`/${portal}/students/new`)} type="button"><Plus className="size-4" /> Add student</button>} />{isPending ? <Loading /> : error ? <ErrorBanner error={error} /> : <Card><div className="border-b border-slate-100 p-4 sm:p-5"><label className="relative block max-w-md"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" /><input className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100" onChange={(event) => setQuery(event.target.value)} placeholder="Search by student, ID, guardian, or class" value={query} /></label></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Student</th><th className="px-5 py-3">Class</th><th className="px-5 py-3">Guardian</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3 sm:px-6">Transport</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleStudents.map((student) => <tr className="hover:bg-slate-50/70" key={student.id}><td className="px-5 py-4 sm:px-6"><p className="font-semibold text-slate-800">{student.full_name}</p><p className="mt-0.5 text-xs text-slate-400">{student.student_id}</p></td><td className="px-5 py-4 text-slate-700">{student.class_name}-{student.section}</td><td className="px-5 py-4 text-slate-700">{student.parent_name}</td><td className="px-5 py-4 text-slate-600">{student.parent_phone}</td><td className="px-5 py-4 sm:px-6 text-slate-600">{student.transport_location ? "Assigned" : "Not required"}</td></tr>)}</tbody></table></div>{visibleStudents.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No students match your search.</p>}<div className="border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:px-6">{visibleStudents.length} student{visibleStudents.length === 1 ? "" : "s"} shown</div></Card>}</div>
}

export const LiveInvoicesPage = () => {
  const queryClient = useQueryClient()
  const [billingMonth, setBillingMonth] = useState(firstDayOfThisMonth())
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all")
  const [notice, setNotice] = useState("")
  const invoiceQuery = useQuery({ queryKey: ["fee-invoices"], queryFn: () => getFeeInvoices() })
  const generation = useMutation({ mutationFn: () => generateFeeInvoices({ billing_month: billingMonth }), onSuccess: (result) => { setNotice(`${result.created} invoice${result.created === 1 ? "" : "s"} generated${result.updated ? `; ${result.updated} existing invoice${result.updated === 1 ? " was" : "s were"} refreshed` : ""}.`); void queryClient.invalidateQueries({ queryKey: ["fee-invoices"] }); void queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] }) } })
  const invoices = useMemo(() => (invoiceQuery.data ?? []).filter((invoice) => statusFilter === "all" || invoice.status === statusFilter), [invoiceQuery.data, statusFilter])
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader eyebrow="Billing" title="Invoices & billing" description="Generate monthly fee bills from the configured class and transport fees. Existing unpaid invoices are safely refreshed; paid amounts are never changed." action={<form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setNotice(""); generation.mutate() }}><label className="text-xs font-semibold text-slate-500">Billing month<input className="mt-1 block h-10 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-500" onChange={(event) => setBillingMonth(`${event.target.value}-01`)} required type="month" value={billingMonth.slice(0, 7)} /></label><button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60" disabled={generation.isPending} type="submit"><FilePlus2 className="size-4" />{generation.isPending ? "Generating…" : "Generate invoices"}</button></form>} />{notice && <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"><CheckCircle2 className="size-4" />{notice}</p>}{generation.error && <ErrorBanner error={generation.error} />}{invoiceQuery.isPending ? <Loading /> : invoiceQuery.error ? <ErrorBanner error={invoiceQuery.error} /> : <Card><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h3 className="font-semibold text-slate-900">Issued invoices</h3><p className="mt-1 text-sm text-slate-500">{invoices.length} invoice{invoices.length === 1 ? "" : "s"} shown</p></div><select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500" onChange={(event) => setStatusFilter(event.target.value as "all" | InvoiceStatus)} value={statusFilter}><option value="all">All statuses</option><option value="unpaid">Unpaid</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div><InvoiceTable invoices={invoices} /></Card>}</div>
}

const InvoiceTable = ({ invoices, showActions, onReceive }: { invoices: FeeInvoice[]; showActions?: boolean; onReceive?: (invoice: FeeInvoice) => void }) => <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Student</th><th className="px-5 py-3">Billing month</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Outstanding</th><th className="px-5 py-3">Due</th><th className="px-5 py-3">Status</th>{showActions && <th className="px-5 py-3 sm:px-6">Action</th>}</tr></thead><tbody className="divide-y divide-slate-100">{invoices.map((invoice) => <tr className="hover:bg-slate-50/70" key={invoice.id}><td className="px-5 py-4 sm:px-6"><p className="font-semibold text-slate-800">{invoice.student_name}</p><p className="mt-0.5 text-xs text-slate-400">{invoice.student_id} · Class {invoice.class_name}-{invoice.section}</p></td><td className="px-5 py-4 text-slate-700">{monthName(invoice.billing_month)}</td><td className="px-5 py-4 font-semibold text-slate-800">{currency(invoice.total_amount)}</td><td className="px-5 py-4 text-emerald-700">{currency(invoice.paid_amount)}</td><td className="px-5 py-4 font-bold text-amber-700">{currency(invoice.outstanding_amount)}</td><td className="px-5 py-4 text-slate-600">{shortDate(invoice.due_date)}</td><td className="px-5 py-4"><StatusBadge status={invoice.status} /></td>{showActions && <td className="px-5 py-4 sm:px-6">{Number(invoice.outstanding_amount) > 0 && invoice.status !== "cancelled" ? <button className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={() => onReceive?.(invoice)} type="button">Receive payment</button> : <span className="text-xs font-semibold text-emerald-600">Settled</span>}</td>}</tr>)}</tbody></table>{invoices.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No invoices found.</p>}</div>

export const LivePaymentsPage = () => {
  const queryClient = useQueryClient()
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("upi")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState("")
  const invoicesQuery = useQuery({ queryKey: ["fee-invoices"], queryFn: () => getFeeInvoices() })
  const paymentsQuery = useQuery({ queryKey: ["fee-payments"], queryFn: () => getFeePayments() })
  const recordPayment = useMutation({ mutationFn: () => { if (!selectedInvoice) throw new Error("Choose an invoice first."); return recordFeePayment({ invoice: selectedInvoice.id, amount, method, payment_date: paymentDate, reference_number: reference.trim() }) }, onSuccess: () => { setSelectedInvoice(null); setAmount(""); setReference(""); void queryClient.invalidateQueries({ queryKey: ["fee-invoices"] }); void queryClient.invalidateQueries({ queryKey: ["fee-payments"] }); void queryClient.invalidateQueries({ queryKey: ["fee-dashboard"] }) } })
  const chooseInvoice = (invoice: FeeInvoice) => { setSelectedInvoice(invoice); setAmount(Number(invoice.outstanding_amount).toFixed(2)); setReference("") }
  const openInvoices = (invoicesQuery.data ?? []).filter((invoice) => Number(invoice.outstanding_amount) > 0 && invoice.status !== "cancelled")
  const paymentTotal = (paymentsQuery.data ?? []).reduce((total, payment) => total + Number(payment.amount), 0)
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader eyebrow="Collection desk" title="Payments" description="Record cash, card, bank-transfer, and UPI collections against an issued invoice." />{invoicesQuery.isPending || paymentsQuery.isPending ? <Loading /> : invoicesQuery.error ? <ErrorBanner error={invoicesQuery.error} /> : paymentsQuery.error ? <ErrorBanner error={paymentsQuery.error} /> : <><div className="grid gap-4 sm:grid-cols-3"><Stat label="Payments recorded" value={String(paymentsQuery.data?.length ?? 0)} note="All recorded collection receipts" /><Stat label="Collected" value={currency(paymentTotal)} note="Across payment history" tone="text-emerald-600" /><Stat label="Open invoices" value={String(openInvoices.length)} note="Ready for collection" tone="text-amber-600" /></div><div className="grid gap-6 xl:grid-cols-5"><Card className="h-fit p-5 sm:p-6 xl:col-span-2"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CreditCard className="size-5" /></span><div><h3 className="font-semibold text-slate-900">Receive a payment</h3><p className="mt-0.5 text-sm text-slate-500">Choose an open invoice from the list.</p></div></div>{selectedInvoice ? <form className="mt-6 space-y-4" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); recordPayment.mutate() }}><div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-800">{selectedInvoice.student_name}</p><p className="mt-1 text-slate-500">{monthName(selectedInvoice.billing_month)} · Outstanding {currency(selectedInvoice.outstanding_amount)}</p></div><label className="block text-sm font-semibold text-slate-700">Amount<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" max={selectedInvoice.outstanding_amount} min="0.01" onChange={(event) => setAmount(event.target.value)} required step="0.01" type="number" value={amount} /></label><label className="block text-sm font-semibold text-slate-700">Payment method<select className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setMethod(event.target.value as PaymentMethod)} value={method}><option value="upi">UPI</option><option value="cash">Cash</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option></select></label><label className="block text-sm font-semibold text-slate-700">Payment date<input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setPaymentDate(event.target.value)} required type="date" value={paymentDate} /></label><label className="block text-sm font-semibold text-slate-700">Reference number <span className="font-normal text-slate-400">(optional)</span><input className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" onChange={(event) => setReference(event.target.value)} placeholder="UPI / bank reference" value={reference} /></label>{recordPayment.error && <ErrorBanner error={recordPayment.error} />}<div className="flex gap-3"><button className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60" disabled={recordPayment.isPending} type="submit">{recordPayment.isPending ? "Saving…" : "Record payment"}</button><button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => setSelectedInvoice(null)} type="button">Cancel</button></div></form> : <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Select “Receive payment” next to an open invoice.</p>}</Card><Card className="xl:col-span-3"><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Open invoices</h3><p className="mt-1 text-sm text-slate-500">Only invoices with an outstanding balance are shown.</p></div><InvoiceTable invoices={openInvoices} onReceive={chooseInvoice} showActions /></Card></div><Card><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Payment history</h3><p className="mt-1 text-sm text-slate-500">Append-only records for audit and receipt reconciliation.</p></div>{paymentsQuery.data?.length ? <div className="divide-y divide-slate-100">{paymentsQuery.data.map((payment) => <PaymentRow key={payment.id} payment={payment} />)}</div> : <p className="p-6 text-sm text-slate-500">No payments have been recorded.</p>}</Card></>}</div>
}

export const LiveDefaultersPage = () => {
  const query = useQuery({ queryKey: ["fee-defaulters"], queryFn: () => getFeeDefaulters() })
  const totalOutstanding = (query.data ?? []).reduce((total, invoice) => total + Number(invoice.outstanding_amount), 0)
  const overdue = (query.data ?? []).filter((invoice) => invoice.status === "overdue")
  return <div className="mx-auto max-w-7xl space-y-6 pb-8"><PageHeader eyebrow="Collection follow-up" title="Outstanding fees" description="Live open balances, ordered by the closest due date. Use this list to follow up with guardians." />{query.isPending ? <Loading /> : query.error ? <ErrorBanner error={query.error} /> : <><div className="grid gap-4 sm:grid-cols-3"><Stat label="Open invoices" value={String(query.data?.length ?? 0)} note="Unpaid, partial, or overdue" /><Stat label="Outstanding amount" value={currency(totalOutstanding)} note="Across all open invoices" tone="text-amber-600" /><Stat label="Overdue invoices" value={String(overdue.length)} note="Past their due date" tone="text-rose-600" /></div><Card><div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:px-6"><AlertTriangle className="size-5 text-amber-600" /><div><h3 className="font-semibold text-slate-900">Open fee balances</h3><p className="mt-1 text-sm text-slate-500">Payments should be recorded from the Payments screen.</p></div></div><InvoiceTable invoices={query.data ?? []} /></Card></>}</div>
}

export const StaffFeeSetupReadOnlyPage = () => {
  const query = useQuery({ queryKey: ["staff-fee-settings"], queryFn: async () => Promise.all([getClassFeeStructures(currentAcademicYear()), getTransportLocations()]) })
  if (query.isPending) return <Loading />
  if (query.error || !query.data) return <ErrorBanner error={query.error} />
  const [classFees, locations] = query.data
  return <div className="mx-auto max-w-6xl space-y-6 pb-8"><PageHeader eyebrow="Office staff workspace" title="Fee setup" description="Current fee settings used when invoices are issued. Only the school owner can change fee rates." /><div className="grid gap-6 xl:grid-cols-2"><Card><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Class fees</h3><p className="mt-1 text-sm text-slate-500">{currentAcademicYear()} academic year</p></div>{classFees.length ? <div className="divide-y divide-slate-100">{classFees.map((item) => <div className="flex items-center justify-between p-4 sm:px-6" key={item.id}><div><p className="font-semibold text-slate-800">Class {item.class_name}</p><p className="mt-1 text-xs text-slate-400">{item.is_active ? "Active for billing" : "Inactive"}</p></div><p className="font-bold text-slate-900">{currency(item.monthly_school_fee)}<span className="ml-1 text-xs font-normal text-slate-400">/ month</span></p></div>)}</div> : <p className="p-6 text-sm text-slate-500">No class fee structures are configured.</p>}</Card><Card><div className="border-b border-slate-100 p-5 sm:px-6"><h3 className="font-semibold text-slate-900">Transport fees</h3><p className="mt-1 text-sm text-slate-500">Optional monthly service by location</p></div>{locations.length ? <div className="divide-y divide-slate-100">{locations.map((item) => <div className="flex items-center justify-between p-4 sm:px-6" key={item.id}><div><p className="font-semibold text-slate-800">{item.location_name}</p><p className="mt-1 text-xs text-slate-400">{item.is_active ? "Available for admissions" : "Inactive"}</p></div><p className="font-bold text-slate-900">{currency(item.monthly_transport_fee)}<span className="ml-1 text-xs font-normal text-slate-400">/ month</span></p></div>)}</div> : <p className="p-6 text-sm text-slate-500">No transport locations are configured.</p>}</Card></div></div>
}
