import LoginPage from "@/pages/LoginPage"
import { Route, Routes } from "react-router-dom"
import { AdminRoute } from "./routes/AdminRoute"
import { ParentRoute } from "./routes/ParentRoute"
import { ProtectedRoute } from "./routes/ProtectedRoute"
import { StaffRoute } from "./routes/StaffRoute"
const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/*"
          element={
            <ProtectedRoute allowedRoles={["staff"]}>
              <StaffRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/*"
          element={
            <ProtectedRoute allowedRoles={["parent", "student"]}>
              <ParentRoute />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
