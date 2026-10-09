import { useLogout } from "@/hooks/authHooks/useAuth"
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ReceiptText,
  School,
  Search,
  UserRoundCog,
  UsersRound,
  WalletCards,
} from "lucide-react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

const navigationItems = [
  { label: "Dashboard", to: "/staff", icon: LayoutDashboard },
  { label: "Student Records", to: "/staff/students", icon: UsersRound },
  { label: "Parent Accounts", to: "/staff/parents", icon: UsersRound },
  { label: "Student Setup", to: "/staff/student-setup", icon: UserRoundCog },
  { label: "Fee Setup", to: "/staff/fee-setup", icon: WalletCards },
  { label: "Invoices & Billing", to: "/staff/invoices", icon: FileText },
  { label: "Payments", to: "/staff/payments", icon: ReceiptText },
  { label: "Payment Corrections", to: "/staff/payments/corrections", icon: ReceiptText },
  { label: "Monthly Attendance", to: "/staff/attendance", icon: ClipboardCheck },
  { label: "Academic Timetable", to: "/staff/timetable", icon: BookOpen },
  { label: "Announcements", to: "/staff/announcements", icon: Megaphone },
  { label: "School Holidays", to: "/staff/holidays", icon: CalendarDays },
  { label: "Notifications", to: "/staff/notifications", icon: Bell },
]

const pageTitles: Record<string, string> = {
  "/staff/students/new": "Add student",
}

const StaffDashboardLayout = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activePage = pageTitles[pathname] ?? navigationItems.find((item) => item.to === pathname)?.label ?? "Office staff workspace"
  const { mutateAsync: logout, isPending: isLoggingOut, isError: logoutFailed } = useLogout()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/", { replace: true })
    } catch {
      // Do not navigate away if the server session could not be ended.
    }
  }

  return (
    <div className="drawer min-h-screen bg-[#f7f8fc] text-slate-900 lg:drawer-open">
      <input id="staff-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-18 shrink-0 items-center border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
          <label htmlFor="staff-drawer" aria-label="Open navigation menu" className="mr-2 inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden">
            <Menu className="size-5" />
          </label>
          <div>
            <p className="text-xs font-medium text-slate-400">Office staff workspace</p>
            <h1 className="mt-0.5 text-base font-semibold text-slate-900">{activePage}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="hidden h-10 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 lg:flex">
              <Search className="size-4" />
              <input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400" placeholder="Search" />
            </label>
            <button aria-label="Notifications" className="relative inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
              <Bell className="size-[18px]" />
              <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">KP</span>
              <span className="hidden sm:block"><span className="block text-xs font-semibold text-slate-800">Kavita Patel</span><span className="block text-[11px] text-slate-400">Office staff</span></span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor="staff-drawer" aria-label="Close navigation menu" className="drawer-overlay" />
        <aside className="flex min-h-full w-68 flex-col border-r border-slate-800 bg-[#0f172a] shadow-2xl shadow-slate-950/20">
          <header className="flex h-18 shrink-0 items-center gap-3 border-b border-slate-800 px-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/40"><School className="size-5" /></div>
            <div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight text-white">Greenfield Academy</p><p className="mt-0.5 text-xs text-slate-400">Office staff workspace</p></div>
          </header>
          <nav className="flex-1 overflow-y-auto px-3 py-6" aria-label="Staff navigation">
            <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Workspace</p>
            <ul className="space-y-1">
              {navigationItems.map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === "/staff"}
                    className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-slate-800 px-3 py-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="size-[18px]" />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
            {logoutFailed && <p className="mt-2 px-3 text-xs text-rose-300" role="alert">Logout failed. Please try again.</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default StaffDashboardLayout
