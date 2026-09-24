import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  MoreHorizontal,
  ReceiptText,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react"

const overviewCards = [
  {
    label: "Fee collected",
    value: "₹8,42,600",
    comparison: "+12.5%",
    note: "vs. August 2026",
    icon: WalletCards,
    iconStyle: "bg-blue-50 text-blue-600",
    comparisonStyle: "text-emerald-600",
    direction: "up",
  },
  {
    label: "Collection rate",
    value: "86.4%",
    comparison: "+4.2%",
    note: "of current-term fees",
    icon: TrendingUp,
    iconStyle: "bg-emerald-50 text-emerald-600",
    comparisonStyle: "text-emerald-600",
    direction: "up",
  },
  {
    label: "Outstanding fees",
    value: "₹1,32,400",
    comparison: "-8.1%",
    note: "74 invoices pending",
    icon: CircleAlert,
    iconStyle: "bg-amber-50 text-amber-600",
    comparisonStyle: "text-emerald-600",
    direction: "down",
  },
  {
    label: "Active students",
    value: "1,248",
    comparison: "+34",
    note: "enrolled this year",
    icon: UsersRound,
    iconStyle: "bg-violet-50 text-violet-600",
    comparisonStyle: "text-emerald-600",
    direction: "up",
  },
]

const monthlyCollections = [
  { month: "Apr", collected: 64, target: 70, amount: "₹6.4L" },
  { month: "May", collected: 72, target: 72, amount: "₹7.2L" },
  { month: "Jun", collected: 78, target: 76, amount: "₹7.8L" },
  { month: "Jul", collected: 71, target: 82, amount: "₹7.1L" },
  { month: "Aug", collected: 83, target: 86, amount: "₹8.3L" },
  { month: "Sep", collected: 92, target: 94, amount: "₹8.4L" },
]

const recentTransactions = [
  { initials: "AS", student: "Aarav Sharma", className: "Grade 10-A", amount: "₹18,500", method: "UPI", time: "10:42 AM" },
  { initials: "DP", student: "Diya Patel", className: "Grade 8-B", amount: "₹14,200", method: "Card", time: "09:18 AM" },
  { initials: "AG", student: "Ananya Gupta", className: "Grade 6-C", amount: "₹12,750", method: "UPI", time: "Yesterday" },
  { initials: "IV", student: "Ishaan Verma", className: "Grade 10-B", amount: "₹8,000", method: "Cash", time: "Yesterday" },
]

const classCollection = [
  { name: "Grade 12", amount: "₹2.18L", rate: 94, color: "bg-blue-600" },
  { name: "Grade 10", amount: "₹2.14L", rate: 92, color: "bg-indigo-500" },
  { name: "Grade 8", amount: "₹1.78L", rate: 87, color: "bg-sky-500" },
  { name: "Grade 6", amount: "₹1.46L", rate: 78, color: "bg-amber-400" },
]

const DashboardCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>{children}</section>
)

