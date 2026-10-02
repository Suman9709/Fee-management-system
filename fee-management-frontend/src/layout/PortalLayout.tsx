import {
  Bell,
  LogOut,
  Menu,
  School,
  Search,
} from "lucide-react"
import type { ComponentType } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

export type PortalNavigationItem = {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
}

type PortalLayoutProps = {
  portalLabel: string
  userName: string
  userRole: string
  initials: string
  drawerId: string
  navigationItems: PortalNavigationItem[]
}

const PortalLayout = ({
  portalLabel,
  userName,
  userRole,
  initials,
  drawerId,
  navigationItems,
}: PortalLayoutProps) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activePage = navigationItems.find((item) => item.to === pathname)?.label ?? portalLabel

  return (
    <div className="drawer min-h-screen bg-[#f7f8fc] text-slate-900 lg:drawer-open">
      <input id={drawerId} type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
          <label htmlFor={drawerId} aria-label="Open navigation menu" className="mr-2 inline-flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden">
            <Menu className="size-5" />
          </label>
          <div><p className="text-xs font-medium text-slate-400">{portalLabel}</p><h1 className="mt-0.5 text-base font-semibold text-slate-900">{activePage}</h1></div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <label className="hidden h-10 w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 lg:flex"><Search className="size-4" /><input className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-400" placeholder="Search" /></label>
            <button aria-label="Notifications" className="relative inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"><Bell className="size-[18px]" /><span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-blue-600 ring-2 ring-white" /></button>
            <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2"><span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">{initials}</span><span className="hidden sm:block"><span className="block text-xs font-semibold text-slate-800">{userName}</span><span className="block text-[11px] text-slate-400">{userRole}</span></span></div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>

      <div className="drawer-side z-40">
        <label htmlFor={drawerId} aria-label="Close navigation menu" className="drawer-overlay" />
        <aside className="flex min-h-full w-[272px] flex-col border-r border-slate-800 bg-[#0f172a] shadow-2xl shadow-slate-950/20">
          <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-800 px-5"><div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/40"><School className="size-5" /></div><div className="min-w-0"><p className="truncate text-sm font-bold tracking-tight text-white">Greenfield Academy</p><p className="mt-0.5 text-xs text-slate-400">{portalLabel}</p></div></header>
          <nav className="flex-1 overflow-y-auto px-3 py-6" aria-label={`${portalLabel} navigation`}>
            <p className="mb-2 px-3 text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Workspace</p>
            <ul className="space-y-1">{navigationItems.map(({ label, to, icon: Icon }) => <li key={to}><NavLink to={to} end={to.endsWith("/staff") || to.endsWith("/parent")} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon className="size-[18px] shrink-0" /><span>{label}</span></NavLink></li>)}</ul>
          </nav>
          <div className="border-t border-slate-800 px-3 py-4"><button type="button" onClick={() => navigate("/", { replace: true })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-300"><LogOut className="size-[18px]" /> Log out</button></div>
        </aside>
      </div>
    </div>
  )
}

export default PortalLayout
