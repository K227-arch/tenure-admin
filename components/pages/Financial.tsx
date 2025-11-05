'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";

async function fetchFinancialData() {
  const [dashboardRes, stripeRes, transactionsRes] = await Promise.allSettled([
    fetch('/api/dashboard/stats'),
    fetch('/api/analytics/stripe'),
    fetch('/api/transactions?limit=5')
  ]);

  return {
    dashboard: dashboardRes.status === 'fulfilled' ? await dashboardRes.value.json() : null,
    stripe: stripeRes.status === 'fulfilled' ? await stripeRes.value.json() : null,
    transactions: transactionsRes.status === 'fulfilled' ? await transactionsRes.value.json() : null,
  };
}

export default function Financial() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-data'],
    queryFn: fetchFinancialData,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Financial Reports</h1>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Financial Reports</h1>
          <p className="text-muted-foreground text-red-500">Error loading financial data. Please check your database connection.</p>
        </div>
      </div>
    );
  }

  // Use real data from APIs
  const monthlyRevenue = data.dashboard?.charts?.revenueData?.map(item => ({
    month: item.month,
    revenue: item.revenue,
    expenses: Math.floor(item.revenue * 0.1) // Estimate 10% expenses
  })) || [];

  const paymentBreakdown = data.stripe ? [
    { name: "Active Subscriptions", value: data.stripe.subscriptionStats?.active || 0, color: "hsl(var(--success))" },
    { name: "Past Due", value: data.stripe.subscriptionStats?.pastDue || 0, color: "hsl(var(--warning))" },
    { name: "Canceled", value: data.stripe.subscriptionStats?.canceled || 0, color: "hsl(var(--destructive))" },
  ] : [];

  const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = monthlyRevenue.reduce((sum, item) => sum + item.expenses, 0);
  const netIncome = totalRevenue - totalExpenses;
  const collectionRate = data.stripe ? 
    ((data.stripe.subscriptionStats?.active || 0) / 
     ((data.stripe.subscriptionStats?.active || 0) + (data.stripe.subscriptionStats?.canceled || 0)) * 100) : 0;
  const stats = [
    {
      title: "Total Revenue (YTD)",
      value: `$${totalRevenue.toLocaleString()}`,
      change: data.dashboard?.stats?.revenueChange || "No data",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Net Income",
      value: `$${netIncome.toLocaleString()}`,
      change: `$${(netIncome - (totalRevenue * 0.9)).toLocaleString()} vs last period`,
      trend: netIncome > 0 ? "up" : "down",
      icon: TrendingUp,
    },
    {
      title: "Operating Expenses",
      value: `$${totalExpenses.toLocaleString()}`,
      change: `${((totalExpenses / totalRevenue) * 100).toFixed(1)}% of revenue`,
      trend: "down",
      icon: TrendingDown,
    },
    {
      title: "Collection Rate",
      value: `${collectionRate.toFixed(1)}%`,
      change: data.stripe ? `${data.stripe.subscriptionStats?.active || 0} active subs` : "No data",
      trend: collectionRate > 90 ? "up" : "down",
      icon: Percent,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Financial Reports
        </h1>
        <p className="text-muted-foreground">
          Comprehensive financial overview and analytics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="shadow-card hover:shadow-elevated transition-all duration-300"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="flex items-center mt-1">
                {stat.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-success mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive mr-1" />
                )}
                <span
                  className={`text-sm ${
                    stat.trend === "up" ? "text-success" : "text-destructive"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  vs last year
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  fill="hsl(var(--destructive))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Status Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions and Monthly Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.transactions?.transactions?.length > 0 ? data.transactions.transactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-border pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {transaction.users?.name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {transaction.payment_type} - {transaction.provider || 'Manual'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.status === 'completed' ? 'text-success' : 
                      transaction.status === 'failed' ? 'text-destructive' : 'text-warning'
                    }`}>
                      {transaction.currency} {transaction.amount?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {transaction.status}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent transactions found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyRevenue.length > 0 ? monthlyRevenue.slice(-3).map((item, index) => {
                const net = item.revenue - item.expenses;
                const margin = item.revenue > 0 ? ((net / item.revenue) * 100).toFixed(1) : 0;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-border pb-4 last:border-0"
                  >
                    <div className="font-medium text-foreground">{item.month}</div>
                    <div className="grid grid-cols-3 gap-4 text-right">
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-foreground text-sm">
                          ${item.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className="font-semibold text-success text-sm">
                          ${net.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Margin</p>
                        <p className="font-semibold text-foreground text-sm">{margin}%</p>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No financial data available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
