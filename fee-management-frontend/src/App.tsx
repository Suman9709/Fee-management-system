import LoginPage from "@/pages/LoginPage"
import { Route, Routes } from "react-router-dom"
import { AdminRoute } from "./routes/AdminRoute"
import { ParentRoute } from "./routes/ParentRoute"
import { StaffRoute } from "./routes/StaffRoute"
const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminRoute />} />
        <Route path="/staff/*" element={<StaffRoute />} />
        <Route path="/parent/*" element={<ParentRoute />} />
      </Routes>
    </>
  )
}

export default App
