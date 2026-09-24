import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  GraduationCap,
  Plus,
  ReceiptText,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react"

const inputClassName =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"

type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

const PageHeader = ({ eyebrow, title, description, action }: PageHeaderProps) => (
  <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p>
    </div>
    {action}
  </header>
)

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</section>
)

const StatusBadge = ({ value }: { value: string }) => {
  const styles: Record<string, string> = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    Sent: "bg-blue-50 text-blue-700 ring-blue-600/20",
    Partial: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    Draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
    Overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[value] ?? styles.Draft}`}>
      {value}
    </span>
  )
}

const SectionTitle = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
)

const students = [
  { id: "ST-1001", name: "Aarav Sharma", grade: "Grade 10-A", guardian: "Rohan Sharma", phone: "+91 98765 10234", due: "₹0", status: "Paid" },
  { id: "ST-1002", name: "Diya Patel", grade: "Grade 8-B", guardian: "Kavita Patel", phone: "+91 98765 33421", due: "₹4,800", status: "Partial" },
  { id: "ST-1003", name: "Vivaan Gupta", grade: "Grade 12-A", guardian: "Amit Gupta", phone: "+91 98765 09122", due: "₹12,500", status: "Overdue" },
  { id: "ST-1004", name: "Ananya Singh", grade: "Grade 6-C", guardian: "Pooja Singh", phone: "+91 98765 77342", due: "₹0", status: "Paid" },
  { id: "ST-1005", name: "Ishaan Verma", grade: "Grade 10-B", guardian: "Neha Verma", phone: "+91 98765 44819", due: "₹7,200", status: "Partial" },
  { id: "ST-1006", name: "Myra Kapoor", grade: "Grade 8-A", guardian: "Sonia Kapoor", phone: "+91 98765 89602", due: "₹15,600", status: "Overdue" },
]

export const StudentsPage = () => {
  const [query, setQuery] = useState("")
  const [grade, setGrade] = useState("All grades")
  const [notice, setNotice] = useState("")

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesQuery = `${student.name} ${student.id} ${student.guardian}`.toLowerCase().includes(query.toLowerCase())
        return matchesQuery && (grade === "All grades" || student.grade.startsWith(grade))
      }),
    [grade, query],
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Student directory"
        title="Students"
        description="Manage enrolments, guardian information, and individual fee status."
        action={
          <button onClick={() => setNotice("Student admission form opened for the demo.")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <Plus className="size-4" /> Add student
          </button>
        }
      />

      {notice && <DemoNotice message={notice} onClose={() => setNotice("")} />}

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pl-9`} placeholder="Search student or guardian" />
          </div>
          <div className="flex gap-2">
            <select value={grade} onChange={(event) => setGrade(event.target.value)} className={`${inputClassName} w-auto pr-8`}>
              <option>All grades</option>
              <option>Grade 6</option>
              <option>Grade 8</option>
              <option>Grade 10</option>
              <option>Grade 12</option>
            </select>
            <button className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="More filters">
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3.5 sm:px-6">Student</th>
                <th className="px-5 py-3.5">Guardian</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Outstanding</th>
                <th className="px-5 py-3.5">Fee status</th>
                <th className="px-5 py-3.5 sm:px-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{student.name.split(" ").map((part) => part[0]).join("")}</div>
                      <div><p className="font-semibold text-slate-800">{student.name}</p><p className="mt-0.5 text-xs text-slate-400">{student.id} · {student.grade}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{student.guardian}</td>
                  <td className="px-5 py-4 text-slate-600">{student.phone}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{student.due}</td>
                  <td className="px-5 py-4"><StatusBadge value={student.status} /></td>
                  <td className="px-5 py-4 sm:px-6"><button onClick={() => setNotice(`${student.name}'s profile is ready to view in this demo.`)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"><Eye className="size-4" /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-sm text-slate-500 sm:px-6"><span>Showing {filteredStudents.length} of {students.length} students</span><span>Page 1 of 8</span></div>
      </Card>
    </div>
  )
}

const classRooms = [
  { grade: "Grade 6", sections: 3, students: 178, teacher: "Meera Joshi", attendance: "96.2%", color: "bg-sky-500" },
  { grade: "Grade 8", sections: 4, students: 242, teacher: "Sanjay Kumar", attendance: "94.8%", color: "bg-violet-500" },
  { grade: "Grade 10", sections: 4, students: 236, teacher: "Nisha Shah", attendance: "95.6%", color: "bg-emerald-500" },
  { grade: "Grade 12", sections: 3, students: 189, teacher: "Rahul Mehta", attendance: "93.9%", color: "bg-amber-500" },
]

