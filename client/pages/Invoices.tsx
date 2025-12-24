import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import { InvoicesSkeleton } from "@/components/skeletons";
import { getApiUrl } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
} from "lucide-react";

interface Invoice {
  id: string;
  number: string;
  customer: string;
  customerEmail: string;
  customerId: string;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  status: string;
  dueDate: string | null;
  created: string;
  currency: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const baseUrl = getApiUrl("/api/invoices");
      const url = new URL(baseUrl, window.location.origin);
      if (statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoices");
      }

      const data = await response.json();
      setInvoices(data.invoices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "Paid",
        };
      case "open":
        return {
          icon: <Clock className="h-4 w-4" />,
          className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "Open",
        };
      case "void":
        return {
          icon: <XCircle className="h-4 w-4" />,
          className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          label: "Void",
        };
      case "uncollectible":
        return {
          icon: <XCircle className="h-4 w-4" />,
          className: "bg-red-500/10 text-red-400 border-red-500/20",
          label: "Uncollectible",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
          label: status,
        };
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingAmount = invoices.reduce(
    (sum, inv) => sum + inv.amountRemaining,
    0
  );

  if (loading) {
    return <InvoicesSkeleton />;
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
          <h1 className="text-4xl font-bold text-white mb-2">Invoices</h1>
          <p className="text-gray-400">View and manage all your invoices</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Invoiced</p>
                <p className="text-2xl font-bold text-white">
                  ${totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Paid</p>
                <p className="text-2xl font-bold text-white">
                  ${paidAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">
                  ${pendingAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer, email, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#25233a]/50 border-purple-500/20 text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-[#25233a]/50 border-purple-500/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1b2e] border-purple-500/20">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="void">Void</SelectItem>
                <SelectItem value="uncollectible">Uncollectible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <Card className="bg-[#1e1b2e]/50 border-purple-500/20 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "No invoices found"
                  : "No invoices yet"}
              </h3>
              <p className="text-gray-400 max-w-md">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Invoices will appear here once you create them"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => {
              const statusBadge = getStatusBadge(invoice.status);
              return (
                <Card
                  key={invoice.id}
                  className="bg-[#1e1b2e]/50 border-purple-500/20 p-6 hover:bg-[#25233a]/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <FileText className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white mb-1">
                              Invoice #{invoice.number}
                            </h3>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-300">
                                {invoice.customer}
                              </p>
                              <div className="flex items-center gap-2 text-gray-400">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">{invoice.customerEmail}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge className={statusBadge.className}>
                          <span className="flex items-center gap-1">
                            {statusBadge.icon}
                            {statusBadge.label}
                          </span>
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">
                            Created {new Date(invoice.created).toLocaleDateString()}
                          </span>
                        </div>
                        {invoice.dueDate && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">
                              Due {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col lg:items-end gap-4">
                      <div className="text-center lg:text-right">
                        <p className="text-sm text-gray-400 mb-1">Amount</p>
                        <p className="text-2xl font-bold text-white">
                          {invoice.currency.toUpperCase()} ${invoice.amount.toFixed(2)}
                        </p>
                        {invoice.amountRemaining > 0 && (
                          <p className="text-sm text-amber-400 mt-1">
                            ${invoice.amountRemaining.toFixed(2)} remaining
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {invoice.pdfUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.pdfUrl!, "_blank")}
                            className="bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </Button>
                        )}
                        {invoice.hostedUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.hostedUrl!, "_blank")}
                            className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
