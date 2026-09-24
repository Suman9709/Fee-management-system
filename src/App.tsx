import LoginPage from "@/pages/LoginPage"
import { Route, Routes } from "react-router-dom"
import { AdminRoute } from "./routes/AdminRoute"
const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin/*" element={<AdminRoute />} />
      </Routes>
    </>
  )
}

export default App
