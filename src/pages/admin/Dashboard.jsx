import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

import DashboardSkeletal from "@/components/skeletal/DashboardSkeletal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import {
  TrendingUp,
  TrendingDown,
  Info,
  Activity,
  Users,
  ShieldAlert,
} from "lucide-react";

import { usePredictionStore } from "@/stores/predictionStore";
import { useUserStore } from "@/stores/userStore";

/* -------------------------
   Helpers (UI-safe)
------------------------- */
function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const sTxt = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const eTxt = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${sTxt}–${eTxt}`;
}

function nfmt(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

function pctfmt(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0%";
  return `${num.toFixed(1)}%`;
}

function trendMeta(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v === 0) {
    return {
      label: "No change",
      icon: Activity,
      badgeClass:
        "bg-muted text-muted-foreground border border-border dark:bg-muted/50",
    };
  }
  if (v > 0) {
    return {
      label: "Increasing",
      icon: TrendingUp,
      badgeClass:
        "bg-amber-500/10 text-amber-700 border border-amber-500/20 dark:text-amber-400",
    };
  }
  return {
    label: "Decreasing",
    icon: TrendingDown,
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 dark:text-emerald-400",
  };
}

/* -------------------------
   Interactive Trends Card (AreaChart)
------------------------- */
function DepressionTrendAreaInteractive({ trend }) {
  const [range, setRange] = React.useState("5"); // "3" | "5" | "10" | "all"
  const [mode, setMode] = React.useState("count"); // "count" | "rate"

  const chartData = React.useMemo(() => {
    return (trend || []).map((item, idx) => {
      const label = `${item.department} • ${item.program} • ${item.yearLevel} • ${formatRange(
        item.start_at,
        item.end_at,
      )}`;

      const endDate = new Date(item.end_at);
      const dateKey = endDate.toISOString().slice(0, 10);

      const total = Number(
        item.total ?? (item.atRisk ?? 0) + (item.notAtRisk ?? 0),
      );
      const atRisk = Number(item.atRisk ?? 0);
      const notAtRisk = Number(item.notAtRisk ?? 0);

      const atRiskRate = total > 0 ? (atRisk / total) * 100 : 0;
      const notAtRiskRate = 100 - atRiskRate;

      return {
        key: String(item.schedule_id ?? idx),
        date: dateKey,
        label,

        atRisk,
        notAtRisk,
        total,

        atRiskRate: Number(atRiskRate.toFixed(1)),
        notAtRiskRate: Number(notAtRiskRate.toFixed(1)),
      };
    });
  }, [trend]);

  const filteredData = React.useMemo(() => {
    if (range === "all") return chartData;
    const n = Number(range);
    if (!Number.isFinite(n) || n <= 0) return chartData;
    return chartData.slice(-n);
  }, [chartData, range]);

  const chartConfig =
    mode === "count"
      ? {
          atRisk: { label: "At-Risk Cases", color: "var(--chart-1)" },
          notAtRisk: { label: "Not At Risk", color: "var(--chart-2)" },
        }
      : {
          atRiskRate: { label: "At-Risk (%)", color: "var(--chart-1)" },
          notAtRiskRate: { label: "Not At Risk (%)", color: "var(--chart-2)" },
        };

  const areaAKey = mode === "count" ? "notAtRisk" : "notAtRiskRate";
  const areaBKey = mode === "count" ? "atRisk" : "atRiskRate";

  return (
    <Card className="pt-0 overflow-hidden border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b border-border/60 py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="leading-tight">
              Depression Trend by Survey Schedule
            </CardTitle>
            <Badge
              variant="outline"
              className="border-border/60 text-muted-foreground"
            >
              Campaign windows
            </Badge>
          </div>
          <CardDescription className="max-w-3xl">
            Each point represents one survey campaign window (survey_schedule).
            Switch to “Percent” to compare fairly across different campaign
            sizes.
          </CardDescription>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-full sm:w-44 rounded-lg border-border/60 bg-background/60">
              <SelectValue placeholder="Mode" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="count" className="rounded-lg">
                Counts (cases)
              </SelectItem>
              <SelectItem value="rate" className="rounded-lg">
                Percent (% at-risk)
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-full sm:w-44 rounded-lg border-border/60 bg-background/60">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="3" className="rounded-lg">
                Last 3 campaigns
              </SelectItem>
              <SelectItem value="5" className="rounded-lg">
                Last 5 campaigns
              </SelectItem>
              <SelectItem value="10" className="rounded-lg">
                Last 10 campaigns
              </SelectItem>
              <SelectItem value="all" className="rounded-lg">
                All campaigns
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-4 pt-5 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-atRisk)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-atRisk)"
                  stopOpacity={0.08}
                />
              </linearGradient>
              <linearGradient id="fillNotAtRisk" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-notAtRisk)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-notAtRisk)"
                  stopOpacity={0.08}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(value) => {
                const d = new Date(value);
                return d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v) => (mode === "rate" ? `${v}%` : v)}
            />

            <ChartTooltip
              cursor={{
                stroke: "var(--muted-foreground)",
                strokeOpacity: 0.35,
              }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, index) =>
                    filteredData[index]?.label ?? ""
                  }
                  indicator="dot"
                />
              }
            />

            <Area
              dataKey={areaAKey}
              type="natural"
              fill="url(#fillNotAtRisk)"
              stroke="var(--color-notAtRisk)"
              strokeWidth={2}
              stackId="a"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey={areaBKey}
              type="natural"
              fill="url(#fillAtRisk)"
              stroke="var(--color-atRisk)"
              strokeWidth={2}
              stackId="a"
              dot={false}
              activeDot={{ r: 4 }}
            />

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="border-t border-border/60 bg-background/30">
        <div className="flex w-full items-start gap-2 text-sm">
          <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div className="grid gap-1">
            <div className="font-medium leading-none">
              Trend based on survey_schedule windows
            </div>
            <div className="text-muted-foreground leading-none">
              Tip: Use “Percent” to normalize across different campaign sizes
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

/* -------------------------
   DASHBOARD (ACTUAL DB INTEGRATION)
------------------------- */
export function Dashboard() {
  const dashboardData = usePredictionStore((s) => s.dashboardData);
  const dashboardLoading = usePredictionStore((s) => s.dashboardLoading);
  const dashboardError = usePredictionStore((s) => s.dashboardError);
  const fetchDashboardData = usePredictionStore((s) => s.fetchDashboardData);
  const { profile } = useUserStore();

  React.useEffect(() => {
    if (!profile?.usertype_id) return;

    // chairperson also needs program.program before fetching
    if (Number(profile?.usertype_id) === 4 && !profile?.program?.program) {
      return;
    }

    fetchDashboardData();
  }, [fetchDashboardData, profile?.usertype_id, profile?.program?.program]);

  // ✅ wait until profile is ready before showing dashboard error/content
  if (!profile?.usertype_id) {
    return <DashboardSkeletal />;
  }

  if (Number(profile?.usertype_id) === 4 && !profile?.program?.program) {
    return <DashboardSkeletal />;
  }

  if (dashboardLoading && !dashboardData) {
    return <DashboardSkeletal />;
  }

  const surveyData = dashboardData || {
    totalStudents: 0,
    depressionCases: 0,
    depressionPercentage: 0,
    trendChange: 0,

    gender_riskDistribution: [],
    age_riskDistribution: [],
    livingArrangement_riskDistribution: [],
    workingStatus_riskDistribution: [],
    pwd_riskDistribution: [],
    indigenous_riskDistribution: [],

    bmi_riskDistribution: [],
    sleepDuration_riskDistribution: [],
    breakfastHabit_riskDistribution: [],
    exerciseFrequency_riskDistribution: [],
    smokingStatus_riskDistribution: [],
    alcoholConsumption_riskDistribution: [],

    dailySchoolwork_riskDistribution: [],
    academicPressure_riskDistribution: [],
    academicDissatisfaction_riskDistribution: [],
    academicWorkload_riskDistribution: [],
    financialStress_riskDistribution: [],

    socialSupport_riskDistribution: [],
    bullying_riskDistribution: [],
    relationshipStress_riskDistribution: [],

    // ✅ use theme tokens instead of hard-coded colors
    depression: [
      { name: "At Risk", value: 0, fill: "var(--chart-1)" },
      { name: "Not At Risk", value: 0, fill: "var(--chart-2)" },
    ],

    course_riskDistribution: [],
    yearLevel_riskDistribution: [],

    scheduleTrend: [],
  };

  const meta = trendMeta(surveyData.trendChange);
  const TrendIcon = meta.icon;

  return (
    <div className="w-full">
      <div className="border-b border-border/60 bg-background/40">
        <div className="mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Survey Dashboard
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Student Health & Wellness Analytics — Depression Risk Prediction
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-border/60 text-muted-foreground"
              >
                Live analytics
              </Badge>
              <Badge className={meta.badgeClass}>
                <TrendIcon className="mr-1 h-3.5 w-3.5" />
                {meta.label}
              </Badge>
            </div>
          </div>

          {dashboardLoading ? (
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-4 rounded-full" />
              <span>Loading dashboard...</span>
            </div>
          ) : null}

          {dashboardError ? (
            <div className="mt-4">
              <Alert className="border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Dashboard error</AlertTitle>
                <AlertDescription>{dashboardError}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Students Assessed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">
                {nfmt(surveyData.totalStudents)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Based on submitted survey responses
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Students at Risk (Depression)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums text-red-600 dark:text-red-400">
                {nfmt(surveyData.depressionCases)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {pctfmt(surveyData.depressionPercentage)} of total
              </p>

              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-muted/70">
                  <div
                    className="h-2 rounded-full bg-red-500/70"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          0,
                          Number(surveyData.depressionPercentage) || 0,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Trend (Campaign-to-Campaign)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <div className="text-3xl font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  {Number(surveyData.trendChange) >= 0 ? "+" : ""}
                  {nfmt(surveyData.trendChange)}
                </div>
                <Badge className={meta.badgeClass}>
                  <TrendIcon className="mr-1 h-3.5 w-3.5" />
                  {meta.label}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Change in at-risk cases across campaigns
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="demographics" className="space-y-6">
          <div className="rounded-xl border border-border/60 bg-card/60 p-2">
            <TabsList className="grid w-full grid-cols-3 gap-2 sm:grid-cols-6 bg-transparent">
              <TabsTrigger
                value="demographics"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                Demographics
              </TabsTrigger>
              <TabsTrigger
                value="lifestyle"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                Lifestyle
              </TabsTrigger>
              <TabsTrigger
                value="academic"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                Academic
              </TabsTrigger>
              <TabsTrigger
                value="psychosocial"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                Psychosocial
              </TabsTrigger>
              <TabsTrigger
                value="depression"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                Depression
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg"
              >
                Trends
              </TabsTrigger>
            </TabsList>
          </div>

          {/* <TabsContent value="demographics" className="space-y-6">
      
          </TabsContent>

          <TabsContent value="lifestyle" className="space-y-6" />
          <TabsContent value="academic" className="space-y-6" />
          <TabsContent value="psychosocial" className="space-y-6" />

          <TabsContent value="depression" className="space-y-6">
    
          </TabsContent> */}
          {/* Demographics Tab */}
          <TabsContent value="demographics" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 1. Gender Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Gender vs Depression Risk
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Risk distribution by gender
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.gender_riskDistribution}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="gender"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar
                        dataKey="notAtRisk"
                        stackId="a"
                        fill="#10b981"
                        name="Not At Risk"
                      />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        name="At Risk"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 2. Age Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Age vs Depression Risk</CardTitle>
                  <CardDescription>
                    Risk distribution by age group
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.age_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="age" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 3. Living Arrangement Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Living Arrangement vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by living situation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.livingArrangement_riskDistribution}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="arrangement"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 4. Working Status Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Working Status vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by employment status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.workingStatus_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="status"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 5. PWD Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>PWD Status vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk for students with disabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.pwd_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 6. Indigenous Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Indigenous Status vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk for indigenous students
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.indigenous_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lifestyle Tab */}
          <TabsContent value="lifestyle" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 7. BMI Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>BMI vs Depression Risk</CardTitle>
                  <CardDescription>
                    Risk distribution by BMI category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.bmi_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="category"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 8. Sleep Duration Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Sleep Duration vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by sleep patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.sleepDuration_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="duration"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 9. Breakfast Habit Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Breakfast Habit vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by breakfast frequency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.breakfastHabit_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="habit"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 10. Exercise Frequency Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Exercise Frequency vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by physical activity level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.exerciseFrequency_riskDistribution}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="type" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 11. Smoking Status Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Smoking Status vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by smoking behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart data={surveyData.smokingStatus_riskDistribution}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="status"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 12. Alcohol Consumption Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Alcohol Consumption vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by alcohol consumption frequency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.alcoholConsumption_riskDistribution}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="frequency"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Academic Tab */}
          <TabsContent value="academic" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 13. Daily Schoolwork Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Schoolwork vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by study hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.dailySchoolwork_riskDistribution}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="hours"
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 14. Academic Pressure Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Pressure vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by academic pressure level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.academicPressure_riskDistribution}
                      margin={{ top: 0, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" opacity={0} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 15. Academic Dissatisfaction Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Dissatisfaction vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by academic satisfaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.academicDissatisfaction_riskDistribution}
                      margin={{ top: 0, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" opacity={0} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 16. Academic Workload Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Academic Workload vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by perceived workload
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.academicWorkload_riskDistribution}
                      margin={{ top: 0, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" opacity={0} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 17. Financial Stress Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Stress vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by financial stress level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.financialStress_riskDistribution}
                      margin={{ top: 0, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" opacity={0} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Psychosocial Tab */}
          <TabsContent value="psychosocial" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 18. Social Support Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Support vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by social support availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.socialSupport_riskDistribution}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" stroke="#64748b" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 19. Bullying Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Bullying Incidents vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by bullying exposure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.bullying_riskDistribution}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 20. Relationship Stress Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Relationship Stress vs Risk</CardTitle>
                  <CardDescription>
                    Depression risk by relationship-related stress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.relationshipStress_riskDistribution}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="level" stroke="#64748b" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Depression Tab */}
          <TabsContent value="depression" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 21. Depression Overall Distribution */}
              <Card className="flex flex-col">
                <CardHeader className="items-center">
                  <CardTitle>Depression: Overall Distribution</CardTitle>
                  <CardDescription>
                    At-risk vs not-at-risk students
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ChartContainer
                    config={{
                      notAtRisk: {
                        label: "Not At Risk",
                        color: "var(--chart-1)",
                      },
                      atRisk: { label: "At Risk", color: "var(--chart-2)" },
                    }}
                    className="mx-auto aspect-square max-h-75"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={surveyData.depression}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {surveyData.depression.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </CardContent>

                <CardFooter className="flex-col gap-2 text-sm">
                  <div className="text-muted-foreground">
                    Distribution of students at risk vs not at risk
                  </div>
                </CardFooter>
              </Card>

              {/* 23. Depression by Year Level */}
              <Card>
                <CardHeader>
                  <CardTitle>Depression Risk by Year Level</CardTitle>
                  <CardDescription>
                    Risk distribution across academic years
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.yearLevel_riskDistribution}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="year" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* 22. Depression by Course */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Depression Risk by Course</CardTitle>
                  <CardDescription>
                    Risk distribution across academic programs
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <ChartContainer
                    config={{
                      notAtRisk: { label: "Not At Risk" },
                      atRisk: { label: "At Risk" },
                    }}
                  >
                    <BarChart
                      data={surveyData.course_riskDistribution}
                      layout="vertical"
                      margin={{ left: 0, right: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis
                        dataKey="course"
                        type="category"
                        width={100}
                        fontSize={10}
                        stroke="#64748b"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="notAtRisk" stackId="a" fill="#10b981" />
                      <Bar
                        dataKey="atRisk"
                        stackId="a"
                        fill="#3b82f6"
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <DepressionTrendAreaInteractive trend={surveyData.scheduleTrend} />
          </TabsContent>
        </Tabs>

        <Separator className="my-10" />

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>
              Colors adapt automatically to light/dark mode using theme tokens
              (chart colors use <code>--chart-*</code> variables).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
