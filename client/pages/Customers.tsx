import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { CustomersSkeleton } from "@/components/skeletons";
import {
  Search,
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  Mail,
  Calendar,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  created: string;
  totalSpent: number;
  subscriptionStatus: string;
  subscriptionCount: number;
  invoiceCount: number;
  currency: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomers(data.customers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "trialing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "past_due":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "canceled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (c) => c.subscriptionStatus === "active"
  ).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgRevenuePerCustomer =
    totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  if (loading) {
    return <CustomersSkeleton />;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0e1a] via-[#1a1625] to-[#0f0e1a]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Customers</h1>
          <p className="text-gray-400">Manage and view your customer base</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-white">{totalCustomers}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-white">{activeCustomers}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <CreditCard className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Revenue</p>
                <p className="text-2xl font-bold text-white">
                  ${avgRevenuePerCustomer.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#25233a]/50 border-purple-500/20 text-white placeholder:text-gray-500"
            />
          </div>
        </Card>

        {/* Customers List */}
        {filteredCustomers.length === 0 ? (
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Users className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? "No customers found" : "No customers yet"}
              </h3>
              <p className="text-gray-400 max-w-md">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Customers will appear here once you start receiving payments"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className="bg-[#1e1b2e]/50 border-purple-500/20 p-6 hover:bg-[#25233a]/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Users className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {customer.name}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400">
                          <Mail className="h-4 w-4" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300">
                          Joined{" "}
                          {new Date(customer.created).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge className={getStatusBadgeColor(customer.subscriptionStatus)}>
                        {customer.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-row lg:flex-col gap-6 lg:gap-3 lg:items-end">
                    <div className="text-center lg:text-right">
                      <p className="text-sm text-gray-400 mb-1">Total Spent</p>
                      <p className="text-xl font-bold text-white">
                        ${customer.totalSpent.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">Subscriptions</p>
                        <p className="text-lg font-semibold text-purple-400">
                          {customer.subscriptionCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">Invoices</p>
                        <p className="text-lg font-semibold text-blue-400">
                          {customer.invoiceCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
