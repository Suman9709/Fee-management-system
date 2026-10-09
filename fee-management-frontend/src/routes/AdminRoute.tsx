import AdminDashboardLayout from "@/layout/AdminDashboardLayout"
import { CreateStudentPage } from "@/pages/CreateStudentPage"
import { FeeConfigurationPage } from "@/pages/FeeConfigurationPage"
import {
  SettingsPage,
  StaffPage,
} from "@/pages/AdminDemoPages"
import {
  LiveDefaultersPage,
  LiveFeeDashboardPage,
  LiveInvoicesPage,
  LivePaymentsPage,
  LiveStudentDirectoryPage,
  PaymentCorrectionsPage,
} from "@/pages/FeeOperationsPages"
import { AnnouncementManagementPage, TimetableManagementPage } from "@/pages/SchoolOperationsPages"
import { GuardianManagementPage } from "@/pages/GuardianPortalPages"
import {  Route, Routes } from "react-router-dom"

export const AdminRoute = () => {
 

  return (
    <Routes>
      <Route element={<AdminDashboardLayout />}>
        <Route index element={<LiveFeeDashboardPage />} />
        <Route path="students" element={<LiveStudentDirectoryPage portal="admin" />} />
        <Route path="students/new" element={<CreateStudentPage portal="admin" />} />
        <Route path="parents" element={<GuardianManagementPage />} />
        <Route path="academics" element={<TimetableManagementPage />} />
        <Route path="fee-management" element={<FeeConfigurationPage />} />
        <Route path="payments" element={<LivePaymentsPage />} />
        <Route path="payments/corrections" element={<PaymentCorrectionsPage />} />
        <Route path="invoices" element={<LiveInvoicesPage />} />
        <Route path="defaulters" element={<LiveDefaultersPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="notifications" element={<AnnouncementManagementPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
