import StaffDashboardLayout from "@/layout/StaffDashboardLayout"
import { CreateStudentPage } from "@/pages/CreateStudentPage"
import { StaffStudentSettingsPage } from "@/pages/StaffStudentSettingsPage"
import {
  LiveInvoicesPage,
  LivePaymentsPage,
  LiveStudentDirectoryPage,
  PaymentCorrectionsPage,
  StaffFeeSetupReadOnlyPage,
} from "@/pages/FeeOperationsPages"
import {
  AnnouncementManagementPage,
  HolidayManagementPage,
  TimetableManagementPage,
} from "@/pages/SchoolOperationsPages"
import { GuardianManagementPage } from "@/pages/GuardianPortalPages"
import {
  StaffAttendancePage,
  StaffDashboardPage,
} from "@/pages/StaffPortalPages"
import { Route, Routes } from "react-router-dom"

export const StaffRoute = () => (
  <Routes>
    <Route element={<StaffDashboardLayout />}>
      <Route index element={<StaffDashboardPage />} />
      <Route path="students" element={<LiveStudentDirectoryPage portal="staff" />} />
      <Route path="students/new" element={<CreateStudentPage portal="staff" />} />
      <Route path="parents" element={<GuardianManagementPage />} />
      <Route path="student-setup" element={<StaffStudentSettingsPage />} />
      <Route path="fee-setup" element={<StaffFeeSetupReadOnlyPage />} />
      <Route path="invoices" element={<LiveInvoicesPage />} />
      <Route path="payments" element={<LivePaymentsPage />} />
      <Route path="payments/corrections" element={<PaymentCorrectionsPage />} />
      <Route path="attendance" element={<StaffAttendancePage />} />
      <Route path="announcements" element={<AnnouncementManagementPage />} />
      <Route path="holidays" element={<HolidayManagementPage />} />
      <Route path="timetable" element={<TimetableManagementPage />} />
      <Route path="notifications" element={<AnnouncementManagementPage />} />
    </Route>
  </Routes>
)
