import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Mic,
  Video,
  FilePenLine,
  Clock,
  Loader2,
  Edit,
  Shield,
  CheckCircle,
  AlertCircle,
  Play,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Will {
  id: string;
  title: string;
  type: "audio" | "video" | "text" | "chat" | "manual";
  status: string;
  content: string | null;
  audio_url: string | null;
  video_url: string | null;
  transcript: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const WillDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [will, setWill] = useState<Will | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user && id) {
      fetchWill();
    }
  }, [user, id]);

  const fetchWill = async () => {
    if (!id || !user) return;

    try {
      const base = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
      const userIdNum = Number(user.id);
      const useUserId = Number.isFinite(userIdNum) && userIdNum > 0;
      const url = useUserId
        ? `${base}/api/wills/${encodeURIComponent(id)}?user_id=${userIdNum}`
        : `${base}/api/wills/${encodeURIComponent(id)}?user_email=${encodeURIComponent(user.email)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json?.success || !json?.data) {
        toast.error(t("willDetail.willNotFound") || "Will not found");
        navigate("/dashboard");
        return;
      }

      const data = json.data as Will;
      setWill(data);
      // R2 URLs are already public URLs from backend
      setAudioUrl(data.audio_url || null);
      setVideoUrl(data.video_url || null);
    } catch (error) {
      console.error("Error fetching will:", error);
      toast.error(t("willDetail.failedToLoad") || "Failed to load will");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getWillIcon = () => {
    if (!will) return FileText;
    switch (will.type) {
      case "video":
        return Video;
      case "audio":
        return Mic;
      case "manual":
      case "text":
      case "chat":
        return FilePenLine;
      default:
        return FileText;
    }
  };

  const getWillTypeLabel = () => {
    if (!will) return "";
    switch (will.type) {
      case "video":
        return t("willDetail.videoWill") || "Video Will";
      case "audio":
        return t("willDetail.audioWill") || "Audio Will";
      case "chat":
        return t("willDetail.textWill") || "Text Will";
      case "manual":
      case "text":
        return t("willDetail.manualWill") || "Manual Will";
      default:
        return t("dashboard.will");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return t("dashboard.draft");
      case "in_progress":
        return t("dashboard.inProgress");
      case "review":
        return t("dashboard.underReview");
      case "completed":
        return t("dashboard.completed");
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-sage/20 text-sage-dark";
      case "in_progress":
        return "bg-gold/20 text-gold";
      case "review":
        return "bg-blue-500/20 text-blue-600";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (!will) {
    return (
      <div className="min-h-screen page-ambient bg-background">
        <main className="p-6 pb-12">
          <div className="app-shell max-w-4xl text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="heading-section text-foreground mb-2">
              {t("willDetail.willNotFound") || "Will Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t("willDetail.willNotFoundDescription") || "The will you're looking for doesn't exist or you don't have access to it."}
            </p>
            <Link to="/dashboard">
              <Button variant="gold">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t("willDetail.backToDashboard") || "Back to Dashboard"}
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const WillIcon = getWillIcon();

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-4xl">
          {/* Back Button */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("willDetail.backToDashboard") || "Back to Dashboard"}
          </Link>

          {/* Will Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="card-elevated p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${
                      will.type === "video"
                        ? "from-navy to-navy-light"
                        : will.type === "manual" || will.type === "text" || will.type === "chat"
                        ? "from-blue-600 to-indigo-600"
                        : "from-gold to-gold-light"
                    }`}
                  >
                    <WillIcon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="heading-section text-foreground">{will.title}</h1>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(will.status)}`}>
                        {getStatusLabel(will.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <WillIcon className="w-4 h-4" />
                        {getWillTypeLabel()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {t("willDetail.lastUpdated") || "Last updated"}: {formatDate(will.updated_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        {t("willDetail.encrypted") || "256-bit Encrypted"}
                      </span>
                    </div>
                  </div>
                </div>
                <Link to="/review">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="w-4 h-4" />
                    {t("willDetail.edit") || "Edit"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Will Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Transcript/Content */}
            {(will.transcript || will.content) && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold" />
                    {t("willDetail.willContent") || "Will Content"}
                  </CardTitle>
                  <CardDescription>
                    {t("willDetail.contentDescription") || "The full content of your will"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {will.transcript || will.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Recording */}
            {will.audio_url && audioUrl && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-gold" />
                    {t("willDetail.audioRecording") || "Audio Recording"}
                  </CardTitle>
                  <CardDescription>
                    {t("willDetail.audioDescription") || "Listen to your recorded will"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <audio controls className="w-full">
                    <source src={audioUrl} type="audio/webm" />
                    <source src={audioUrl} type="audio/mpeg" />
                    {t("willDetail.audioNotSupported") || "Your browser does not support the audio element."}
                  </audio>
                  <div className="mt-4">
                    <a
                      href={audioUrl}
                      download
                      className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {t("willDetail.downloadAudio") || "Download Audio"}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Recording */}
            {will.video_url && videoUrl && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-gold" />
                    {t("willDetail.videoRecording") || "Video Recording"}
                  </CardTitle>
                  <CardDescription>
                    {t("willDetail.videoDescription") || "Watch your recorded will"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                    <video controls className="w-full h-full">
                      <source src={videoUrl} type="video/webm" />
                      <source src={videoUrl} type="video/mp4" />
                      {t("willDetail.videoNotSupported") || "Your browser does not support the video element."}
                    </video>
                  </div>
                  <div className="mt-4">
                    <a
                      href={videoUrl}
                      download
                      className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {t("willDetail.downloadVideo") || "Download Video"}
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {will.notes && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold" />
                    {t("willDetail.notes") || "Notes"}
                  </CardTitle>
                  <CardDescription>
                    {t("willDetail.notesDescription") || "Additional notes and information"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {will.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* No Content Message */}
            {!will.transcript && !will.content && !will.audio_url && !will.video_url && (
              <Card className="card-elevated">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
                    {t("willDetail.noContent") || "No Content Yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("willDetail.noContentDescription") || "This will doesn't have any content yet. Start creating your will to add content."}
                  </p>
                  <Link to="/create">
                    <Button variant="gold" className="gap-2">
                      <Edit className="w-4 h-4" />
                      {t("willDetail.createWill") || "Create Will Content"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Will Metadata */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold" />
                  {t("willDetail.willInformation") || "Will Information"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("willDetail.createdAt") || "Created At"}
                    </p>
                    <p className="font-medium text-foreground">{formatDate(will.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("willDetail.lastUpdated") || "Last Updated"}
                    </p>
                    <p className="font-medium text-foreground">{formatDate(will.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("willDetail.status") || "Status"}
                    </p>
                    <p className="font-medium text-foreground">{getStatusLabel(will.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t("willDetail.type") || "Type"}
                    </p>
                    <p className="font-medium text-foreground">{getWillTypeLabel()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default WillDetail;