export const AcademicsPage = () => {
  const [selectedGrade, setSelectedGrade] = useState("Grade 10")
  const selectedClass = classRooms.find((item) => item.grade === selectedGrade) ?? classRooms[0]

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Academic setup" title="Academics" description="Track classes, sections, teachers, and academic operations." action={<button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Plus className="size-4" /> Add class</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {classRooms.map((classRoom) => (
          <button key={classRoom.grade} onClick={() => setSelectedGrade(classRoom.grade)} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition ${selectedGrade === classRoom.grade ? "border-blue-500 ring-3 ring-blue-100" : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-300"}`}>
            <div className={`flex size-10 items-center justify-center rounded-lg text-white ${classRoom.color}`}><GraduationCap className="size-5" /></div>
            <p className="mt-4 text-base font-bold text-slate-900">{classRoom.grade}</p>
            <p className="mt-1 text-sm text-slate-500">{classRoom.sections} sections · {classRoom.students} students</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span className="text-slate-500">Attendance</span><span className="font-bold text-emerald-600">{classRoom.attendance}</span></div>
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <SectionTitle title={`${selectedClass.grade} overview`} description={`Class teacher: ${selectedClass.teacher}`} action={<button className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700">View timetable <ChevronDown className="size-4 -rotate-90" /></button>} />
        <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">
          <AcademicStat label="Total students" value={selectedClass.students.toString()} detail="Across all sections" />
          <AcademicStat label="Average attendance" value={selectedClass.attendance} detail="Last 30 working days" />
          <AcademicStat label="Fee collection" value="89.6%" detail="Current term collection" />
        </div>
      </Card>
      <Card>
        <SectionTitle title="Today's teaching schedule" description="Monday, 14 September 2026" />
        <div className="divide-y divide-slate-100">
          {["08:30 AM · Mathematics · Grade 10-A · Nisha Shah", "10:15 AM · Science · Grade 10-B · Amit Rao", "12:00 PM · English · Grade 10-C · Kavya Iyer"].map((entry) => {
            const [time, subject, section, teacher] = entry.split(" · ")
            return <div key={entry} className="flex flex-col gap-2 px-5 py-4 text-sm sm:flex-row sm:items-center sm:px-6"><span className="font-semibold text-blue-600 sm:w-28">{time}</span><span className="font-semibold text-slate-800 sm:w-36">{subject}</span><span className="text-slate-600 sm:flex-1">{section}</span><span className="text-slate-500">{teacher}</span></div>
          })}
        </div>
      </Card>
    </div>
  )
}

const AcademicStat = ({ label, value, detail }: { label: string; value: string; detail: string }) => <div className="p-5 sm:p-6"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>

const feePlans = [
  { name: "Primary annual plan", grades: "Grades 1–5", amount: "₹32,000", terms: "4 instalments", students: 394, status: "Active" },
  { name: "Middle school plan", grades: "Grades 6–8", amount: "₹38,000", terms: "4 instalments", students: 428, status: "Active" },
  { name: "Senior school plan", grades: "Grades 9–12", amount: "₹46,000", terms: "4 instalments", students: 426, status: "Active" },
]

export const FeeManagementPage = () => {
  const [selectedPlan, setSelectedPlan] = useState("Middle school plan")
  const [notice, setNotice] = useState("")

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="Fee configuration" title="Fee management" description="Configure fee structures, instalments, discounts, and collection rules." action={<button onClick={() => setNotice("A new fee plan can now be configured in this demo.")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" /> Create fee plan</button>} />
      {notice && <DemoNotice message={notice} onClose={() => setNotice("")} />}
      <div className="grid gap-5 lg:grid-cols-3">
        {feePlans.map((plan) => <button key={plan.name} onClick={() => setSelectedPlan(plan.name)} className={`rounded-xl border bg-white p-5 text-left shadow-sm transition ${selectedPlan === plan.name ? "border-blue-500 ring-3 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}><div className="flex items-start justify-between gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><WalletCards className="size-5" /></div><StatusBadge value={plan.status} /></div><h2 className="mt-5 text-base font-bold text-slate-900">{plan.name}</h2><p className="mt-1 text-sm text-slate-500">{plan.grades}</p><p className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{plan.amount}<span className="ml-1 text-sm font-medium text-slate-400">/ year</span></p><div className="mt-5 grid grid-cols-2 border-t border-slate-100 pt-4 text-sm"><div><p className="text-slate-400">Instalments</p><p className="mt-1 font-semibold text-slate-700">{plan.terms}</p></div><div><p className="text-slate-400">Students</p><p className="mt-1 font-semibold text-slate-700">{plan.students}</p></div></div></button>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><SectionTitle title="Collection schedule" description="Middle school plan · Academic year 2026–27" action={<button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Edit schedule</button>} /><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Instalment</th><th className="px-5 py-3">Due date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3 sm:px-6">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{[["Term 1", "15 Apr 2026", "₹9,500", "Paid"], ["Term 2", "15 Jul 2026", "₹9,500", "Paid"], ["Term 3", "15 Oct 2026", "₹9,500", "Pending"], ["Term 4", "15 Jan 2027", "₹9,500", "Draft"]].map(([term, date, amount, status]) => <tr key={term}><td className="px-5 py-4 font-semibold text-slate-800 sm:px-6">{term}</td><td className="px-5 py-4 text-slate-600">{date}</td><td className="px-5 py-4 font-semibold text-slate-800">{amount}</td><td className="px-5 py-4 sm:px-6"><StatusBadge value={status} /></td></tr>)}</tbody></table></div></Card>
        <Card className="p-5 sm:p-6"><h2 className="text-base font-semibold text-slate-900">Fee policy summary</h2><div className="mt-5 space-y-4">{[["Late payment charge", "₹250 after 7 days"], ["Sibling discount", "10% for second child"], ["Scholarship allocation", "42 students"], ["Online payment fee", "Absorbed by school"]].map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-800">{value}</span></div>)}</div><button className="mt-6 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Manage policies</button></Card>
      </div>
    </div>
  )
}

const payments = [
  { receipt: "RCPT-24091", student: "Aarav Sharma", grade: "Grade 10-A", amount: "₹18,500", method: "UPI", date: "14 Sep, 10:42 AM", status: "Paid" },
  { receipt: "RCPT-24090", student: "Diya Patel", grade: "Grade 8-B", amount: "₹14,200", method: "Card", date: "14 Sep, 09:18 AM", status: "Paid" },
  { receipt: "RCPT-24089", student: "Vivaan Gupta", grade: "Grade 12-A", amount: "₹10,000", method: "Net banking", date: "13 Sep, 04:31 PM", status: "Partial" },
  { receipt: "RCPT-24088", student: "Ananya Singh", grade: "Grade 6-C", amount: "₹12,750", method: "UPI", date: "13 Sep, 02:05 PM", status: "Paid" },
  { receipt: "RCPT-24087", student: "Ishaan Verma", grade: "Grade 10-B", amount: "₹8,000", method: "Cash", date: "12 Sep, 12:42 PM", status: "Paid" },
]

export const PaymentsPage = () => {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("All status")
  const filteredPayments = payments.filter((payment) => `${payment.student} ${payment.receipt}`.toLowerCase().includes(query.toLowerCase()) && (status === "All status" || payment.status === status))

  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader eyebrow="Transaction centre" title="Payments" description="Review fee collections and payment methods across all classes." action={<button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"><Download className="size-4" /> Export payments</button>} /><div className="grid gap-4 sm:grid-cols-3">{[["Today’s collection", "₹1,14,650", "12 successful payments"], ["Online payment share", "78.5%", "UPI, card and net banking"], ["Cash collection", "₹24,850", "Logged by accounts office"]].map(([label, value, detail]) => <Card key={label} className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></Card>)}</div><Card><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pl-9`} placeholder="Search receipt or student" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClassName} w-auto`}><option>All status</option><option>Paid</option><option>Partial</option></select></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Receipt</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Method</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 sm:px-6">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredPayments.map((payment) => <tr key={payment.receipt} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold text-blue-600 sm:px-6">{payment.receipt}</td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{payment.student}</p><p className="mt-0.5 text-xs text-slate-400">{payment.grade}</p></td><td className="px-5 py-4 text-slate-600">{payment.method}</td><td className="px-5 py-4 font-semibold text-slate-800">{payment.amount}</td><td className="px-5 py-4 text-slate-600">{payment.date}</td><td className="px-5 py-4 sm:px-6"><StatusBadge value={payment.status} /></td></tr>)}</tbody></table></div></Card></div>
}

const invoices = [
  { number: "INV-2026-143", student: "Vivaan Gupta", term: "Term 3 · Grade 12-A", total: "₹22,000", due: "15 Sep 2026", status: "Overdue" },
  { number: "INV-2026-142", student: "Myra Kapoor", term: "Term 3 · Grade 8-A", total: "₹15,600", due: "15 Sep 2026", status: "Pending" },
  { number: "INV-2026-141", student: "Diya Patel", term: "Term 3 · Grade 8-B", total: "₹9,500", due: "15 Sep 2026", status: "Partial" },
  { number: "INV-2026-140", student: "Aarav Sharma", term: "Term 3 · Grade 10-A", total: "₹18,500", due: "15 Sep 2026", status: "Paid" },
]

export const InvoicesPage = () => {
  const [filter, setFilter] = useState("All")
  const [notice, setNotice] = useState("")
  const visibleInvoices = invoices.filter((invoice) => filter === "All" || invoice.status === filter)
  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader eyebrow="Billing centre" title="Invoices" description="Create, track, and share student fee invoices." action={<button onClick={() => setNotice("Invoice draft created for the demo.")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" /> Create invoice</button>} />{notice && <DemoNotice message={notice} onClose={() => setNotice("")} />}<div className="flex flex-wrap gap-2">{["All", "Pending", "Partial", "Paid", "Overdue"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${filter === item ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{item}{item === "All" ? " invoices" : ""}</button>)}</div><div className="grid gap-4 lg:grid-cols-2">{visibleInvoices.map((invoice) => <Card key={invoice.number} className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><ReceiptText className="size-5" /></div><div><p className="font-bold text-slate-900">{invoice.number}</p><p className="mt-0.5 text-sm text-slate-500">{invoice.student}</p></div></div><StatusBadge value={invoice.status} /></div><div className="mt-5 grid grid-cols-3 border-y border-slate-100 py-4 text-sm"><div><p className="text-slate-400">Fee term</p><p className="mt-1 font-semibold text-slate-700">{invoice.term}</p></div><div><p className="text-slate-400">Amount</p><p className="mt-1 font-semibold text-slate-800">{invoice.total}</p></div><div><p className="text-slate-400">Due date</p><p className="mt-1 font-semibold text-slate-700">{invoice.due}</p></div></div><div className="mt-4 flex items-center justify-between"><button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View invoice</button><button onClick={() => setNotice(`Invoice ${invoice.number} shared with ${invoice.student}.`)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"><Send className="size-4" /> Send</button></div></Card>)}</div></div>
}

const defaulters = [
  { id: "d1", name: "Vivaan Gupta", grade: "Grade 12-A", outstanding: "₹12,500", days: 28, guardian: "Amit Gupta", phone: "+91 98765 09122" },
  { id: "d2", name: "Myra Kapoor", grade: "Grade 8-A", outstanding: "₹15,600", days: 19, guardian: "Sonia Kapoor", phone: "+91 98765 89602" },
  { id: "d3", name: "Ishaan Verma", grade: "Grade 10-B", outstanding: "₹7,200", days: 12, guardian: "Neha Verma", phone: "+91 98765 44819" },
  { id: "d4", name: "Reyansh Jain", grade: "Grade 6-A", outstanding: "₹9,500", days: 8, guardian: "Pankaj Jain", phone: "+91 98765 55034" },
]

export const DefaultersPage = () => {
  const [reminded, setReminded] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const filteredDefaulters = defaulters.filter((student) => student.name.toLowerCase().includes(query.toLowerCase()))
  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader eyebrow="Collections follow-up" title="Defaulters" description="Prioritise overdue fees and contact guardians from one queue." action={<button onClick={() => setReminded(defaulters.map((student) => student.id))} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Send className="size-4" /> Send all reminders</button>} /><div className="grid gap-4 sm:grid-cols-3">{[["Total outstanding", "₹1.32L", "Across 74 invoices"], ["Overdue more than 15 days", "28", "Needs immediate follow-up"], ["Reminders sent today", `${reminded.length}`, "Email and SMS reminders"]].map(([label, value, detail]) => <Card key={label} className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></Card>)}</div><Card><div className="border-b border-slate-100 p-4 sm:p-5"><div className="relative max-w-sm"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pl-9`} placeholder="Search defaulter" /></div></div><div className="divide-y divide-slate-100">{filteredDefaulters.map((student) => { const sent = reminded.includes(student.id); return <div key={student.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-sm font-bold text-rose-700">{student.name.split(" ").map((part) => part[0]).join("")}</div><div><p className="font-semibold text-slate-800">{student.name} <span className="font-normal text-slate-400">· {student.grade}</span></p><p className="mt-1 text-xs text-slate-500">{student.guardian} · {student.phone}</p></div></div><div className="flex flex-wrap items-center gap-5 sm:justify-end"><div><p className="text-xs text-slate-400">Outstanding</p><p className="mt-1 font-bold text-rose-600">{student.outstanding}</p></div><div><p className="text-xs text-slate-400">Overdue</p><p className="mt-1 font-semibold text-slate-700">{student.days} days</p></div><button onClick={() => setReminded((current) => current.includes(student.id) ? current : [...current, student.id])} disabled={sent} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${sent ? "cursor-default bg-emerald-50 text-emerald-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}>{sent ? "Reminder sent" : "Send reminder"}</button></div></div> })}</div></Card></div>
}

const staffMembers = [
  { name: "Nisha Shah", role: "Academic Coordinator", department: "Academics", email: "nisha.shah@school.edu", phone: "+91 98765 12121", status: "Active" },
  { name: "Ravi Malhotra", role: "Accounts Manager", department: "Finance", email: "ravi.malhotra@school.edu", phone: "+91 98765 45454", status: "Active" },
  { name: "Kavya Iyer", role: "English Teacher", department: "Academics", email: "kavya.iyer@school.edu", phone: "+91 98765 77889", status: "Active" },
  { name: "Manish Sethi", role: "Transport Officer", department: "Operations", email: "manish.sethi@school.edu", phone: "+91 98765 22334", status: "Inactive" },
]

export const StaffPage = () => {
  const [query, setQuery] = useState("")
  const visibleStaff = staffMembers.filter((member) => `${member.name} ${member.role} ${member.department}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader eyebrow="Team management" title="Staff" description="Manage school staff, roles, and department access." action={<button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus className="size-4" /> Add staff member</button>} /><div className="grid gap-4 sm:grid-cols-3">{[["Total staff", "86", "12 departments"], ["Teaching staff", "62", "Across all grades"], ["Accounts & operations", "24", "Administration team"]].map(([label, value, detail]) => <Card key={label} className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></Card>)}</div><Card><div className="border-b border-slate-100 p-4 sm:p-5"><div className="relative max-w-sm"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClassName} pl-9`} placeholder="Search staff or department" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3 sm:px-6">Staff member</th><th className="px-5 py-3">Department</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3 sm:px-6">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleStaff.map((member) => <tr key={member.email} className="hover:bg-slate-50/70"><td className="px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">{member.name.split(" ").map((part) => part[0]).join("")}</div><div><p className="font-semibold text-slate-800">{member.name}</p><p className="mt-0.5 text-xs text-slate-400">{member.role}</p></div></div></td><td className="px-5 py-4 text-slate-600">{member.department}</td><td className="px-5 py-4 text-slate-600">{member.email}</td><td className="px-5 py-4 text-slate-600">{member.phone}</td><td className="px-5 py-4 sm:px-6"><StatusBadge value={member.status} /></td></tr>)}</tbody></table></div></Card></div>
}

const notificationHistory = [
  { title: "Term 3 fee reminder", audience: "Parents of Grade 6–12", sent: "Today, 09:00 AM", delivery: "1,149 delivered", status: "Sent" },
  { title: "PTM schedule announcement", audience: "All parents", sent: "12 Sep, 03:30 PM", delivery: "1,207 delivered", status: "Sent" },
  { title: "Fee deadline extension", audience: "Parents with pending invoices", sent: "10 Sep, 11:15 AM", delivery: "274 delivered", status: "Sent" },
]

export const NotificationsPage = () => {
  const [recipient, setRecipient] = useState("Parents with pending invoices")
  const [message, setMessage] = useState("Your Term 3 fee payment is due on 15 September. Please pay through the parent portal to avoid late charges.")
  const [notice, setNotice] = useState("")
  return <div className="mx-auto max-w-7xl space-y-6"><PageHeader eyebrow="Communication centre" title="Notifications" description="Send fee reminders and school updates to parents, students, and staff." /><div className="grid gap-6 xl:grid-cols-5"><Card className="p-5 sm:p-6 xl:col-span-2"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Bell className="size-5" /></div><div><h2 className="font-semibold text-slate-900">Compose notification</h2><p className="mt-0.5 text-sm text-slate-500">Email and in-app delivery</p></div></div><label className="mt-6 block text-sm font-semibold text-slate-700">Recipients<select value={recipient} onChange={(event) => setRecipient(event.target.value)} className={`${inputClassName} mt-2`}><option>Parents with pending invoices</option><option>All parents</option><option>Grade 10 parents</option><option>All staff members</option></select></label><label className="mt-4 block text-sm font-semibold text-slate-700">Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100" /></label><div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-slate-400">{message.length} / 500 characters</p><button onClick={() => setNotice(`Notification sent to ${recipient}.`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Send className="size-4" /> Send now</button></div>{notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">{notice}</p>}</Card><Card className="xl:col-span-3"><SectionTitle title="Recent notifications" description="Delivery status of school communication" /><div className="divide-y divide-slate-100">{notificationHistory.map((item) => <div key={item.title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="font-semibold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.audience}</p></div><div className="flex items-center gap-5"><div className="text-right text-xs"><p className="font-medium text-slate-600">{item.delivery}</p><p className="mt-1 text-slate-400">{item.sent}</p></div><StatusBadge value={item.status} /></div></div>)}</div></Card></div></div>
}

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("School profile")
  const [schoolName, setSchoolName] = useState("Greenfield International School")
  const [email, setEmail] = useState("admin@greenfield.edu")
  const [saved, setSaved] = useState(false)
  const tabs = ["School profile", "Payment preferences", "User roles"]
  return <div className="mx-auto max-w-5xl space-y-6"><PageHeader eyebrow="System configuration" title="Settings" description="Manage your school profile, fee collection preferences, and access controls." /><Card><div className="border-b border-slate-100 px-5 sm:px-6"><div className="flex gap-5 overflow-x-auto">{tabs.map((tab) => <button key={tab} onClick={() => { setActiveTab(tab); setSaved(false) }} className={`border-b-2 py-4 text-sm font-semibold whitespace-nowrap transition ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>{tab}</button>)}</div></div>{activeTab === "School profile" && <div className="p-5 sm:p-6"><div className="flex items-center gap-4 border-b border-slate-100 pb-6"><div className="flex size-14 items-center justify-center rounded-xl bg-blue-600 text-white"><GraduationCap className="size-7" /></div><div><h2 className="font-semibold text-slate-900">School identity</h2><p className="mt-1 text-sm text-slate-500">This information appears on invoices and guardian communication.</p></div></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">School name<input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} className={`${inputClassName} mt-2`} /></label><label className="text-sm font-semibold text-slate-700">School email<input value={email} onChange={(event) => setEmail(event.target.value)} className={`${inputClassName} mt-2`} /></label><label className="text-sm font-semibold text-slate-700">Phone number<input defaultValue="+91 22 4000 1234" className={`${inputClassName} mt-2`} /></label><label className="text-sm font-semibold text-slate-700">Academic year<select defaultValue="2026–27" className={`${inputClassName} mt-2`}><option>2026–27</option><option>2025–26</option></select></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">School address<input defaultValue="24 Lake View Road, Andheri East, Mumbai 400093" className={`${inputClassName} mt-2`} /></label></div><div className="mt-7 flex items-center justify-end gap-3 border-t border-slate-100 pt-5">{saved && <span className="mr-auto text-sm font-semibold text-emerald-600">Changes saved successfully</span>}<button onClick={() => setSaved(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Save className="size-4" /> Save changes</button></div></div>}{activeTab === "Payment preferences" && <div className="space-y-4 p-5 sm:p-6"><h2 className="font-semibold text-slate-900">Payment preferences</h2>{[["Enable UPI payments", "Allow parents to pay with any UPI application"], ["Enable card payments", "Accept debit and credit cards through the parent portal"], ["Send automatic receipts", "Email a receipt when an online payment succeeds"]].map(([title, description]) => <label key={title} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"><span><span className="block text-sm font-semibold text-slate-800">{title}</span><span className="mt-1 block text-sm text-slate-500">{description}</span></span><input type="checkbox" defaultChecked className="toggle toggle-primary" /></label>)}</div>}{activeTab === "User roles" && <div className="divide-y divide-slate-100">{[["Administrator", "Full management and financial access", "2 users"], ["Accounts executive", "Payments, invoices, and reports", "4 users"], ["Academic coordinator", "Student and academic information", "6 users"]].map(([role, description, users]) => <div key={role} className="flex items-center justify-between gap-4 p-5 sm:px-6"><div><p className="font-semibold text-slate-800">{role}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{users}</span></div>)}</div>}</Card></div>
}

const DemoNotice = ({ message, onClose }: { message: string; onClose: () => void }) => <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"><span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> {message}</span><button onClick={onClose} className="text-emerald-700 hover:text-emerald-900">Dismiss</button></div>
