import { useNavigate } from "react-router";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Visual Icon */}
        <div className="flex justify-center">
          <div className="bg-red-100 p-6 rounded-full">
            <ShieldAlert className="w-16 h-16 text-red-600" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-7xl font-black text-gray-900 tracking-tighter">403</h1>
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-500 text-base">
            Sorry, you don't have the required permissions to view this page. 
            Please contact your administrator if you believe this is a mistake.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-all shadow-md shadow-emerald-200"
          >
            <Home size={18} />
            Return Home
          </button>
        </div>
      </div>

      {/* Subtle Footer */}
      <p className="mt-12 text-sm text-gray-400">
        Logged in as: <span className="font-medium text-gray-600">Authorized User</span>
      </p>
    </div>
  );
};

export default Unauthorized;