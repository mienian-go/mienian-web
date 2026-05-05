"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/firestore";
import { formatRupiah } from "@/data/menu";
import { BarChart3, Package, Users, TrendingUp, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingVerifications: 0,
    activeEvents: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const orders = await getOrders();
        
        let pending = 0;
        let active = 0;
        let totalRev = 0;

        orders.forEach(o => {
          if (o.status === "payment_uploaded") pending++;
          if (["verified", "preparing"].includes(o.status)) active++;
          if (["verified", "preparing", "completed"].includes(o.status)) totalRev += o.totalPrice;
        });

        setStats({
          totalOrders: orders.length,
          pendingVerifications: pending,
          activeEvents: active,
          revenue: totalRev,
        });

        // Get top 5 recent orders
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error("Error fetching stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard Overview</h1>
          <p className="text-foreground/50 mt-1">
            Welcome back, Admin! Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Orders",
            value: stats.totalOrders.toString(),
            icon: Package,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            title: "Menunggu Verifikasi",
            value: stats.pendingVerifications.toString(),
            icon: AlertCircle,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          {
            title: "Active Events",
            value: stats.activeEvents.toString(),
            icon: Users,
            color: "text-green-500",
            bg: "bg-green-500/10",
          },
          {
            title: "Total Revenue",
            value: formatRupiah(stats.revenue),
            icon: TrendingUp,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 flex flex-col justify-center"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground/50 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Recent Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 card flex flex-col"
        >
          <div className="p-6 border-b border-card-border flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-foreground/50">
                Belum ada pesanan masuk.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-foreground/50 uppercase bg-muted/50 border-b border-card-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order ID</th>
                    <th className="px-6 py-4 font-semibold">PIC Name</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{order.orderId}</td>
                      <td className="px-6 py-4">{order.event?.picName || "-"}</td>
                      <td className="px-6 py-4">{order.event?.date || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                           order.status === "pending" ? "bg-zinc-500/20 text-zinc-400" :
                           order.status === "payment_uploaded" ? "bg-amber-500/20 text-amber-500" :
                           order.status === "verified" ? "bg-blue-500/20 text-blue-500" :
                           order.status === "preparing" ? "bg-fuchsia-500/20 text-fuchsia-500" :
                           order.status === "completed" ? "bg-green-500/20 text-green-500" :
                           "bg-red-500/20 text-red-500"
                        }`}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-secondary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(role === "superadmin" || role === "staff") && (
              <Link
                href="/admin/orders"
                className="block p-4 rounded-xl border border-card-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-semibold"
              >
                📋 Verifikasi Pembayaran
              </Link>
            )}
            {role === "superadmin" && (
              <>
                <Link
                  href="/admin/affiliates"
                  className="block p-4 rounded-xl border border-card-border hover:border-green-500/50 hover:bg-green-500/5 transition-all text-sm font-semibold"
                >
                  🤝 Kelola Affiliator
                </Link>
                <Link
                  href="/admin/settings"
                  className="block p-4 rounded-xl border border-card-border hover:border-tertiary/50 hover:bg-tertiary/5 transition-all text-sm font-semibold"
                >
                  ⚙️ Ubah Rekening Bank
                </Link>
                <Link
                  href="/admin/admins"
                  className="block p-4 rounded-xl border border-card-border hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-all text-sm font-semibold"
                >
                  🛡️ Manajemen Admin
                </Link>
              </>
            )}
            {(role === "superadmin" || role === "staff") && (
              <Link
                href="/admin/packages"
                className="block p-4 rounded-xl border border-card-border hover:border-secondary/50 hover:bg-secondary/5 transition-all text-sm font-semibold"
              >
                📦 Update Paket Catering
              </Link>
            )}
            <Link
              href="/admin/blog"
              className="block p-4 rounded-xl border border-card-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-sm font-semibold"
            >
              📝 Kelola Blog / Artikel
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
