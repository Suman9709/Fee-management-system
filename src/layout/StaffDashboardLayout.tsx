import {
  Bell,
  ClipboardCheck,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Megaphone,
  ReceiptText,
  UsersRound,
  WalletCards,
} from "lucide-react"
import PortalLayout from "./PortalLayout"

const navigationItems = [
  { label: "Dashboard", to: "/staff", icon: LayoutDashboard },
  { label: "Student Records", to: "/staff/students", icon: UsersRound },
  { label: "Fee Setup", to: "/staff/fee-setup", icon: WalletCards },
  { label: "Invoices & Billing", to: "/staff/invoices", icon: FileText },
  { label: "Payments", to: "/staff/payments", icon: ReceiptText },
  { label: "Monthly Attendance", to: "/staff/attendance", icon: ClipboardCheck },
  { label: "Announcements", to: "/staff/announcements", icon: Megaphone },
  { label: "School Holidays", to: "/staff/holidays", icon: CalendarDays },
  { label: "Notifications", to: "/staff/notifications", icon: Bell },
]

const StaffDashboardLayout = () => <PortalLayout portalLabel="Office staff workspace" userName="Kavita Patel" userRole="Office staff" initials="KP" drawerId="staff-drawer" navigationItems={navigationItems} />

export default StaffDashboardLayout
