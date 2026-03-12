import { useGeminiLive } from "./useGeminiLive";

export const WmsDashboard = () => {
  const { startSession, isConnected } = useGeminiLive();
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="text-xl font-bold tracking-tight">
            Vibe<span className="text-blue-600">Logistics</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span> System
            Ready
          </span>
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 grid grid-cols-12 gap-8">
        {/* Left Column: Inventory */}
        <div className="col-span-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-lg">Active Inventory</h2>
              <button className="text-blue-600 text-sm font-medium hover:underline">
                + Add Manual Entry
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Product SKU</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">In Stock</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">VB-ALPHA-01</td>
                  <td className="px-6 py-4 text-sm">A-10-04</td>
                  <td className="px-6 py-4 text-sm">842 units</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Optimal
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm">VB-BETA-09</td>
                  <td className="px-6 py-4 text-sm">B-02-12</td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-600">
                    14 units
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                      Low Stock
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Assistant Entry Point */}
        <div className="col-span-4 space-y-6">
          <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500 rounded-full opacity-50"></div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <span>✨</span> AI Onboarding
              </h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                {isConnected
                  ? "The AI is now watching your screen. Speak naturally to ask for help!"
                  : "First time using VibeLogistics? Our AI Agent can watch your screen and guide you."}
              </p>

              <button
                onClick={startSession} // <--- YOUR STEP 2
                disabled={isConnected}
                className={`w-full font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
                  isConnected
                    ? "bg-green-400 text-green-900 cursor-default"
                    : "bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                {isConnected ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-200 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-800"></span>
                    </span>
                    Agent is Live
                  </>
                ) : (
                  "Start Live Walkthrough"
                )}
              </button>
            </div>
          </div>
          {/* Quick Tips box stays the same below */}
        </div>
      </div>
    </div>
  );
};
