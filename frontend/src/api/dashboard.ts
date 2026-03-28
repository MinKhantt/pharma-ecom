import api from "./axios";

export interface DashboardStats {
    total_orders: number;
    total_users: number;
    total_products: number;
    total_revenue: number;
}

export interface ChartData {
    orders_by_status: Record<string, number>;
    orders_by_day: { day: string; count: number }[];
    revenue_by_day: { day: string; total: number }[];
}


export const dashboardApi = {
    getStats: () =>
        api.get<DashboardStats>("/dashboard/stats").then((r) => ({
        ...r.data,
        total_revenue: parseFloat(String(r.data.total_revenue)),
        })),

    getCharts: () =>
        api.get<ChartData>("/dashboard/charts").then((r) => r.data),

};

