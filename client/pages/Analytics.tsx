import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sidebar } from "@/components/Sidebar";
import { AnalyticsSkeleton } from "@/components/skeletons";
import { getApiUrl } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Award,
  AlertCircle,
} from "lucide-react";

interface AnalyticsData {
  customerGrowth: Array<{ month: string; newCustomers: number; total: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  topCustomers: Array<{
    id: string;
    name: string;
    email: string;
    totalSpent: number;
    invoiceCount: number;
  }>;
  paymentStats: {
    total: number;
    succeeded: number;
    failed: number;
    successRate: string;
  };
  churnAnalysis: {
    active: number;
    canceled: number;
    total: number;
    churnRate: string;
  };
  revenueByProduct: Array<{ name: string; revenue: number }>;
}

const COLORS = [
  "#8b5cf6",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl("/api/analytics"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const paymentSuccessData = [
    { name: "Succeeded", value: analytics.paymentStats.succeeded },
    { name: "Failed", value: analytics.paymentStats.failed },
  ];

  const churnData = [
    { name: "Active", value: analytics.churnAnalysis.active },
    { name: "Canceled", value: analytics.churnAnalysis.canceled },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">
            Deep insights into your business performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.paymentStats.successRate}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Payments</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.paymentStats.total}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Subs</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.churnAnalysis.active}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Churn Rate</p>
                <p className="text-2xl font-bold text-white">
                  {analytics.churnAnalysis.churnRate}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Revenue Trend (12 Months)
              </h2>
              <p className="text-gray-400 text-sm">
                Monthly revenue over the past year
              </p>
            </div>
            {analytics.revenueByMonth.some((d) => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e1b2e",
                      border: "1px solid #8b5cf6",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: "#8b5cf6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No revenue data yet</p>
                </div>
              </div>
            )}
          </Card>

          {/* Customer Growth */}
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Customer Growth (12 Months)
              </h2>
              <p className="text-gray-400 text-sm">
                New customers acquired each month
              </p>
            </div>
            {analytics.customerGrowth.some((d) => d.newCustomers > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.customerGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    tick={{ fill: "#9ca3af" }}
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e1b2e",
                      border: "1px solid #8b5cf6",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="newCustomers" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No customer data yet</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Success Rate */}
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Payment Success Rate
              </h2>
              <p className="text-gray-400 text-sm">
                Distribution of successful vs failed payments
              </p>
            </div>
            {analytics.paymentStats.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentSuccessData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentSuccessData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#10b981" : "#ef4444"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e1b2e",
                      border: "1px solid #8b5cf6",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No payment data yet</p>
                </div>
              </div>
            )}
          </Card>

          {/* Subscription Churn */}
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Subscription Status
              </h2>
              <p className="text-gray-400 text-sm">
                Active vs canceled subscriptions
              </p>
            </div>
            {analytics.churnAnalysis.total > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={churnData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {churnData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#8b5cf6" : "#f59e0b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e1b2e",
                      border: "1px solid #8b5cf6",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                  <p>No subscription data yet</p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Revenue by Product */}
        {analytics.revenueByProduct.length > 0 && (
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Revenue by Product
              </h2>
              <p className="text-gray-400 text-sm">
                Top performing products by revenue
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueByProduct} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" tick={{ fill: "#9ca3af" }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af" }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e1b2e",
                    border: "1px solid #8b5cf6",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Customers */}
        {analytics.topCustomers.length > 0 && (
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">
                Top Customers
              </h2>
              <p className="text-gray-400 text-sm">
                Your highest value customers
              </p>
            </div>
            <div className="space-y-4">
              {analytics.topCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#25233a]/50 border border-purple-500/10 hover:bg-[#25233a]/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/10">
                      <Award
                        className={`h-5 w-5 ${
                          index === 0
                            ? "text-yellow-400"
                            : index === 1
                            ? "text-gray-300"
                            : index === 2
                            ? "text-amber-600"
                            : "text-purple-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-sm text-gray-400">{customer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">
                      ${customer.totalSpent.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {customer.invoiceCount} invoices
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}
