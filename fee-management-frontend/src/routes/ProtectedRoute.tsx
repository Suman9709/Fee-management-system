import type { UserRole } from "@/api/adminApi/adminApi"
import { useCurrentUser } from "@/hooks/authHooks/useAuth"
import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  children: ReactNode
}

const portalForRole: Record<UserRole, string> = {
  admin: "/admin",
  staff: "/staff",
  parent: "/parent",
  // Student accounts share the family portal with their linked guardian.
  student: "/parent",
  user: "/",
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const location = useLocation()
  const { data: currentUser, isPending, isError } = useCurrentUser()

  if (isPending) {
    return <p className="p-6 text-center">Checking your session…</p>
  }

  if (isError || !currentUser?.authenticated) {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={portalForRole[currentUser.role]} replace />
  }

  return <>{children}</>
}