const AdminDashboardPage = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Monday, 14 September 2026</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">Good morning, Priya</h2>
          <p className="mt-1.5 text-sm text-slate-500">Here is a quick view of your school’s fee collection performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"><CalendarDays className="size-4" /> This term <ChevronDown className="size-4 text-slate-400" /></button>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"><Download className="size-4" /> <span className="hidden sm:inline">Download report</span></button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map(({ label, value, comparison, note, icon: Icon, iconStyle, comparisonStyle, direction }) => (
          <DashboardCard key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div className={`flex size-10 items-center justify-center rounded-xl ${iconStyle}`}><Icon className="size-5" /></div>
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${comparisonStyle}`}>{direction === "up" ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{comparison}</span>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1.5 text-xs text-slate-400">{note}</p>
          </DashboardCard>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <DashboardCard className="p-5 sm:p-6 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="text-base font-semibold text-slate-900">Collection performance</h3><p className="mt-1 text-sm text-slate-500">Monthly collection compared with the planned target</p></div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-600" /> Collected</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-slate-200" /> Target</span></div>
          </div>
          <div className="mt-8 flex h-56 items-end justify-between gap-3 sm:gap-5">
            {monthlyCollections.map(({ month, collected, target, amount }) => (
              <div key={month} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="relative mx-auto flex h-44 w-full max-w-12 items-end rounded-t-lg bg-slate-100 sm:max-w-14">
                  <div className="absolute bottom-0 w-full rounded-t-lg bg-blue-600 transition-all group-hover:bg-blue-700" style={{ height: `${collected}%` }} />
                  <div className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-lg group-hover:block">{amount}</div>
                  <span className="absolute left-1/2 h-0.5 w-[calc(100%+10px)] -translate-x-1/2 bg-slate-300" style={{ bottom: `${target}%` }} />
                </div>
                <p className="mt-3 text-center text-xs font-medium text-slate-500">{month}</p>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard className="p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between"><div><h3 className="text-base font-semibold text-slate-900">Payment health</h3><p className="mt-1 text-sm text-slate-500">Current term fee status</p></div><button aria-label="More payment health actions" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"><MoreHorizontal className="size-5" /></button></div>
          <div className="mt-6 flex items-center gap-6">
            <div role="img" aria-label="72 percent fees paid" className="flex size-32 shrink-0 items-center justify-center rounded-full p-3" style={{ background: "conic-gradient(#2563eb 0 72%, #fbbf24 72% 88%, #f43f5e 88% 100%)" }}><div className="flex size-full flex-col items-center justify-center rounded-full bg-white"><strong className="text-xl tracking-tight text-slate-900">72%</strong><span className="mt-0.5 text-[10px] font-medium text-slate-500">PAID</span></div></div>
            <div className="min-w-0 flex-1 space-y-3.5">
              <StatusLine label="Paid" detail="899 students" value="72%" color="bg-blue-600" />
              <StatusLine label="Partial" detail="200 students" value="16%" color="bg-amber-400" />
              <StatusLine label="Overdue" detail="149 students" value="12%" color="bg-rose-500" />
            </div>
          </div>
          <div className="mt-7 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5"><div className="flex gap-3"><div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm"><CheckCircle2 className="size-4" /></div><div><p className="text-sm font-semibold text-blue-950">Collection is on track</p><p className="mt-0.5 text-xs leading-5 text-blue-700">You are ₹18,400 away from this month’s collection target.</p></div></div></div>
        </DashboardCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <DashboardCard className="overflow-hidden xl:col-span-3">
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><h3 className="text-base font-semibold text-slate-900">Recent collections</h3><p className="mt-1 text-sm text-slate-500">Latest payments received today</p></div><button className="text-sm font-semibold text-blue-600 transition hover:text-blue-700">View all</button></div>
          <div className="divide-y divide-slate-100">{recentTransactions.map((transaction) => <div key={transaction.student} className="flex items-center gap-3 px-5 py-4 sm:px-6"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{transaction.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{transaction.student}</p><p className="mt-0.5 text-xs text-slate-400">{transaction.className} · {transaction.method}</p></div><div className="text-right"><p className="text-sm font-bold text-slate-800">{transaction.amount}</p><p className="mt-0.5 text-xs text-slate-400">{transaction.time}</p></div></div>)}</div>
        </DashboardCard>
        <DashboardCard className="p-5 sm:p-6 xl:col-span-2">
          <div className="flex items-start justify-between"><div><h3 className="text-base font-semibold text-slate-900">Class collection</h3><p className="mt-1 text-sm text-slate-500">Highest performing grades</p></div><ReceiptText className="size-5 text-slate-400" /></div>
          <div className="mt-6 space-y-5">{classCollection.map((item) => <div key={item.name}><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-slate-700">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">{item.amount} collected</p></div><span className="text-sm font-bold text-slate-800">{item.rate}%</span></div><div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.rate}%` }} /></div></div>)}</div>
          <button className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-700">View collection report <ArrowUpRight className="size-4" /></button>
        </DashboardCard>
      </div>
    </div>
  )
}

const StatusLine = ({ label, detail, value, color }: { label: string; detail: string; value: string; color: string }) => <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><i className={`size-2.5 rounded-full ${color}`} /><div><p className="text-xs font-semibold text-slate-700">{label}</p><p className="text-[11px] text-slate-400">{detail}</p></div></div><span className="text-xs font-bold text-slate-700">{value}</span></div>

export default AdminDashboardPage
