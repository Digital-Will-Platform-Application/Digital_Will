import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Mic,
  Video,
  FilePenLine,
  NotebookPen,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Play,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { backendApi } from "@/lib/backendApi";
import { useTranslation } from "react-i18next";

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

const WillManagement = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [wills, setWills] = useState<Will[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) {
      setWills([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchWills();
  }, [user?.id, user?.email]);

  const fetchWills = async () => {
    if (!user?.email) {
      setWills([]);
      setLoading(false);
      return;
    }
    try {
      const userIdNum = Number(user.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;
      const result = await backendApi.listWills(
        useUserId ? {user_id: userIdNum} : {user_email: user.email}
      );
      const rows = Array.isArray(result.data) ? result.data : [];
      const mapped: Will[] = rows
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
      setWills(mapped);
    } catch {
      setWills([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return t("dashboard.draft") ?? "Draft";
      case "in_progress":
        return t("dashboard.inProgress") ?? "In progress";
      case "review":
        return t("dashboard.underReview") ?? "Under review";
      case "completed":
        return t("dashboard.completed") ?? "Completed";
      default:
        return status;
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
        ? (t("dashboard.dayAgo", { count: days }) as string) ?? "1 day ago"
        : (t("dashboard.daysAgo", { count: days }) as string) ?? `${days} days ago`;
    }
    if (hours > 0) {
      return hours === 1
        ? (t("dashboard.hourAgo", { count: hours }) as string) ?? "1 hour ago"
        : (t("dashboard.hoursAgo", { count: hours }) as string) ?? `${hours} hours ago`;
    }
    return (t("dashboard.justNow") as string) ?? "Just now";
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
      case "chat":
        return FilePenLine;
      default:
        return FileText;
    }
  };

  const getWillTypeLabel = (type: string) => {
    switch (type) {
      case "video":
        return t("dashboard.videoWill") ?? "Video Will";
      case "audio":
        return t("dashboard.audioWill") ?? "Audio Will";
      case "chat":
        return t("dashboard.textWill") ?? "Text Will";
      case "manual":
        return t("dashboard.manualWill") ?? "Manual Will";
      case "note":
      case "text":
        return t("dashboard.noteWill") ?? "Note Will";
      default:
        return t("dashboard.will") ?? "Will";
    }
  };

  const getWillCardGradient = (type: string) => {
    switch (type) {
      case "video":
        return "from-navy to-navy-light";
      case "audio":
        return "from-gold to-gold-light";
      case "manual":
      case "chat":
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
      return will.transcript.length > 100 ? will.transcript.slice(0, 100) + "…" : will.transcript;
    }
    if (will.content) {
      return will.content.length > 100 ? will.content.slice(0, 100) + "…" : will.content;
    }
    if (will.notes) {
      return will.notes.length > 100 ? will.notes.slice(0, 100) + "…" : will.notes;
    }
    if (will.audio_url) return t("dashboard.audioRecordingAvailable") ?? "Audio recording available";
    if (will.video_url) return t("dashboard.videoRecordingAvailable") ?? "Video recording available";
    return "";
  };

  const hasWillContent = (will: Will) => {
    return !!(will.content || will.transcript || will.audio_url || will.video_url || will.notes);
  };

  if (loading) {
    return (
      <div className="ui-full-page-loader">
        <div className="ui-loader-ring">
          <span className="ui-loader-ring-border" />
          <span className="ui-loader-ring-core" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
                Will Management
              </h1>
              <Link to="/create">
                <Button variant="gold" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t("dashboard.newWill") ?? "New Will"}
                </Button>
              </Link>
            </div>
            <p className="text-muted-foreground text-sm">
              View and manage all your wills. Open any will to view or edit.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {wills.length === 0 ? (
              <div className="card-elevated text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                  {t("dashboard.noWillsYet") ?? "No wills yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("dashboard.createFirstWill") ?? "Create your first will to get started."}
                </p>
                <Link to="/create">
                  <Button variant="gold" className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t("dashboard.createYourFirstWill") ?? "Create your first will"}
                  </Button>
                </Link>
              </div>
            ) : (
              wills.map((will) => {
                const WillIcon = getWillIcon(will.type);
                const hasContent = hasWillContent(will);
                const preview = getWillPreview(will);
                return (
                  <Link key={will.id} to={`/will/${will.id}`}>
                    <div className="card-interactive p-5 hover:shadow-lg transition-all duration-200 flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${getWillCardGradient(will.type)}`}
                      >
                        <WillIcon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-foreground truncate">{will.title}</h3>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                              will.status === "completed"
                                ? "bg-sage/20 text-sage-dark"
                                : will.status === "in_progress"
                                ? "bg-gold/20 text-gold"
                                : will.status === "review"
                                ? "bg-blue-500/20 text-blue-600"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {getStatusLabel(will.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <WillIcon className="w-3.5 h-3.5" />
                            {getWillTypeLabel(will.type)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {getTimeAgo(will.updated_at)}
                          </span>
                          {hasContent && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <CheckCircle className="w-3.5 h-3.5 text-sage-dark" />
                              Content added
                            </span>
                          )}
                          {!hasContent && (
                            <span className="flex items-center gap-1.5 text-xs">
                              <AlertCircle className="w-3.5 h-3.5" />
                              No content yet
                            </span>
                          )}
                        </div>
                        {hasContent && preview ? (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mt-3 pt-3 border-t border-border">
                            {preview}
                          </p>
                        ) : null}
                        {(will.audio_url || will.video_url) ? (
                          <p className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex items-center gap-1.5">
                            <Play className="w-3.5 h-3.5 shrink-0 text-primary" aria-hidden />
                            <span>
                              {t("dashboard.openWillForMedia") ||
                                "Open this will to watch or listen to your recording."}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default WillManagement;
