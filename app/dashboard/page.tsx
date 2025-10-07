
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
      <p className="text-blue-200 mb-8">Welcome to Prism Capital Dashboard</p>
      
      {/* Dashboard content will go here */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="backdrop-blur-xl bg-white/10 p-6 rounded-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-2 text-white">Portfolio Value</h3>
          <p className="text-2xl font-bold text-blue-400">$0.00</p>
        </div>
        
        <div className="backdrop-blur-xl bg-white/10 p-6 rounded-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-2 text-white">Total P/L</h3>
          <p className="text-2xl font-bold text-green-400">$0.00</p>
        </div>
        
        <div className="backdrop-blur-xl bg-white/10 p-6 rounded-lg border border-white/20">
          <h3 className="text-lg font-semibold mb-2 text-white">Active Positions</h3>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
      </div>
    </div>
  );
}