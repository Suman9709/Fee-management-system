import ParentDashboardLayout from "@/layout/ParentDashboardLayout"
import {
  ParentAttendancePage,
  ParentChildrenPage,
  ParentDashboardPage,
  ParentFeesPage,
  ParentNoticesPage,
  ParentSupportPage,
  ParentTimetablePage,
} from "@/pages/ParentPortalPages"
import { Route, Routes } from "react-router-dom"

export const ParentRoute = () => (
  <Routes>
    <Route element={<ParentDashboardLayout />}>
      <Route index element={<ParentDashboardPage />} />
      <Route path="children" element={<ParentChildrenPage />} />
      <Route path="fees" element={<ParentFeesPage />} />
      <Route path="attendance" element={<ParentAttendancePage />} />
      <Route path="timetable" element={<ParentTimetablePage />} />
      <Route path="notices" element={<ParentNoticesPage />} />
      <Route path="support" element={<ParentSupportPage />} />
    </Route>
  </Routes>
)
