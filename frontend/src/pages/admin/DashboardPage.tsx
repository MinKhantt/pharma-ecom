import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Package, ShoppingBag, Users, CreditCard, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ordersApi } from "@/api/orders";
import { dashboardApi } from "@/api/dashboard";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Link } from "react-router-dom";

declare global { interface Window { Chart: any } }

const TEAL       = "#1D9E75";
const TEAL_LIGHT = "rgba(29,158,117,0.12)";
const GRAY       = "#888780";
const GRID       = "rgba(136,135,128,0.1)";

const STATUS_COLORS: Record<string, string> = {
  pending:               "#EF9F27",
  confirmed:             "#378ADD",
  processing:            "#7F77DD",
  awaiting_prescription: "#D85A30",
  ready_for_pickup:      "#1D9E75",
  shipped:               "#639922",
  delivered:             "#27500A",
  cancelled:             "#E24B4A",
  refunded:              "#888780",
};

function useChart(id: string, ready: boolean, build: () => any) {
  const ref = useRef<any>(null);
  useEffect(() => {
    if (!ready || !window.Chart) return;
    const canvas = document.getElementById(id) as HTMLCanvasElement | null;
    if (!canvas) return;
    if (ref.current) ref.current.destroy();
    ref.current = new window.Chart(canvas, build());
    return () => { ref.current?.destroy(); };
  }, [ready]);
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.getStats,
  });

  const { data: charts } = useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: dashboardApi.getCharts,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-orders-recent"],
    queryFn: () => ordersApi.getAllOrders({ limit: 5 }),
  });

  const chartsReady = !!charts;

  // ── Sales revenue per day (line) ─────────────────────────────────────────
  useChart("chart-revenue-day", chartsReady, () => ({
    type: "line",
    data: {
      labels: charts!.revenue_by_day.map((d) => d.day),
      datasets: [{
        label: "Revenue",
        data: charts!.revenue_by_day.map((d) => d.total),
        borderColor: TEAL,
        backgroundColor: TEAL_LIGHT,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: TEAL,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const v = ctx.parsed.y;
              return " " + (v >= 1000 ? (v / 1000).toFixed(1) + "K" : v) + " MMK";
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 10 }, color: GRAY, maxRotation: 45, autoSkip: false },
        },
        y: {
          grid: { color: GRID },
          ticks: {
            font: { size: 11 },
            color: GRAY,
            callback: (v: number) => v >= 1000 ? (v / 1000).toFixed(0) + "K" : v,
          },
        },
      },
    },
  }));

  // ── Orders by status (doughnut) ───────────────────────────────────────────
  useChart("chart-status", chartsReady, () => {
    const entries = Object.entries(charts!.orders_by_status);
    return {
      type: "doughnut",
      data: {
        labels: entries.map(([k]) => k.replace(/_/g, " ")),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: entries.map(([k]) => STATUS_COLORS[k] ?? GRAY),
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "right",
            labels: { font: { size: 11 }, boxWidth: 10, padding: 10, color: GRAY },
          },
        },
      },
    };
  });

  // ── Orders this week (bar) ────────────────────────────────────────────────
  useChart("chart-daily", chartsReady, () => ({
    type: "bar",
    data: {
      labels: charts!.orders_by_day.map((d) => d.day),
      datasets: [{
        label: "Orders",
        data: charts!.orders_by_day.map((d) => d.count),
        backgroundColor: TEAL,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: GRAY } },
        y: {
          grid: { color: GRID },
          ticks: { font: { size: 11 }, color: GRAY, stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  }));

  const statCards = [
    {
      label: "Total Orders",
      value: stats?.total_orders ?? 0,
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Users",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Products",
      value: stats?.total_products ?? 0,
      icon: Package,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Revenue",
      value: formatCurrency(stats?.total_revenue ?? 0),
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  const revenueTotal = charts?.revenue_by_day.reduce((s, d) => s + d.total, 0) ?? 0;
  const revenueMax   = Math.max(...(charts?.revenue_by_day.map((d) => d.total) ?? [0]));
  const revenuePeak  = charts?.revenue_by_day.find((d) => d.total === revenueMax);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to Shwe La Min admin panel</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="font-display text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales revenue per day — full width */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">
                Sales revenue
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 14 days</p>
            </div>
            {charts && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">14-day total</p>
                  <p className="font-display font-semibold text-primary">
                    {formatCurrency(revenueTotal)}
                  </p>
                </div>
                {revenuePeak && revenueMax > 0 && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Peak day</p>
                    <p className="font-semibold">
                      {revenuePeak.day}
                      <span className="text-muted-foreground font-normal ml-1 text-xs">
                        {formatCurrency(revenueMax)}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!charts ? (
            <LoadingSpinner />
          ) : (
            <div className="relative h-56">
              <canvas id="chart-revenue-day" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders by status + orders this week */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Orders by status</CardTitle>
            {charts && (
              <p className="text-xs text-muted-foreground">
                {Object.values(charts.orders_by_status).reduce((a, b) => a + b, 0)} total orders
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!charts ? (
              <LoadingSpinner />
            ) : (
              <div className="relative h-52">
                <canvas id="chart-status" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Orders this week</CardTitle>
            {charts && (
              <p className="text-xs text-muted-foreground">
                {charts.orders_by_day.reduce((s, d) => s + d.count, 0)} orders in the last 7 days
              </p>
            )}
          </CardHeader>
          <CardContent>
            {!charts ? (
              <LoadingSpinner />
            ) : (
              <div className="relative h-52">
                <canvas id="chart-daily" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Recent Orders
          </CardTitle>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {!recentOrders ? (
            <LoadingSpinner />
          ) : recentOrders.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No orders yet</p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.items.map((order) => (
                <Link key={order.id} to={`/admin/orders/${order.id}`}>
                  <div className="flex items-center justify-between py-3 px-1 hover:bg-muted/50 transition-colors rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.order_date)}
                      </p>
                    </div>
                    <span className="font-semibold text-sm text-primary">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}