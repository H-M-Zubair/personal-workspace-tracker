"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/lib/hooks/use-stats";
import { getTodayLabel } from "@/lib/utils/date";
import { formatDuration } from "@/lib/utils/time";

type RangeKey = "weekly" | "monthly" | "yearly";

function StatsCards({
  range,
  totalSeconds,
  completed,
  totalTasks,
  excused,
  missed,
  success,
  streak,
}: {
  range: RangeKey;
  totalSeconds: number;
  completed: number;
  totalTasks: number;
  excused: number;
  missed: number;
  success: number;
  streak: number;
}) {
  const rangeLabel = `${range[0].toUpperCase()}${range.slice(1)}`;
  const cards = [
    { label: "Hours logged today", value: formatDuration(totalSeconds) },
    { label: `${rangeLabel} completed`, value: `${completed}/${totalTasks}` },
    { label: `${rangeLabel} absences`, value: excused > 0 || missed > 0 ? `${excused} excused · ${missed} missed` : "None" },
    { label: `${rangeLabel} success`, value: `${success}%` },
    { label: "Current streak", value: `${streak} days` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { stats, loading } = useStats();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const rangeData = useMemo(() => {
    if (!stats) return null;

    return {
      weekly: stats.ranges.weekly,
      monthly: stats.ranges.monthly,
      yearly: stats.ranges.yearly,
    };
  }, [stats]);

  const renderCharts = (range: RangeKey) => {
    if (!stats || !rangeData) return null;

    const rangeStats = rangeData[range];
    const gaugeData = [{ name: "Success", value: rangeStats.successRatio, fill: "#10B981" }];

    return (
      <>
        <StatsCards
          range={range}
          totalSeconds={stats.today.totalSeconds}
          completed={rangeStats.tasksCompleted}
          totalTasks={rangeStats.totalTasks}
          excused={rangeStats.tasksExcused}
          missed={rangeStats.tasksMissed}
          success={rangeStats.successRatio}
          streak={stats.today.streak}
        />

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Weekly hours breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {!mounted ? <Skeleton className="h-full w-full" /> : null}
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.weeklyHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success ratio gauge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {!mounted ? <Skeleton className="h-full w-full" /> : null}
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={20} data={gaugeData} startAngle={180} endAngle={0}>
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={10} />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-xl font-semibold">
                        {`${rangeStats.successRatio}%`}
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task completion trend (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {!mounted ? <Skeleton className="h-full w-full" /> : null}
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.charts.completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0]?.payload as {
                          ratio: number;
                          assigned: number;
                          completed: number;
                          excused: number;
                          missed: number;
                        };
                        if (!point) return null;
                        return (
                          <div className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm">
                            <p className="font-semibold text-slate-900">{label}</p>
                            <p className="mt-1 text-slate-700">Completion: {point.ratio}%</p>
                            <p className="text-slate-600">
                              Done {point.completed}/{point.assigned}
                            </p>
                            <p className="text-slate-600">Excused: {point.excused}</p>
                            <p className="text-rose-700">Missed (no reason): {point.missed}</p>
                          </div>
                        );
                      }}
                    />
                    <Line type="monotone" dataKey="ratio" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly hours trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {!mounted ? <Skeleton className="h-full w-full" /> : null}
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.charts.monthlyHours}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hours" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-600">{getTodayLabel()}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3.5 w-3.5" /> Insights Ready
        </Badge>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : null}

      {!loading && stats && stats.recentAbsences.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent task absences</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {stats.recentAbsences.map((absence) => (
                <li key={absence.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{absence.taskTitle}</p>
                  <p className="text-xs text-slate-600">{absence.date}</p>
                  <p className="mt-1 text-sm text-slate-700">{absence.reason}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="space-y-4">{renderCharts("weekly")}</TabsContent>
        <TabsContent value="monthly" className="space-y-4">{renderCharts("monthly")}</TabsContent>
        <TabsContent value="yearly" className="space-y-4">{renderCharts("yearly")}</TabsContent>
      </Tabs>
    </section>
  );
}
