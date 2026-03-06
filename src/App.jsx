import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";

// test
import SubStoreStaff from "./pages/SubStoreStaff";
import SubStoreManager from "./pages/SubStoreManager";
import MainStore from "./pages/MainStore";
import HeadOffice from "./pages/HeadOffice";

// Add route
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            {/* test? */}
            <Route path="/substore-staff" element={<SubStoreStaff />} />
            <Route path="/substore-manager" element={<SubStoreManager />} />
            <Route path="/mainstore" element={<MainStore />} />
            <Route path="/headoffice" element={<HeadOffice />} />
            <Route path="/login" element={<Login />}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
