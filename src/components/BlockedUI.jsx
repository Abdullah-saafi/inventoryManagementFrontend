const BlockedUI = ({ message }) => (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-8 rounded-2xl text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <h2 className="text-white text-xl font-bold mb-2">Access Restricted</h2>
            <p className="text-slate-400 mb-6">{message}</p>
            <button onClick={() => window.location.reload()} className="bg-slate-800 text-white px-6 py-2 rounded-lg text-sm font-semibold">
                Try Again
            </button>
        </div>
    </div>
);
export default BlockedUI;