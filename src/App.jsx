import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";

// test
import SubStoreStaff from "./pages/SubStoreStaff";
import SubStoreManager from "./pages/SubStoreManager";
import MainStore from "./pages/MainStore";
import MainStoreApprover from "./pages/MainStoreApprover";
import HeadOffice from "./pages/HeadOffice";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";

// Add route
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            {/* test? */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["sub-store", "super admin"]} />
              }
            >
              <Route path="/substore-staff" element={<SubStoreStaff />} />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["sub-store-approver", "super admin"]}
                />
              }
            >
              <Route path="/substore-manager" element={<SubStoreManager />} />
            </Route>

            <Route
              element={
                <ProtectedRoute allowedRoles={["main-store", "super admin"]} />
              }
            >
              <Route path="/mainstore" element={<MainStore />} />
            </Route>

            <Route path="/substoreapprover" element={<MainStoreApprover />} />

            <Route
              element={
                <ProtectedRoute allowedRoles={["headoffice", "super admin"]} />
              }
            >
              <Route path="/headoffice" element={<HeadOffice />} />
            </Route>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
