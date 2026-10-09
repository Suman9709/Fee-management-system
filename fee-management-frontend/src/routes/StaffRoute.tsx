import StaffDashboardLayout from "@/layout/StaffDashboardLayout"
import { CreateStudentPage } from "@/pages/CreateStudentPage"
import { StaffStudentSettingsPage } from "@/pages/StaffStudentSettingsPage"
import {
  LiveInvoicesPage,
  LivePaymentsPage,
  LiveStudentDirectoryPage,
  StaffFeeSetupReadOnlyPage,
} from "@/pages/FeeOperationsPages"
import {
  StaffAttendancePage,
  StaffAnnouncementsPage,
  StaffDashboardPage,
  StaffHolidaysPage,
  StaffNotificationsPage,
} from "@/pages/StaffPortalPages"
import { Route, Routes } from "react-router-dom"

export const StaffRoute = () => (
  <Routes>
    <Route element={<StaffDashboardLayout />}>
      <Route index element={<StaffDashboardPage />} />
      <Route path="students" element={<LiveStudentDirectoryPage portal="staff" />} />
      <Route path="students/new" element={<CreateStudentPage portal="staff" />} />
      <Route path="student-setup" element={<StaffStudentSettingsPage />} />
      <Route path="fee-setup" element={<StaffFeeSetupReadOnlyPage />} />
      <Route path="invoices" element={<LiveInvoicesPage />} />
      <Route path="payments" element={<LivePaymentsPage />} />
      <Route path="attendance" element={<StaffAttendancePage />} />
      <Route path="announcements" element={<StaffAnnouncementsPage />} />
      <Route path="holidays" element={<StaffHolidaysPage />} />
      <Route path="notifications" element={<StaffNotificationsPage />} />
    </Route>
  </Routes>
)
