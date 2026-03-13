import { useRef, useState } from "react";
import { useGeminiLive } from "./useGeminiLive";

interface InventoryItem {
  id: string;
  sku: string;
  location: string;
  inStock: number;
  status: "Optimal" | "Low Stock" | "Checking...";
}

export const WmsDashboard = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { startSession, isConnected, volume, status } = useGeminiLive();

  // 1. Dynamic Inventory State
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([
    {
      id: "1",
      sku: "VB-ALPHA-01",
      location: "A-10-04",
      inStock: 842,
      status: "Optimal",
    },
    {
      id: "2",
      sku: "VB-BETA-09",
      location: "B-02-12",
      inStock: 14,
      status: "Low Stock",
    },
  ]);

  const handleFieldChange = (
    id: string,
    field: keyof InventoryItem,
    value: string | number,
  ) => {
    setInventoryData((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updatedItem = { ...item, [field]: value };

        // Auto-update status if stock changes
        if (field === "inStock") {
          const numValue = Number(value);
          updatedItem.status = numValue < 20 ? "Low Stock" : "Optimal";
        }

        return updatedItem;
      }),
    );
  };

  const handleDeleteEntry = (id: string) => {
    setInventoryData((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddEntry = () => {
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      sku: "VB-NEW-X",
      location: "Z-00-00",
      inStock: 0,
      status: "Low Stock",
    };
    setInventoryData((prev) => [...prev, newItem]);
  };

  // Terminal Status Mapping
  const getStatusLabel = () => {
    if (!isConnected) return "OFFLINE";
    switch (status) {
      case "listening":
        return "LISTENING...";
      case "thinking":
        return "THINKING...";
      case "speaking":
        return "BEACON RESPONDING";
      default:
        return "STANDBY";
    }
  };

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
              <button
                onClick={handleAddEntry}
                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Manual Entry
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Product SKU</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">In Stock</th>
                  <th className="px-6 py-3 font-medium w-36">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryData.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) =>
                          handleFieldChange(item.id, "sku", e.target.value)
                        }
                        className="w-full bg-transparent font-mono text-sm border-none focus:ring-1 focus:ring-blue-200 rounded px-1 -ml-1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) =>
                          handleFieldChange(item.id, "location", e.target.value)
                        }
                        className="w-full bg-transparent text-sm border-none focus:ring-1 focus:ring-blue-200 rounded px-1 -ml-1"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <input
                        type="number"
                        value={item.inStock}
                        onChange={(e) =>
                          handleFieldChange(item.id, "inStock", e.target.value)
                        }
                        className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <span className="ml-2 text-slate-400">units</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          item.status === "Optimal"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteEntry(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Delete entry"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
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
                <span>✨</span> Beacon AI
              </h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                {isConnected
                  ? "Beacon is watching and listening. Ask about your inventory!"
                  : "First time using VibeLogistics? Our AI Agent can watch your screen and guide you."}
              </p>

              {/* --- VISUALIZER SECTION --- */}
              {isConnected && (
                <div className="mb-6 flex items-center justify-between bg-blue-700/50 p-4 rounded-xl border border-blue-400/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 items-end h-6 w-12">
                      {/* Dynamic Bars */}
                      <div
                        className="w-1.5 bg-cyan-300 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(15, volume * 0.6)}%` }}
                      ></div>
                      <div
                        className="w-1.5 bg-white rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(25, volume * 1.5)}%` }}
                      ></div>
                      <div
                        className="w-1.5 bg-cyan-300 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(15, volume * 0.8)}%` }}
                      ></div>
                      <div
                        className="w-1.5 bg-white rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(20, volume * 1.2)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold tracking-widest text-cyan-200 uppercase animate-pulse">
                      Live Input
                    </span>
                  </div>
                  <div className="text-[10px] bg-blue-500/50 px-2 py-1 rounded md:block hidden font-mono">
                    PCM 16kHz
                  </div>
                </div>
              )}
              {/* --- END VISUALIZER --- */}

              <button
                onClick={() => startSession(videoRef.current!)}
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
                    Beacon is Active
                  </>
                ) : (
                  "Start Live Walkthrough"
                )}
              </button>
            </div>
          </div>

          {/* AI Terminal Section */}
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Beacon Brain Feed
              </h4>
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-slate-700"}`}
              ></div>
            </div>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <span className="text-blue-400 font-bold">[STATUS]:</span>
                  <span className="text-slate-300">
                    <span className="mr-2 font-bold">{getStatusLabel()}</span>
                    {isConnected && (
                      <>
                        {status === "listening" && "👂 I'm listening..."}
                        {status === "thinking" && "🧠 Thinking..."}
                        {status === "speaking" && "📢 Responding..."}
                        {status === "idle" && "✨ Standing by..."}
                      </>
                    )}
                  </span>
                </div>

                {/* Terminal Waveform */}
                {isConnected && (
                  <div className="flex gap-0.5 items-center h-4 mt-1">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-cyan-500/40 rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(10, Math.random() * volume * 2)}%`,
                          opacity: volume > 1 ? 0.8 : 0.2,
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-32 overflow-y-auto text-[11px] text-slate-500 border-t border-slate-800 pt-2 space-y-1">
                <p> [SYSTEM]: Initializing Vision Engine...</p>
                <p> [SYSTEM]: Neural link established</p>
                {isConnected && (
                  <p className="text-green-500">
                    {" "}
                    [SYSTEM]: Tracking screen updates
                  </p>
                )}
                {status === "speaking" && (
                  <p className="text-cyan-400 font-bold">
                    {" "}
                    [STREAM]: Generating audio...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sight: Hidden video element for screen capture */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
