import StaffDashboardLayout from "@/layout/StaffDashboardLayout"
import {
  StaffAttendancePage,
  StaffAnnouncementsPage,
  StaffDashboardPage,
  StaffFeeSetupPage,
  StaffHolidaysPage,
  StaffNotificationsPage,
  StaffInvoicesPage,
  StaffPaymentsPage,
  StaffStudentsPage,
} from "@/pages/StaffPortalPages"
import { Route, Routes } from "react-router-dom"

export const StaffRoute = () => (
  <Routes>
    <Route element={<StaffDashboardLayout />}>
      <Route index element={<StaffDashboardPage />} />
      <Route path="students" element={<StaffStudentsPage />} />
      <Route path="fee-setup" element={<StaffFeeSetupPage />} />
      <Route path="invoices" element={<StaffInvoicesPage />} />
      <Route path="payments" element={<StaffPaymentsPage />} />
      <Route path="attendance" element={<StaffAttendancePage />} />
      <Route path="announcements" element={<StaffAnnouncementsPage />} />
      <Route path="holidays" element={<StaffHolidaysPage />} />
      <Route path="notifications" element={<StaffNotificationsPage />} />
    </Route>
  </Routes>
)
