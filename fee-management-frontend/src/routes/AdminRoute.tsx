import AdminDashboardLayout from "@/layout/AdminDashboardLayout"
import { CreateStudentPage } from "@/pages/CreateStudentPage"
import { FeeConfigurationPage } from "@/pages/FeeConfigurationPage"
import {
  AcademicsPage,
  DefaultersPage,
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
        <Route path="students/new" element={<CreateStudentPage portal="admin" />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="fee-management" element={<FeeConfigurationPage />} />
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
