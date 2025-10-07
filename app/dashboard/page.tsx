
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <p className="text-gray-600">Welcome to Prism Capital Dashboard</p>
      
      {/* Dashboard content will go here */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Portfolio Value</h3>
          <p className="text-2xl font-bold text-blue-600">$0.00</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total P/L</h3>
          <p className="text-2xl font-bold text-green-600">$0.00</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Positions</h3>
          <p className="text-2xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  );
}