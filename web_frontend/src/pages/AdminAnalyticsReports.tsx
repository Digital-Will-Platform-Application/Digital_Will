import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { backendApi } from "@/lib/backendApi";
import { handleAdminApiSessionError } from "@/lib/adminSession";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Loader2,
  RefreshCw,
  ChevronRight,
  UserPlus,
  Mail,
  CalendarDays,
  TrendingUp,
  Package,
  CalendarIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  totalUsers: number;
  totalRegisteredEmails: number;
  usersToday: number;
  usersThisWeek: number;
  usersThisMonth: number;
  usersThisYear: number;
  usersLast7Days: number;
  dailyRegistrations: Array<{ date: string; count: number; shortLabel: string }>;
  monthlyRegistrationsThisYear: Array<{ month: number; monthLabel: string; count: number }>;
  yearlyRegistrations: Array<{ year: number; count: number }>;
  totalAssets: number;
  assetsToday: number;
}

const AdminAnalyticsReports = () => {
  const { user, isAdmin, signOut } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookupDate, setLookupDate] = useState<Date>(() => new Date());
  const [lookupCount, setLookupCount] = useState<number | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchRegistrationCountForDate = useCallback(
    async (d: Date) => {
      if (!user || !isAdmin) return;
      const ymd = format(d, "yyyy-MM-dd");
      setLookupLoading(true);
      try {
        const json = await backendApi.getAdminRegistrationsOnDate(ymd);
        const n = json.data?.count;
        setLookupCount(typeof n === "number" ? n : n != null ? Number(n) : null);
      } catch (e) {
        if (await handleAdminApiSessionError(e, signOut)) return;
        setLookupCount(null);
        toast.error("Could not load signup count for that date.");
      } finally {
        setLookupLoading(false);
      }
    },
    [user, isAdmin, signOut]
  );

  useEffect(() => {
    if (!user || !isAdmin) return;
    void fetchRegistrationCountForDate(lookupDate);
  }, [user, isAdmin, lookupDate, fetchRegistrationCountForDate]);

  const loadData = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const json = await backendApi.getAdminStats();
      setData(json.data as AnalyticsData);
    } catch (e) {
      if (await handleAdminApiSessionError(e, signOut)) return;
      setError(e instanceof Error ? e.message : "Failed to load analytics.");
      toast.error("Could not load analytics and reports.");
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, signOut]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-12">
        <div className="ui-loader-ring">
          <span className="ui-loader-ring-border" />
        <span className="ui-loader-ring-core" />
        </div>
      </div>
    );
  if (error)
    return (
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );

  const d = data!;
  const totalEmails = d.totalRegisteredEmails ?? d.totalUsers;

  return (
    <div className="app-shell max-w-[1400px] py-6 md:py-8 min-h-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/admin" className="hover:text-foreground transition-colors">
          Admin
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Analytics & Reports</span>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-primary border-b-2 border-primary pb-1 inline-block mb-2">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            User signups from Neon (unique registered emails, excluding the admin account). Assets include all
            records.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      <Card className="border-primary/25 shadow-md mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            Signups on a selected date
          </CardTitle>
          <CardDescription>
            Pick a year, month, and day. Count includes non-admin users with an email, using the same rules as the rest of this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground">Date (quick)</span>
            <Input
              type="date"
              value={format(lookupDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const [y, m, d] = v.split("-").map(Number);
                if (y && m && d) setLookupDate(new Date(y, m - 1, d));
              }}
              className="w-full sm:w-[200px]"
              aria-label="Registration date"
            />
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !lookupDate && "text-muted-foreground"
                )}
                aria-label="Open calendar to choose date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {lookupDate ? format(lookupDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={lookupDate}
                onSelect={(d) => {
                  if (d) {
                    setLookupDate(d);
                    setCalendarOpen(false);
                  }
                }}
                defaultMonth={lookupDate}
                fromDate={new Date(2020, 0, 1)}
                toDate={new Date(new Date().getFullYear() + 1, 11, 31)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 min-w-[200px]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registrations</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {lookupLoading ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : lookupCount === null ? (
                "—"
              ) : (
                lookupCount
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{lookupDate ? format(lookupDate, "yyyy-MM-dd") : ""}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Registered emails
            </CardTitle>
            <CardDescription>Total (non-admin, with email)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{totalEmails}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Rolling 7 days
            </CardTitle>
            <CardDescription>New registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{d.usersLast7Days ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              This calendar week
            </CardTitle>
            <CardDescription>From week start (Mon)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{d.usersThisWeek ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              Today
            </CardTitle>
            <CardDescription>New users</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{d.usersToday}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              This month
            </CardTitle>
            <CardDescription>Calendar month to date</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{d.usersThisMonth ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              This year
            </CardTitle>
            <CardDescription>Calendar year to date</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{d.usersThisYear ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="border-border shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Assets
            </CardTitle>
            <CardDescription>All asset records in Neon</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="text-2xl font-semibold tabular-nums">{d.totalAssets}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Today</p>
              <p className="text-2xl font-semibold tabular-nums">{d.assetsToday}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="border-border shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Daily signups (last 7 days)</CardTitle>
            <CardDescription>Each bar is new unique emails (non-admin)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full min-w-0 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.dailyRegistrations ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="shortLabel" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(value: number) => [value, "Signups"]}
                    labelFormatter={(_, payload) => (payload[0]?.payload?.date as string) ?? ""}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Signups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Signups by month (this year)</CardTitle>
            <CardDescription>January–December, current calendar year</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full min-w-0 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={d.monthlyRegistrationsThisYear ?? []}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
                  <Tooltip contentStyle={{ borderRadius: 8 }} formatter={(value: number) => [value, "Signups"]} />
                  <Bar dataKey="count" fill="hsl(var(--primary) / 0.85)" radius={[4, 4, 0, 0]} name="Signups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Year-over-year registrations</CardTitle>
          <CardDescription>Five-year window ending current year (non-admin emails)</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold text-right">New registrations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(d.yearlyRegistrations ?? []).map((row, i) => (
                  <TableRow key={row.year} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsReports;
