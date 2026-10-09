import ParentDashboardLayout from "@/layout/ParentDashboardLayout"
import {
  StudentAttendancePage,
  StudentDashboardPage,
  StudentFeesPage,
  StudentProfilePage,
} from "@/pages/StudentPortalPages"
import {
  GuardianAttendancePage,
  GuardianChildrenPage,
  GuardianDashboardPage,
  GuardianFeesPage,
} from "@/pages/GuardianPortalPages"
import {
  StudentHolidaysPage,
  StudentNoticesPage,
  StudentSupportPage,
  StudentTimetablePage,
} from "@/pages/SchoolOperationsPages"
import { Route, Routes } from "react-router-dom"
import { useProfile } from "@/hooks/authHooks/useAuth"
import type { ComponentType } from "react"

const FamilyPortalPage = ({
  GuardianPage,
  StudentPage,
}: {
  GuardianPage: ComponentType
  StudentPage: ComponentType
}) => {
  const { role, isPending } = useProfile()
  if (isPending) return <p className="p-6 text-center">Loading your portal…</p>
  return role === "parent" ? <GuardianPage /> : <StudentPage />
}

export const ParentRoute = () => (
  <Routes>
    <Route element={<ParentDashboardLayout />}>
      <Route index element={<FamilyPortalPage GuardianPage={GuardianDashboardPage} StudentPage={StudentDashboardPage} />} />
      <Route path="children" element={<FamilyPortalPage GuardianPage={GuardianChildrenPage} StudentPage={StudentProfilePage} />} />
      <Route path="fees" element={<FamilyPortalPage GuardianPage={GuardianFeesPage} StudentPage={StudentFeesPage} />} />
      <Route path="attendance" element={<FamilyPortalPage GuardianPage={GuardianAttendancePage} StudentPage={StudentAttendancePage} />} />
      <Route path="timetable" element={<StudentTimetablePage />} />
      <Route path="notices" element={<StudentNoticesPage />} />
      <Route path="holidays" element={<StudentHolidaysPage />} />
      <Route path="support" element={<StudentSupportPage />} />
    </Route>
  </Routes>
)
