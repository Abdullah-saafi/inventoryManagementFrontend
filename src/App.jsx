import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import SubStoreStaff from "./pages/SubStoreStaff";
import SubStoreManager from "./pages/SubStoreManager";
import MainStore from "./pages/MainStore";
import MainStoreApprover from "./pages/MainStoreApprover";
import HeadOffice from "./pages/HeadOffice";
import ProtectedRoute from "./components/ProtectedRoute";
import AddUser from "./pages/Admin";
import Unauthorized from "./pages/Unauthorized";
import { ContextProvider } from "./context/authContext";
import AddStore from "./pages/AddStore";
import StoreList from "./pages/StoreList";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <ContextProvider>
        <div className="min-h-screen bg-gray-50 text-gray-900">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Sub Store User — creates requests */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["sub-store", "super admin"]} />
                }
              >
                <Route path="/substore-staff" element={<SubStoreStaff />} />
              </Route>

              {/* Sub Store Manager — 1st level approval */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["sub-store-approver", "super admin"]}
                  />
                }
              >
                <Route path="/substore-manager" element={<SubStoreManager />} />
              </Route>

              {/* Main Store Staff — fulfills approved requests */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["main-store", "super admin"]} />
                }
              >
                <Route path="/mainstore" element={<MainStore />} />
              </Route>

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
              <Route
                element={
                  <ProtectedRoute allowedRoles={["headoffice", "super admin"]} />
                }
              >
                <Route path="/headoffice" element={<HeadOffice />} />
              </Route>

              {/* Admin — create users and sub stores */}
              <Route
                element={
                  <ProtectedRoute allowedRoles={["admin", "super admin"]} />
                }
              >
                <Route path="/admin" element={<Admin />} />
              </Route>

              <Route path="/add-store" element={<AddStore/>}/>

              <Route path="/all-stores" element={<StoreList/>}/>


              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </ContextProvider>
    </BrowserRouter >
  );
}