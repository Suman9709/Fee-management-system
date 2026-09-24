import AdminDashboardLayout from "@/layout/AdminDashboardLayout"
import {
  AcademicsPage,
  DefaultersPage,
  FeeManagementPage,
  InvoicesPage,
  NotificationsPage,
  PaymentsPage,
  SettingsPage,
  StaffPage,
  StudentsPage,
} from "@/pages/AdminDemoPages"
import AdminDashboardPage from "@/pages/AdminDashboardPage"
import {  Route, Routes } from "react-router-dom"

export const AdminRoute = () => {
 

  return (
    <Routes>
      <Route element={<AdminDashboardLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="fee-management" element={<FeeManagementPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="defaulters" element={<DefaultersPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
