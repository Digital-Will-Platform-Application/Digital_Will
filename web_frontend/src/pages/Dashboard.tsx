import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Plus,
  FileText,
  Mic,
  Video,
  FilePenLine,
  NotebookPen,
  FolderOpen,
  Users,
  Shield,
  ChevronRight,
  Clock,
  Loader2,
  BarChart3,
  PieChart,
  TrendingUp,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Link as LinkIcon,
  ArrowRight,
  Trash2,
  Edit3,
  X,
  FileCheck,
  UserCircle,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { backendApi } from "@/lib/backendApi";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from "recharts";
import ThreeDLogo from "@/components/branding/ThreeDLogo";
import { DashboardHero3DAccent } from "@/components/branding/BrandIllustrations";
import DashboardTutorialCarousel from "@/components/dashboard/DashboardTutorialCarousel";

interface Will {
  id: string;
  title: string;
  status: string;
  type: string;
  updated_at: string;
  content: string | null;
  transcript: string | null;
  audio_url: string | null;
  video_url: string | null;
  notes: string | null;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  estimated_value: number | null;
  currency: string | null;
}

interface WillStatusStats {
  draft: number;
  in_progress: number;
  review: number;
  completed: number;
}

interface Recipient {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  is_verified: boolean;
  created_at: string;
  image_url: string | null;
}

