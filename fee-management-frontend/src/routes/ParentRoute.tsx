import ParentDashboardLayout from "@/layout/ParentDashboardLayout"
import {
  ParentNoticesPage,
  ParentSupportPage,
  ParentTimetablePage,
} from "@/pages/ParentPortalPages"
import {
  StudentAttendancePage,
  StudentDashboardPage,
  StudentFeesPage,
  StudentProfilePage,
} from "@/pages/StudentPortalPages"
import { Route, Routes } from "react-router-dom"

export const ParentRoute = () => (
  <Routes>
    <Route element={<ParentDashboardLayout />}>
      <Route index element={<StudentDashboardPage />} />
      <Route path="children" element={<StudentProfilePage />} />
      <Route path="fees" element={<StudentFeesPage />} />
      <Route path="attendance" element={<StudentAttendancePage />} />
      <Route path="timetable" element={<ParentTimetablePage />} />
      <Route path="notices" element={<ParentNoticesPage />} />
      <Route path="support" element={<ParentSupportPage />} />
    </Route>
  </Routes>
)
