import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Check,
  Shield,
  FileText,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const CreateAudioWill = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log("Data chunk received:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error("MediaRecorder error:", event);
        toast.error("Recording error occurred");
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setHasRecording(true);
      };

      // Start recording with timeslice to get data periodically
      mediaRecorder.start(1000); // Get data every second
      setIsRecording(true);
      console.log("Recording started");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success("Recording started");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Unable to access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording || !user) {
      toast.error("Please start recording first");
      return;
    }

    setIsSaving(true);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Create a promise that resolves when the blob is ready
    const blobPromise = new Promise<Blob>((resolve, reject) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = () => {
          console.log("MediaRecorder stopped, chunks:", audioChunksRef.current.length);
          
          if (audioChunksRef.current.length === 0) {
            reject(new Error("No audio data was recorded"));
            return;
          }
          
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          console.log("Blob created from", audioChunksRef.current.length, "chunks, size:", audioBlob.size);
          
          setRecordedBlob(audioBlob);
          setHasRecording(true);
          
          // Stop all media tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          resolve(audioBlob);
        };
        
        // Stop recording
        console.log("Stopping MediaRecorder...");
        mediaRecorderRef.current.stop();
      } else {
        reject(new Error("No media recorder available"));
      }
    });

    setIsRecording(false);
    setIsPaused(false);

    try {
      // Wait for the blob to be ready
      const audioBlob = await Promise.race([
        blobPromise,
        new Promise<Blob>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout waiting for recording")), 5000)
        )
      ]);

      console.log("Audio blob created:", audioBlob?.size, "bytes");

      if (!audioBlob || audioBlob.size === 0) {
        throw new Error("Recording failed - no audio data captured");
      }

      // Upload audio to Cloudflare R2 storage
      if (!user?.email) {
        throw new Error("User email is required. Please log in again.");
      }

      console.log("Uploading audio to Cloudflare R2...", { userEmail: user.email, blobSize: audioBlob.size });
      
      const { backendApi } = await import("@/lib/backendApi");
      const uploadResult = await backendApi.uploadAudio({
        user_email: user.email,
        audioFile: audioBlob,
        staging: true // Use staging bucket in development
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || "Failed to upload audio to R2");
      }

      console.log("Upload successful to R2:", uploadResult.data?.upload?.url);
      toast.success("Audio saved successfully to Cloudflare R2!");

      console.log("Save completed successfully!");
      setIsSaved(true);
      toast.success("Recording stopped and saved successfully!");
    } catch (error: any) {
      console.error("Error saving audio:", error);
      const errorMessage = error?.message || String(error);
      toast.error(`Failed to save: ${errorMessage}`);
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseResume = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const handleReset = () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setHasRecording(false);
    setRecordedBlob(null);
    setIsSaved(false);
    audioChunksRef.current = [];
  };

  const handleContinue = () => {
    navigate("/assets?flow=true");
  };

  const prompts = [
    "Start by introducing yourself and stating your full name and date.",
    "Describe your wishes for your personal belongings.",
    "Specify any special instructions for your digital assets.",
    "Share any final messages for your loved ones.",
  ];

  return (
    <div className="min-h-screen page-ambient bg-background">
      <main className="p-6 pb-12">
        <div className="app-shell max-w-3xl">
          {/* Back Button */}
          <Link to="/create" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Method Selection
          </Link>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`progress-step ${step === 2 ? "progress-step-active" : step < 2 ? "progress-step-completed" : "progress-step-pending"}`}>
                  {step < 2 ? <Check className="w-4 h-4" /> : step}
                </div>
                {step < 4 && <div className="w-8 h-0.5 bg-border" />}
              </div>
            ))}
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="heading-section text-foreground mb-4">
              {t("dashboard.recordAudio")}
            </h1>
            <p className="body-large max-w-xl mx-auto">
              Speak naturally and share your wishes. We'll transcribe everything for you.
            </p>
          </motion.div>

          {/* Recording Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated text-center mb-8"
          >
            {/* Recording Button */}
            {!isRecording && !isSaved && (
              <div className="relative inline-block mb-6">
                <button
                  onClick={handleStartRecording}
                  disabled={isSaving}
                  className="w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 bg-gradient-to-br from-gold to-gold-light shadow-gold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-12 h-12 text-primary" />
                </button>
              </div>
            )}

            {/* Timer */}
            <p className="font-mono text-4xl font-semibold text-foreground mb-4">
              {formatTime(recordingTime)}
            </p>

            {/* Status Text */}
            <p className="text-muted-foreground mb-6">
              {isSaving 
                ? "Saving recording..." 
                : isRecording 
                  ? isPaused 
                    ? "Recording paused" 
                    : "Recording in progress..."
                  : isSaved
                    ? "Recording saved successfully!"
                    : hasRecording 
                      ? "Recording complete" 
                      : "Click the button above to start recording"
              }
            </p>

            {/* Controls */}
            <div className="flex flex-col items-center justify-center gap-4">
              {isRecording && (
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePauseResume}
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleStopRecording}
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <MicOff className="w-4 h-4" />
                        Stop and Save
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {!isSaved && !isRecording && hasRecording && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleReset}
                  className="gap-2"
                  disabled={isSaving}
                >
                  <RotateCcw className="w-4 h-4" />
                  Start Over
                </Button>
              )}
            </div>
          </motion.div>

          {/* Prompts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gold" />
              <h3 className="font-serif text-lg font-semibold text-foreground">Suggested Topics</h3>
            </div>
            <ul className="space-y-3">
              {prompts.map((prompt, index) => (
                <li key={index} className="flex items-start gap-3 text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  {prompt}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <Link to="/create">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Encrypted
              </p>
              <Button 
                variant="gold" 
                className="gap-2" 
                disabled={!isSaved || isSaving}
                onClick={handleContinue}
              >
                Continue to Assets
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreateAudioWill;
