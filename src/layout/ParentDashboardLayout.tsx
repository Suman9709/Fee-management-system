import {
  Bell,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  UsersRound,
  WalletCards,
} from "lucide-react"
import PortalLayout from "./PortalLayout"

const navigationItems = [
  { label: "Dashboard", to: "/parent", icon: LayoutDashboard },
  { label: "My Children", to: "/parent/children", icon: UsersRound },
  { label: "Fees & Payments", to: "/parent/fees", icon: WalletCards },
  { label: "Attendance", to: "/parent/attendance", icon: CalendarDays },
  { label: "Timetable", to: "/parent/timetable", icon: BookOpen },
  { label: "Notices", to: "/parent/notices", icon: Bell },
  { label: "Support", to: "/parent/support", icon: MessageCircle },
]

const ParentDashboardLayout = () => <PortalLayout portalLabel="Parent portal" userName="Rohan Sharma" userRole="Parent / Guardian" initials="RS" drawerId="parent-drawer" navigationItems={navigationItems} />

export default ParentDashboardLayout