const MOBILE_BREAKPOINT = 385;

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [wills, setWills] = useState<Will[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [assetAllocations, setAssetAllocations] = useState<Array<{
    id: string;
    asset_id: string;
    recipient_id: string;
    allocation_percentage: number;
  }>>([]);
  const [assetCount, setAssetCount] = useState(0);
  const [recipientCount, setRecipientCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isManagingWills, setIsManagingWills] = useState(false);
  const [selectedWills, setSelectedWills] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // First-time users must complete asset selection (onboarding) before seeing dashboard
  useEffect(() => {
    if (user?.user_metadata?.onboarding_completed === false) {
      navigate("/onboarding", { replace: true });
    }
  }, [user?.user_metadata?.onboarding_completed, navigate]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  /** Show all will types on dashboard so users can see every saved will. */
  const willsVisibleOnDashboard = useMemo(
    () => wills,
    [wills],
  );

  const pieOuterRadius = windowWidth <= MOBILE_BREAKPOINT ? 50 : 70;

  const fetchData = async () => {
    try {
      if (!user) return;
      const userIdNum = Number(user.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;
      const [willsResult, assetsResult, recipientsResult] = await Promise.allSettled([
        backendApi.listWills(useUserId ? { user_id: userIdNum } : { user_email: user.email }),
        useUserId ? backendApi.getUserAssets(userIdNum) : Promise.resolve({ success: false, data: [] }),
        useUserId
          ? backendApi.listRecipients({ user_id: userIdNum })
          : backendApi.listRecipients({ user_email: user.email }),
      ]);

      const rows =
        willsResult.status === "fulfilled" && Array.isArray(willsResult.value?.data)
          ? willsResult.value.data
          : [];
      const willData: Will[] = rows
        .map((w) => ({
          id: String(w.id),
          title: w.title ?? "Untitled will",
          status: w.status ?? "draft",
          type: w.type ?? "text",
          updated_at: w.updated_at ?? w.created_at,
          content: w.content,
          transcript: w.transcript,
          audio_url: w.audio_url,
          video_url: w.video_url,
          notes: w.notes,
        }));
      setWills(willData);

      const assetData =
        assetsResult.status === "fulfilled" && assetsResult.value?.success && Array.isArray(assetsResult.value?.data)
          ? assetsResult.value.data
          : [];
      setAssets(assetData);
      setAssetCount(assetData.length);

      const recipientData =
        recipientsResult.status === "fulfilled" && recipientsResult.value?.success
          ? ((Array.isArray(recipientsResult.value?.data) ? recipientsResult.value.data : []) as Recipient[])
          : [];
      setRecipients(
        recipientData.map((r) => ({
          ...r,
          image_url: r.image_url ?? null,
        })),
      );
      setRecipientCount(recipientData.length);

      // Allocation endpoint is not yet migrated in backend dashboard flow.
      setAssetAllocations([]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setWills([]);
      setAssets([]);
      setRecipients([]);
      setAssetCount(0);
      setRecipientCount(0);
      setAssetAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleManageMode = () => {
    setIsManagingWills(!isManagingWills);
    setSelectedWills(new Set());
  };

  const toggleWillSelection = (willId: string) => {
    const newSelected = new Set(selectedWills);
    if (newSelected.has(willId)) {
      newSelected.delete(willId);
    } else {
      newSelected.add(willId);
    }
    setSelectedWills(newSelected);
  };

  const selectAllWills = () => {
    const n = willsVisibleOnDashboard.length;
    if (selectedWills.size === n) {
      setSelectedWills(new Set());
    } else {
      setSelectedWills(new Set(willsVisibleOnDashboard.map((w) => w.id)));
    }
  };

  const handleDeleteWills = async () => {
    if (selectedWills.size === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedWills.size} will${selectedWills.size > 1 ? "s" : ""}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const willIds = Array.from(selectedWills);
      const userIdNum = Number(user?.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;
      if (!user?.email) throw new Error("Not signed in");

      for (const idStr of willIds) {
        const wid = parseInt(idStr, 10);
        if (!Number.isFinite(wid)) continue;
        await backendApi.deleteWill(
          wid,
          useUserId ? { user_id: userIdNum } : { user_email: user.email }
        );
      }

      // Update local state
      setWills(wills.filter((w) => !selectedWills.has(w.id)));
      setSelectedWills(new Set());
      setIsManagingWills(false);

      // Show success message
      const deletedCount = willIds.length;
      if (deletedCount === 1) {
        const deletedWill = wills.find((w) => w.id === willIds[0]);
        toast.success(`"${deletedWill?.title}" has been deleted successfully.`);
      } else {
        toast.success(`${deletedCount} wills have been deleted successfully.`);
      }
    } catch (error: any) {
      console.error("Error deleting wills:", error);
      toast.error(`Failed to delete wills: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate will completion statistics (excluding deprecated chat wills)
  const willStatusStats: WillStatusStats = willsVisibleOnDashboard.reduce(
    (acc, will) => {
      const status = will.status as keyof WillStatusStats;
      if (status in acc) {
        acc[status]++;
      }
      return acc;
    },
    { draft: 0, in_progress: 0, review: 0, completed: 0 }
  );

  const totalWills = willsVisibleOnDashboard.length;
  const completedWills = willStatusStats.completed;
  const completionPercentage = totalWills > 0 ? Math.round((completedWills / totalWills) * 100) : 0;

  // Prepare will status data for chart
  const willStatusData = [
    { name: "Draft", value: willStatusStats.draft, fill: "#94a3b8" },
    { name: "In Progress", value: willStatusStats.in_progress, fill: "#fbbf24" },
    { name: "Under Review", value: willStatusStats.review, fill: "#3b82f6" },
    { name: "Completed", value: willStatusStats.completed, fill: "#10b981" },
  ].filter(item => item.value > 0);

  // Calculate asset distribution by category
  const assetCategoryData = assets.reduce((acc, asset) => {
    const category = asset.category || "other";
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.count++;
      existing.value += asset.estimated_value || 0;
    } else {
      acc.push({
        name: category.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
        count: 1,
        value: asset.estimated_value || 0,
        fill: getCategoryColor(category),
      });
    }
    return acc;
  }, [] as Array<{ name: string; count: number; value: number; fill: string }>);

  // Calculate asset value distribution by recipients
  const recipientValueData = recipients.map(recipient => {
    const totalValue = assetAllocations
      .filter(allocation => allocation.recipient_id === recipient.id)
      .reduce((sum, allocation) => {
        const asset = assets.find(a => a.id === allocation.asset_id);
        if (asset && asset.estimated_value) {
          const allocatedValue = (asset.estimated_value * allocation.allocation_percentage) / 100;
          return sum + allocatedValue;
        }
        return sum;
      }, 0);

    return {
      name: recipient.full_name,
      value: totalValue,
      fill: getRecipientColor(recipient.id),
    };
  })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      property: "#8b5cf6",
      investment: "#06b6d4",
      bank_account: "#10b981",
      vehicle: "#f59e0b",
      jewelry: "#ec4899",
      digital_asset: "#6366f1",
      insurance: "#14b8a6",
      business: "#f97316",
      other: "#64748b",
    };
    return colors[category] || "#64748b";
  }

  function getRecipientColor(recipientId: string): string {
    // Modern, professional color palette
    const colors = [
      "#fbbf24", // gold
      "#1e3a8a", // navy
      "#065f46", // sage-dark
      "#8b5cf6", // purple
      "#06b6d4", // cyan
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // green
    ];
    // Use a simple hash to consistently assign colors
    let hash = 0;
    for (let i = 0; i < recipientId.length; i++) {
      hash = recipientId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Display currency exactly as stored/entered (no conversion)
  const formatINR = (value: number) => {
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0, minimumFractionDigits: 0 })}`;
  };

  const chartConfig = {
    count: {
      label: "Count",
    },
    value: {
      label: "Value",
    },
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return t("dashboard.draft");
      case "in_progress": return t("dashboard.inProgress");
      case "review": return t("dashboard.underReview");
      case "completed": return t("dashboard.completed");
      default: return status;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const updated = new Date(date);
    const diff = now.getTime() - updated.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return days === 1 
        ? t("dashboard.dayAgo", { count: days })
        : t("dashboard.daysAgo", { count: days });
    }
    if (hours > 0) {
      return hours === 1
        ? t("dashboard.hourAgo", { count: hours })
        : t("dashboard.hoursAgo", { count: hours });
    }
    return t("dashboard.justNow");
  };

  const getWillIcon = (type: string) => {
    switch (type) {
      case "video":
        return Video;
      case "audio":
        return Mic;
      case "note":
      case "text":
        return NotebookPen;
      case "manual":
        return FilePenLine;
      default:
        return FileText;
    }
  };

  const getWillTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return t("dashboard.videoWill") || "Video Will";
      case "audio":
        return t("dashboard.audioWill") || "Audio Will";
      case "manual":
        return t("dashboard.manualWill") || "Manual Will";
      case "note":
      case "text":
        return t("dashboard.noteWill") || "Note Will";
      default:
        return t("dashboard.will");
    }
  };

  const getWillCardGradient = (type: string) => {
    switch (type) {
      case "video":
        return "from-navy to-navy-light";
      case "audio":
        return "from-gold to-gold-light";
      case "manual":
        return "from-blue-600 to-indigo-600";
      case "note":
      case "text":
        return "from-sage-dark to-sage";
      default:
        return "from-gold to-gold-light";
    }
  };

  const getWillPreview = (will: Will) => {
    if (will.transcript) {
      return will.transcript.length > 100 
        ? will.transcript.substring(0, 100) + "..." 
        : will.transcript;
    }
    if (will.content) {
      return will.content.length > 100 
        ? will.content.substring(0, 100) + "..." 
        : will.content;
    }
    if (will.notes) {
      return will.notes.length > 100 ? will.notes.substring(0, 100) + "…" : will.notes;
    }
    if (will.audio_url) {
      return t("dashboard.audioRecordingAvailable") || "Audio recording available";
    }
    if (will.video_url) {
      return t("dashboard.videoRecordingAvailable") || "Video recording available";
    }
    return t("dashboard.noContentYet") || "No content yet";
  };

  const hasWillContent = (will: Will) => {
    return !!(will.content || will.transcript || will.audio_url || will.video_url || will.notes);
  };

  const quickActions = [
    { icon: Mic, label: t("dashboard.recordAudio"), href: "/create/audio", color: "from-gold to-gold-light" },
    { icon: Video, label: t("dashboard.recordVideo"), href: "/create/video", color: "from-navy to-navy-light" },
    { icon: FilePenLine, label: t("dashboard.fillForm"), href: "/create/manual", color: "from-blue-600 to-indigo-600" },
    { icon: NotebookPen, label: t("dashboard.writeNote"), href: "/create/note", color: "from-sage-dark to-sage" },
    { icon: FolderOpen, label: t("dashboard.manageAssets"), href: "/assets", color: "from-gold to-gold-light" },
  ];

  const stats = [
    { label: t("dashboard.totalAssets"), value: assetCount.toString(), icon: FolderOpen },
    { label: t("dashboard.recipients"), value: recipientCount.toString(), icon: Users },
    { label: t("dashboard.activeWills"), value: willsVisibleOnDashboard.length.toString(), icon: FileText },
    { label: t("dashboard.secure"), value: t("common.yes"), icon: Shield },
  ];

  const userName = user?.user_metadata?.full_name?.split(" ")[0] || t("common.there") || "there";

  const workspaceLinks = [
    { to: "/wills", icon: FileText, title: t("dashboard.workspaceWills"), desc: t("dashboard.workspaceWillsDesc") },
    { to: "/recipients", icon: Users, title: t("dashboard.workspaceRecipients"), desc: t("dashboard.workspaceRecipientsDesc") },
    { to: "/assets", icon: FolderOpen, title: t("dashboard.workspaceAssets"), desc: t("dashboard.workspaceAssetsDesc") },
    { to: "/review", icon: FileCheck, title: t("dashboard.workspaceReview"), desc: t("dashboard.workspaceReviewDesc") },
    { to: "/account", icon: UserCircle, title: t("dashboard.workspaceAccount"), desc: t("dashboard.workspaceAccountDesc") },
  ];

  if (loading) {
    return (
      <div className="min-h-screen page-ambient bg-background flex items-center justify-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Loader2 className="relative h-7 w-7 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-5 pb-12 md:p-6 max-mobile:p-3 max-mobile:pb-8">
        <div className="app-shell max-w-6xl">
          {/* Welcome — split hero + illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 max-mobile:mb-6"
          >
            <div className="overflow-hidden rounded-[2rem] border-2 border-border/50 bg-gradient-to-br from-card/90 via-card/70 to-muted/30 p-6 shadow-soft backdrop-blur-md max-mobile:p-4 md:p-8">
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.88fr)] lg:gap-10">
                <div>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <ThreeDLogo className="scale-90" />
                    <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Legacy Control Center
                    </div>
                  </div>
                  <h1 className="heading-section mb-3 max-w-xl text-balance text-foreground max-mobile:text-lg">
                    {t("dashboard.welcomeBack", { name: userName })}
                  </h1>
                  <p className="max-w-lg text-pretty text-muted-foreground max-mobile:text-xs md:text-sm">
                    {t("dashboard.manageLegacy")}
                  </p>
                </div>
                <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
                  <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/15 blur-2xl" aria-hidden />
                  <div className="pointer-events-none absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-accent/20 blur-2xl" aria-hidden />
                  <DashboardHero3DAccent className="relative z-[1] min-h-[200px]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Workspace hub — quick links to main app areas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8 max-mobile:mb-6"
          >
            <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-foreground max-mobile:text-base">{t("dashboard.workspaceHub")}</h2>
                <p className="text-sm text-muted-foreground max-mobile:text-xs">{t("dashboard.workspaceHubSubtitle")}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {workspaceLinks.map((item) => (
                <Link key={item.to} to={item.to}>
                  <div className="card-interactive group flex h-full min-h-[120px] flex-col items-start gap-2 rounded-2xl p-5 ring-1 ring-border/40 transition-all hover:ring-primary/35">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/25 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Snapshot + create — bento */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 max-mobile:mb-6"
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
              <div className="lg:col-span-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("dashboard.bentoOverview")}</p>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {stats.map((stat, i) => (
                    <div
                      key={stat.label}
                      className="card-elevated group relative overflow-hidden text-center transition-transform duration-300 hover:-translate-y-0.5 max-mobile:px-2 max-mobile:py-3"
                    >
                      <div
                        className="pointer-events-none absolute inset-0 opacity-40"
                        style={{
                          background:
                            i % 2 === 0
                              ? "radial-gradient(circle at 20% 20%, hsl(var(--primary)/0.18), transparent 55%)"
                              : "radial-gradient(circle at 80% 30%, hsl(var(--accent)/0.15), transparent 55%)",
                        }}
                        aria-hidden
                      />
                      <stat.icon className="relative z-[1] mx-auto mb-2 h-6 w-6 text-primary max-mobile:h-5 max-mobile:w-5" />
                      <p className="relative z-[1] font-serif text-2xl font-semibold text-foreground max-mobile:text-lg">{stat.value}</p>
                      <p className="relative z-[1] text-sm text-muted-foreground max-mobile:text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-7">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("dashboard.quickActions")}</p>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
                  {quickActions.map((action) => (
                    <Link key={action.label} to={action.href}>
                      <div className="card-interactive group flex h-full flex-col items-center rounded-2xl py-6 ring-1 ring-border/30 transition-all duration-300 hover:ring-primary/35 max-mobile:py-5">
                        <div
                          className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${action.color} shadow-md transition-transform duration-300 group-hover:scale-105 max-mobile:h-12 max-mobile:w-12`}
                        >
                          <action.icon className="h-7 w-7 text-primary-foreground max-mobile:h-6 max-mobile:w-6" />
                        </div>
                        <span className="text-center text-sm font-medium text-foreground max-mobile:text-xs">{action.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <DashboardTutorialCarousel />

          {/* Analytics Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 max-mobile:mb-6"
          >
            <div className="dashboard-analytics-header flex items-center gap-2 mb-4 max-mobile:mb-3">
              <BarChart3 className="w-5 h-5 text-primary shrink-0 max-mobile:w-4 max-mobile:h-4" />
              <h2 className="font-serif text-xl font-semibold text-foreground max-mobile:text-base">{t("dashboard.analytics")}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-mobile:gap-4 mb-8">
              {/* Will Completion Progress */}
              <Card className="card-elevated dashboard-analytics-card max-mobile:overflow-hidden">
                <CardHeader className="max-mobile:px-4 max-mobile:py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2 max-mobile:flex-col">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center gap-2 text-base max-mobile:text-sm">
                        <TrendingUp className="w-5 h-5 text-primary shrink-0 max-mobile:w-4 max-mobile:h-4" />
                        <span className="truncate">{t("dashboard.willCompletionProgress")}</span>
                      </CardTitle>
                      <CardDescription className="mt-2 text-sm max-mobile:text-xs">
                        {t("dashboard.ofWillsCompleted", { completed: completedWills, total: totalWills })}
                      </CardDescription>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-bold text-foreground max-mobile:text-2xl">{completionPercentage}%</div>
                      <div className="text-sm text-muted-foreground max-mobile:text-xs">{t("dashboard.completionRate")}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="max-mobile:px-4 max-mobile:pt-0 max-mobile:pb-4">
                  <div className="space-y-4 max-mobile:space-y-3">
                    <Progress 
                      value={completionPercentage} 
                      className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" 
                    />
                    <div className="space-y-3">
                      {willStatusData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="chart-container-mobile h-[200px] max-mobile:h-[160px] w-full max-w-full min-w-0 overflow-hidden !aspect-auto">
                          <RechartsPieChart>
                            <Pie
                              data={willStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={pieOuterRadius}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {willStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </RechartsPieChart>
                        </ChartContainer>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No will data available</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 max-mobile:gap-1.5 max-mobile:pt-1.5">
                      {willStatusData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2 text-sm max-mobile:text-xs">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-muted-foreground">{item.name}:</span>
                          <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Distribution by Category */}
              <Card className="card-elevated dashboard-analytics-card max-mobile:overflow-hidden">
                <CardHeader className="max-mobile:px-4 max-mobile:py-3">
                  <CardTitle className="flex items-center gap-2 text-base max-mobile:text-sm">
                    <PieChart className="w-5 h-5 text-primary shrink-0 max-mobile:w-4 max-mobile:h-4" />
                    <span className="truncate">{t("dashboard.assetDistributionByCategory")}</span>
                  </CardTitle>
                  <CardDescription className="text-sm max-mobile:text-xs">
                    {t("dashboard.totalAssetsAcross", { count: assetCount, categories: assetCategoryData.length })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-mobile:px-4 max-mobile:pt-0 max-mobile:pb-4">
                  {assetCategoryData.length > 0 ? (
                    <ChartContainer config={chartConfig} className="chart-container-mobile h-[200px] max-mobile:h-[160px] w-full max-w-full min-w-0 overflow-hidden !aspect-auto">
                      <RechartsPieChart>
                        <Pie
                          data={assetCategoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={pieOuterRadius}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {assetCategoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </RechartsPieChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No assets available</p>
                    </div>
                  )}
                  <div className="mt-4 space-y-2">
                    {assetCategoryData.slice(0, 4).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-foreground">{item.count}</span>
                          {item.value > 0 && (
                            <span className="text-muted-foreground text-xs">
                              {formatINR(item.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Asset Value Distribution by Recipients */}
            {recipientValueData.length > 0 && (
              <Card className="card-elevated border-2 border-border/50 mt-8">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-3 text-xl flex-wrap">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <span>{t("dashboard.assetValueByRecipients")}</span>
                      </CardTitle>
                      <CardDescription className="text-base">
                        {t("dashboard.totalValueAllocated", {
                          value: formatINR(recipientValueData.reduce((sum, item) => sum + item.value, 0)),
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 px-6 pb-6">
                  <ChartContainer config={chartConfig} className="h-[320px] w-full">
                    <BarChart 
                      data={recipientValueData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <defs>
                        {recipientValueData.map((entry, index) => {
                          const recipient = recipients.find(r => r.full_name === entry.name);
                          const baseColor = recipient ? getRecipientColor(recipient.id) : entry.fill;
                          return (
                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={baseColor} stopOpacity={1} />
                              <stop offset="100%" stopColor={baseColor} stopOpacity={0.75} />
                            </linearGradient>
                          );
                        })}
                      </defs>
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ 
                          fontSize: 13,
                          fill: "hsl(var(--muted-foreground))",
                          fontWeight: 500
                        }}
                        interval={0}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ 
                          fontSize: 12,
                          fill: "hsl(var(--muted-foreground))",
                          fontWeight: 500
                        }}
                        tickFormatter={(value) => {
                          const inr = value * USD_TO_INR;
                          if (inr >= 10000000) {
                            return `₹${(inr / 10000000).toFixed(1)}Cr`;
                          } else if (inr >= 100000) {
                            return `₹${(inr / 100000).toFixed(1)}L`;
                          } else if (inr >= 1000) {
                            return `₹${(inr / 1000).toFixed(0)}k`;
                          }
                          return `₹${inr}`;
                        }}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            const recipient = recipients.find(r => r.full_name === data.payload.name);
                            const color = recipient ? getRecipientColor(recipient.id) : data.payload.fill;
                            return (
                              <div className="rounded-lg border border-border bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                <div className="flex items-center gap-2.5 mb-2">
                                  <div
                                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-semibold text-foreground text-sm">{data.payload.name}</span>
                                </div>
                                <div className="text-xl font-bold text-foreground">
                                  {formatINR(Number(data.value))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[12, 12, 0, 0]}
                        barSize={65}
                      >
                        {recipientValueData.map((entry, index) => {
                          const recipient = recipients.find(r => r.full_name === entry.name);
                          const color = recipient ? getRecipientColor(recipient.id) : entry.fill;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#gradient-${index})`}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                  <div className="mt-6 pt-5 border-t border-border/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {recipientValueData.map((item) => {
                        const recipient = recipients.find(r => r.full_name === item.name);
                        const color = recipient ? getRecipientColor(recipient.id) : item.fill;
                        return (
                          <div 
                            key={item.name} 
                            className="flex items-center justify-between p-3.5 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-all duration-200 border border-border/30 hover:border-border/50 hover:shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-foreground ml-3 whitespace-nowrap">
                              {formatINR(item.value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Recipients + Wills — two columns on xl */}
          <div className="mb-8 grid grid-cols-1 gap-10 xl:grid-cols-2 xl:gap-8 xl:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="min-w-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-foreground">{t("dashboard.recipients")}</h2>
              <Link to="/recipients">
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="w-4 h-4" />
                  {t("common.manage")}
                </Button>
              </Link>
            </div>

            {recipients.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="card-elevated">
                    <div className="flex items-start gap-3 mb-3">
                      {recipient.image_url ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-border">
                          <img 
                            src={recipient.image_url} 
                            alt={recipient.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initial if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.innerHTML = `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center flex-shrink-0"><span class="text-primary font-semibold text-sm">${recipient.full_name.charAt(0).toUpperCase()}</span></div>`;
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center flex-shrink-0">
                          <span className="text-primary font-semibold text-sm">
                            {recipient.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{recipient.full_name}</h3>
                        {recipient.relationship && (
                          <p className="text-sm text-muted-foreground capitalize">
                            {recipient.relationship}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-border">
                      {recipient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground truncate">{recipient.email}</span>
                        </div>
                      )}
                      {recipient.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{recipient.phone}</span>
                        </div>
                      )}
                      {!recipient.email && !recipient.phone && (
                        <p className="text-sm text-muted-foreground">{t("dashboard.noContactInformation")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-elevated text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{t("dashboard.noRecipientsYet")}</h3>
                <p className="text-muted-foreground mb-4">{t("dashboard.addRecipientsToWill")}</p>
                <Link to="/recipients">
                  <Button variant="gold" className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t("dashboard.addRecipients")}
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="min-w-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-foreground">{t("dashboard.myWills")}</h2>
              <div className="flex items-center gap-2">
                {willsVisibleOnDashboard.length > 0 && (
                  <Button
                    variant={isManagingWills ? "outline" : "ghost"}
                    size="sm"
                    onClick={toggleManageMode}
                    className="gap-2"
                  >
                    {isManagingWills ? (
                      <>
                        <X className="w-4 h-4" />
                        Cancel
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        Manage
                      </>
                    )}
                  </Button>
                )}
                {!isManagingWills && (
                  <Link to="/create">
                    <Button variant="gold" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      {t("dashboard.newWill")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Manage Mode Controls */}
            {isManagingWills && willsVisibleOnDashboard.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={
                      willsVisibleOnDashboard.length > 0 &&
                      selectedWills.size === willsVisibleOnDashboard.length
                    }
                    onChange={selectAllWills}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedWills.size === 0
                      ? "Select wills to delete"
                      : `${selectedWills.size} will${selectedWills.size > 1 ? "s" : ""} selected`}
                  </span>
                </div>
                {selectedWills.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteWills}
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete {selectedWills.size > 1 ? `(${selectedWills.size})` : ""}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {willsVisibleOnDashboard.map((will) => {
                const WillIcon = getWillIcon(will.type);
                const hasContent = hasWillContent(will);
                const preview = getWillPreview(will);
                const isSelected = selectedWills.has(will.id);
                
                const WillContent = (
                  <div className={`card-interactive p-5 hover:shadow-lg transition-all duration-200 ${
                    isManagingWills ? "cursor-pointer" : ""
                  } ${isSelected ? "ring-2 ring-primary/60" : ""}`}>
                    <div className="flex items-start gap-4">
                      {/* Checkbox for manage mode */}
                      {isManagingWills && (
                        <div className="flex items-center pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleWillSelection(will.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded border-border cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Will Type Icon */}
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${getWillCardGradient(will.type)}`}
                      >
                        <WillIcon className="w-7 h-7 text-primary-foreground" />
                      </div>

                        {/* Will Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="font-semibold text-foreground truncate">{will.title}</h3>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                  will.status === "completed"
                                    ? "bg-sage/20 text-sage-dark" 
                                    : will.status === "in_progress"
                                    ? "bg-primary/12 text-primary"
                                    : will.status === "review"
                                    ? "bg-blue-500/20 text-blue-600"
                                    : "bg-secondary text-muted-foreground"
                                }`}>
                                  {getStatusLabel(will.status)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                <span className="flex items-center gap-1.5">
                                  <WillIcon className="w-3.5 h-3.5" />
                                  {getWillTypeLabel(will.type)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {getTimeAgo(will.updated_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Will Content Preview */}
                          {hasContent && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {preview}
                              </p>
                            </div>
                          )}

                          {(will.audio_url || will.video_url) && (
                            <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
                              <Play className="w-3.5 h-3.5 shrink-0 text-primary" aria-hidden />
                              <span>
                                {t("dashboard.openWillForMedia") ||
                                  "Open this will to watch or listen to your recording."}
                              </span>
                            </p>
                          )}

                          {/* Will Status Indicators */}
                          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                            {hasContent && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <CheckCircle className="w-3.5 h-3.5 text-sage-dark" />
                                <span>{t("dashboard.contentAdded") || "Content Added"}</span>
                              </div>
                            )}
                            {will.notes && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <FileText className="w-3.5 h-3.5 text-primary" />
                                <span>{t("dashboard.hasNotes") || "Has Notes"}</span>
                              </div>
                            )}
                            {!hasContent && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{t("dashboard.noContent") || "No content yet"}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {!isManagingWills && (
                          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                );
                
                return isManagingWills ? (
                  <div key={will.id} onClick={() => toggleWillSelection(will.id)}>
                    {WillContent}
                  </div>
                ) : (
                  <Link key={will.id} to={`/will/${will.id}`}>
                    {WillContent}
                  </Link>
                );
              })}

              {/* Empty State */}
              {willsVisibleOnDashboard.length === 0 && (
                <div className="card-elevated text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{t("dashboard.noWillsYet")}</h3>
                  <p className="text-muted-foreground mb-4">{t("dashboard.createFirstWill")}</p>
                  <Link to="/create">
                    <Button variant="gold" className="gap-2">
                      <Plus className="w-4 h-4" />
                      {t("dashboard.createYourFirstWill")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
