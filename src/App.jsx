import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import SubStoreStaff from "./pages/SubStoreStaff";
import SubStoreManager from "./pages/SubStoreManager";
import MainStore from "./pages/MainStore";
import MainStoreApprover from "./pages/MainStoreApprover";
import HeadOffice from "./pages/HeadOffice";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";
import MainStoreApprover from "./pages/MainStoreApprover";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
<<<<<<< HEAD
            {/* test? */}
=======

            {/* Sub Store User — creates requests */}
>>>>>>> phase-01
            <Route
              element={
                <ProtectedRoute allowedRoles={["sub-store", "super admin"]} />
              }
            >
              <Route path="/substore-staff" element={<SubStoreStaff />} />
            </Route>

<<<<<<< HEAD
=======
            {/* Sub Store Manager — 1st level approval */}
>>>>>>> phase-01
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["sub-store-approver", "super admin"]}
                />
              }
            >
              <Route path="/substore-manager" element={<SubStoreManager />} />
            </Route>

<<<<<<< HEAD
=======
            {/* Main Store Staff — fulfills approved requests */}
>>>>>>> phase-01
            <Route
              element={
                <ProtectedRoute allowedRoles={["main-store", "super admin"]} />
              }
            >
              <Route path="/mainstore" element={<MainStore />} />
            </Route>

<<<<<<< HEAD
=======
            {/* Main Store Manager — final approval of sub-store requests + approves HO requests */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["main-store-approver", "super admin"]}
                />
              }
            >
              <Route
                path="/mainstore-approver"
                element={<MainStoreApprover />}
              />
            </Route>

            {/* Head Office — creates HO requests, fulfills HO approved requests */}
>>>>>>> phase-01
            <Route
              element={
                <ProtectedRoute allowedRoles={["headoffice", "super admin"]} />
              }
            >
              <Route path="/headoffice" element={<HeadOffice />} />
            </Route>

<<<<<<< HEAD
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["main-store-approver", "super admin"]}
                />
              }
            >
              <Route
                path="/mainstoreapprover"
                element={<MainStoreApprover />}
              />
            </Route>
=======
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
>>>>>>> phase-01
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
