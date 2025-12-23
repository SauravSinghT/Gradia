import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import API_BASE_URL from "@/config";
import {
  Target,
  Sparkles,
  TrendingUp,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Save,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MaterialUploader, { UploadedFile } from "@/components/MaterialUploader";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from "pdfjs-dist";
import axios from "axios";

// PDF Worker Setup
pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// --- Types ---
interface PriorityTopic {
  id: string;
  name: string;
  importance: "critical" | "high" | "medium";
  frequency: number;
  chapters?: string[];
  explanation: string;
}

interface StudyContent {
  definition: string;
  keyConcepts: string[];
  example: string;
  examTips: string[];
}

interface HistoryItem {
  _id: string;
  title: string;
  historyType: string;
  data: {
    topics: PriorityTopic[];
    analysisDate?: string;
  };
  metadata: {
    totalTopics: number;
    subject?: string;
    uploadedFiles?: string[];
    analysisDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ViewMode {
  type: "upload" | "analyzing" | "results" | "detail" | "history" | "saved-topics";
  historyItem?: HistoryItem;
}

const PriorityTopics = () => {
  // ===== MAIN ANALYSIS STATES =====
  const [viewMode, setViewMode] = useState<ViewMode>({ type: "upload" });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topics, setTopics] = useState<PriorityTopic[]>([]);
  const [contextText, setContextText] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // ===== STUDY MODE STATES =====
  const [activeTopic, setActiveTopic] = useState<PriorityTopic | null>(null);
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null);
  const [isGeneratingStudy, setIsGeneratingStudy] = useState(false);

  // ===== SAVED TOPICS & HISTORY STATES =====
  const [savedTopics, setSavedTopics] = useState<PriorityTopic[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  const { toast } = useToast();

  // ===== MEMOIZED AXIOS INSTANCE =====
  const axiosInstance = useMemo(() => {
    const token = localStorage.getItem("token") || "";
    console.log("🔐 Token found:", !!token);
    console.log("📍 API Base URL:", API_BASE_URL);

    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Add response interceptor for debugging
    instance.interceptors.response.use(
      (response) => {
        console.log("✅ API Response:", response.status, response.data);
        return response;
      },
      (error) => {
        console.error("❌ API Error:", error.response?.status, error.response?.data);
        if (error.response?.status === 401) {
          console.warn("🔐 Unauthorized - Token may be expired");
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  // ===== PDF EXTRACTION =====
  const extractTextFromPDF = useCallback(async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }
      return fullText.trim();
    } catch (error) {
      console.error("PDF Error:", error);
      throw new Error("Failed to read PDF.");
    }
  }, []);

  // ===== FILE READING =====
  const readFileAsText = useCallback(
    async (file: File): Promise<string> => {
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        return extractTextFromPDF(file);
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      });
    },
    [extractTextFromPDF]
  );

  // ===== SAVE ANALYSIS TO HISTORY =====
  const saveToHistory = useCallback(
    async (topicsData: PriorityTopic[], files: UploadedFile[]) => {
      try {
        console.log("💾 Saving to history...", topicsData);

        const response = await axiosInstance.post("/history", {
          historyType: "priority_topic",
          title: `Analysis - ${new Date().toLocaleDateString()}`,
          description: `Analysis of ${files.length} documents`,
          data: {
            topics: topicsData,
            analysisDate: new Date().toISOString(),
          },
          metadata: {
            totalTopics: topicsData.length,
            uploadedFiles: files.map((f) => f.file.name),
            subject: "General",
          },
        });

        console.log("✅ Save response:", response.data);

        if (response.data.success) {
          setCurrentAnalysisId(response.data.data._id);
          return response.data.data._id;
        }
      } catch (error) {
        console.error("❌ Save to history error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save analysis.",
        });
      }
    },
    [axiosInstance, toast]
  );

  // ===== SAVE TOPIC TO PRIORITY TOPICS =====
  const saveTopicToPriority = useCallback(
    async (topic: PriorityTopic) => {
      setIsSavingTopic(true);
      try {
        console.log("💾 Saving topic to priority topics...", topic);

        const response = await axiosInstance.post("/priority-topics", {
          topic: topic.name,
          importance: topic.importance,
          frequency: topic.frequency,
          chapters: topic.chapters || [],
          explanation: topic.explanation,
          sourceAnalysisId: currentAnalysisId,
        });

        console.log("✅ Topic saved:", response.data);

        if (response.data.success) {
          toast({
            title: "Saved!",
            description: `${topic.name} added to Priority Topics.`,
          });
          // Add to local saved topics
          setSavedTopics([...savedTopics, topic]);
          return true;
        }
      } catch (error) {
        console.error("❌ Save topic error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save topic.",
        });
        return false;
      } finally {
        setIsSavingTopic(false);
      }
    },
    [axiosInstance, currentAnalysisId, savedTopics, toast]
  );

  // ===== FETCH HISTORY =====
  const fetchHistory = useCallback(async () => {
    console.log("📥 Fetching history...");
    setIsLoadingHistory(true);
    try {
      const response = await axiosInstance.get("/history", {
        params: {
          historyType: "priority_topic",
          limit: 50,
          sortBy: "-createdAt",
        },
      });

      console.log("✅ History response:", response.data);

      if (response.data.success) {
        console.log("📊 Setting history items:", response.data.data.length);
        setHistoryItems(response.data.data);
      }
    } catch (error) {
      console.error("❌ Fetch history error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch history.",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [axiosInstance, toast]);

  // ===== FETCH SAVED PRIORITY TOPICS =====
  const fetchSavedTopics = useCallback(async () => {
    console.log("📥 Fetching saved priority topics...");
    try {
      const response = await axiosInstance.get("/priority-topics");

      console.log("✅ Saved topics response:", response.data);

      if (response.data.success) {
        setSavedTopics(response.data.data);
      }
    } catch (error) {
      console.error("❌ Fetch saved topics error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch saved topics.",
      });
    }
  }, [axiosInstance, toast]);

  // ===== DELETE HISTORY ITEM =====
  const deleteHistoryItem = useCallback(
    async (historyId: string) => {
      try {
        const response = await axiosInstance.delete(`/history/${historyId}`);

        if (response.data.success) {
          setHistoryItems((items) => items.filter((item) => item._id !== historyId));
          toast({
            title: "Deleted!",
            description: "Analysis deleted successfully.",
          });
        }
      } catch (error) {
        console.error("❌ Delete error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete analysis.",
        });
      }
    },
    [axiosInstance, toast]
  );

  // ===== DELETE SAVED TOPIC =====
  const deleteSavedTopic = useCallback(
    async (topicId: string) => {
      try {
        const response = await axiosInstance.delete(`/priority-topics/${topicId}`);

        if (response.data.success) {
          setSavedTopics((topics) => topics.filter((t) => t.id !== topicId));
          toast({
            title: "Removed!",
            description: "Topic removed from Priority Topics.",
          });
        }
      } catch (error) {
        console.error("❌ Delete topic error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete topic.",
        });
      }
    },
    [axiosInstance, toast]
  );

  // ===== INITIAL PRIORITY ANALYSIS =====
  const handleAnalysisComplete = useCallback(
    async (files: UploadedFile[]) => {
      if (!API_KEY) {
        toast({ variant: "destructive", title: "Missing API Key" });
        return;
      }

      setViewMode({ type: "analyzing" });
      setIsAnalyzing(true);

      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        let combinedText = "";
        for (const fileObj of files) {
          const text = await readFileAsText(fileObj.file);
          combinedText += `\n--- Document: ${fileObj.file.name} ---\n${text.substring(0, 30000)}\n`;
        }

        if (combinedText.length < 50) {
          throw new Error("Not enough text extracted.");
        }

        setContextText(combinedText);
        setUploadedFiles(files.map((f) => f.file.name));

        const prompt = `
          You are an expert exam strategist. Analyze these study materials.
          Task: Identify 5-8 repeated, high-yield topics.
          
          Return JSON Array:
          [
            {
              "name": "Topic Name",
              "importance": "critical" | "high" | "medium",
              "frequency": 0-100,
              "chapters": ["Chapter X"],
              "explanation": "Brief reasoning why this is important."
            }
          ]
          
          Context: ${combinedText}
        `;

        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text());

        const aiTopics: PriorityTopic[] = data.map((t: any, index: number) => ({
          id: Date.now().toString() + index,
          name: t.name,
          importance: t.importance.toLowerCase() as "critical" | "high" | "medium",
          frequency: t.frequency,
          chapters: t.chapters || [],
          explanation: t.explanation,
        }));

        setTopics(aiTopics);

        // Save to history
        await saveToHistory(aiTopics, files);

        setViewMode({ type: "results" });
      } catch (error) {
        console.error("Analysis Error:", error);
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: error instanceof Error ? error.message : "Could not analyze files.",
        });
        setViewMode({ type: "upload" });
      } finally {
        setIsAnalyzing(false);
      }
    },
    [API_KEY, readFileAsText, toast, saveToHistory]
  );

  // ===== DEEP DIVE STUDY GENERATION =====
  const handleStudyTopic = useCallback(
    async (topic: PriorityTopic) => {
      if (!API_KEY) {
        toast({ variant: "destructive", title: "Missing API Key" });
        return;
      }

      setActiveTopic(topic);
      setIsGeneratingStudy(true);
      setStudyContent(null);

      try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `
          You are a personalized tutor. Create a detailed study guide for the topic: "${topic.name}".
          Use the provided context to ensure relevance to the uploaded syllabus.
          
          Return a single JSON object with this structure:
          {
            "definition": "Clear, concise academic definition (max 3 sentences)",
            "keyConcepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
            "example": "A concrete example, case study, or short code snippet illustrating the concept",
            "examTips": ["Tip 1 regarding how this is asked in exams", "Tip 2 common mistake to avoid"]
          }

          Context from User Documents:
          ${contextText.substring(0, 40000)}
        `;

        const result = await model.generateContent(prompt);
        const data = JSON.parse(result.response.text());
        setStudyContent(data);
      } catch (error) {
        console.error("Study Gen Error:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Could not generate study guide.",
        });
        setActiveTopic(null);
      } finally {
        setIsGeneratingStudy(false);
      }
    },
    [API_KEY, contextText, toast]
  );

  // ===== UTILITY FUNCTIONS =====
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "high":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getChaptersText = (chapters: string[] | undefined): string => {
    if (!chapters || chapters.length === 0) {
      return "Multiple chapters";
    }
    return chapters.join(", ");
  };

  // ===== VIEW: ANALYZING =====
  if (viewMode.type === "analyzing") {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-sora font-bold mb-2">Analyzing Patterns...</h3>
          <p className="text-muted-foreground">
            Cross-referencing your documents with exam trends.
          </p>
        </div>
      </div>
    );
  }

  // ===== VIEW: DETAIL (STUDY MODE) =====
  if (viewMode.type === "detail" && activeTopic) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => {
            setActiveTopic(null);
            setViewMode({ type: "results" });
          }}
          className="pl-0 hover:pl-2 transition-all"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Results
        </Button>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-sora font-bold gradient-text">{activeTopic.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className={getImportanceColor(activeTopic.importance)}>
              {activeTopic.importance.toUpperCase()} Priority
            </Badge>
            <span className="text-sm text-muted-foreground">Exam Frequency: {activeTopic.frequency}%</span>
          </div>
        </div>

        {isGeneratingStudy ? (
          <Card className="h-96 flex flex-col items-center justify-center bg-secondary/10 border-dashed">
            <div className="relative mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
            <p className="font-medium">Generating Study Guide...</p>
            <p className="text-sm text-muted-foreground">Drafting definitions, examples, and exam tips.</p>
          </Card>
        ) : studyContent ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Core Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Definition */}
              <Card variant="feature">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Core Concept
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-foreground/90 font-medium">{studyContent.definition}</p>
                </CardContent>
              </Card>

              {/* Example */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    Illustrative Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/30 p-4 rounded-md border border-border/50 text-sm font-mono whitespace-pre-wrap">
                    {studyContent.example}
                  </div>
                </CardContent>
              </Card>

              {/* Exam Tips */}
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                    Exam Strategy & Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {studyContent.examTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-sm text-foreground/80">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Key Concepts List */}
            <div className="lg:col-span-1">
              <Card className="h-full border-l-4 border-l-primary/40">
                <CardHeader>
                  <CardTitle className="text-md">Key Concepts to Master</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {studyContent.keyConcepts.map((concept, i) => (
                        <div key={i} className="p-3 rounded-lg bg-background border shadow-sm">
                          <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm">{concept}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 text-muted-foreground">
            Something went wrong generating content.
            <Button variant="link" onClick={() => handleStudyTopic(activeTopic)}>
              Try Again
            </Button>
          </div>
        )}
      </motion.div>
    );
  }

  // ===== VIEW: HISTORY =====
  if (viewMode.type === "history") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sora font-bold mb-1">
              <span className="gradient-text">Analysis History</span>
            </h1>
            <p className="text-muted-foreground">View your previous analyses</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode({ type: "upload" })}>
            New Analysis
          </Button>
        </div>

        {isLoadingHistory ? (
          <div className="flex justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
            </div>
          </div>
        ) : historyItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No analysis history yet. Start by analyzing your first document.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <motion.div key={item._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(item.createdAt)}</p>
                      <p className="text-sm text-muted-foreground">{item.metadata.totalTopics} topics analyzed</p>
                      {item.metadata.uploadedFiles && (
                        <p className="text-xs text-muted-foreground mt-2">Files: {item.metadata.uploadedFiles.join(", ")}</p>
                      )}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => deleteHistoryItem(item._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // ===== VIEW: SAVED PRIORITY TOPICS =====
  if (viewMode.type === "saved-topics") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sora font-bold mb-1">
              <span className="gradient-text">Saved Priority Topics</span>
            </h1>
            <p className="text-muted-foreground">Topics you've saved from analyses</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchHistory();
                setViewMode({ type: "history" });
              }}
            >
              <Clock className="w-4 h-4 mr-2" /> History
            </Button>
            <Button variant="outline" onClick={() => setViewMode({ type: "upload" })}>
              New Analysis
            </Button>
          </div>
        </div>

        {savedTopics.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No saved topics yet. Analyze documents and save topics to see them here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {savedTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="feature" className="group hover:border-primary/40 transition-colors">
                  <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
                    {/* Rank Number */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-md">
                        <span className="font-bold text-primary-foreground">{index + 1}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{topic.name}</h3>
                        <Badge variant="outline" className={`${getImportanceColor(topic.importance)} capitalize`}>
                          {topic.importance}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{topic.explanation}</p>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Found in: {getChaptersText(topic.chapters)}
                      </div>
                    </div>

                    {/* Stats & Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:pl-4 sm:border-l border-border/50 min-w-[120px]">
                      <div className="text-right hidden sm:block">
                        <span className="text-xl font-bold text-primary">{topic.frequency}%</span>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Frequency</p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setActiveTopic(topic);
                            setViewMode({ type: "detail" });
                          }}
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          Study <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          onClick={() => deleteSavedTopic(topic.id)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <Progress value={topic.frequency} className="h-1 rounded-none bg-secondary" />
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // ===== VIEW: RESULTS (AFTER ANALYSIS) =====
  if (viewMode.type === "results") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-sora font-bold mb-1">
              <span className="gradient-text">Analysis Results</span>
            </h1>
            <p className="text-muted-foreground">{topics.length} topics identified - Select which to save</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchSavedTopics();
                setViewMode({ type: "saved-topics" });
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" /> Saved Topics
            </Button>
            <Button variant="outline" onClick={() => setViewMode({ type: "upload" })}>
              New Analysis
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: "Critical",
              count: topics.filter((t) => t.importance === "critical").length,
              icon: Target,
              color: "text-destructive",
              bg: "bg-destructive/10",
            },
            {
              label: "High Priority",
              count: topics.filter((t) => t.importance === "high").length,
              icon: TrendingUp,
              color: "text-orange-600",
              bg: "bg-orange-500/10",
            },
            {
              label: "Total Topics",
              count: topics.length,
              icon: BookOpen,
              color: "text-primary",
              bg: "bg-primary/10",
            },
          ].map((stat, i) => (
            <Card key={i} variant="feature">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.count}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Topics List */}
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="feature" className="group hover:border-primary/40 transition-colors">
                <CardContent className="p-5 flex flex-col sm:flex-row gap-5">
                  {/* Rank Number */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-md">
                      <span className="font-bold text-primary-foreground">{index + 1}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-lg">{topic.name}</h3>
                      <Badge variant="outline" className={`${getImportanceColor(topic.importance)} capitalize`}>
                        {topic.importance}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{topic.explanation}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <BookOpen className="w-3 h-3" /> Found in: {getChaptersText(topic.chapters)}
                    </div>
                  </div>

                  {/* Stats & Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:pl-4 sm:border-l border-border/50 min-w-[120px]">
                    <div className="text-right hidden sm:block">
                      <span className="text-xl font-bold text-primary">{topic.frequency}%</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Frequency</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          handleStudyTopic(topic);
                          setViewMode({ type: "detail" });
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Study <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <Button
                        onClick={() => saveTopicToPriority(topic)}
                        size="sm"
                        disabled={isSavingTopic}
                        className="w-full sm:w-auto"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {isSavingTopic ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <Progress value={topic.frequency} className="h-1 rounded-none bg-secondary" />
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // ===== VIEW: UPLOAD (EMPTY STATE) =====
  if (viewMode.type === "upload") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-sora font-bold mb-2">
              <span className="gradient-text">Priority Topics</span>
            </h1>
            <p className="text-muted-foreground">
              Identify high-yield topics from your syllabus and previous year questions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchSavedTopics();
                setViewMode({ type: "saved-topics" });
              }}
            >
              <BookOpen className="w-4 h-4 mr-2" /> My Topics
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                fetchHistory();
                setViewMode({ type: "history" });
              }}
            >
              <Clock className="w-4 h-4 mr-2" /> History
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <MaterialUploader onAnalysisComplete={handleAnalysisComplete} featureName="Priority Topics" description="Upload your syllabus and PYQs to identify the most important topics." />
          <Card variant="feature">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-accent" /> How it Works
              </h3>
              {[
                { step: 1, title: "Upload Materials", desc: "Add syllabus & past papers" },
                { step: 2, title: "AI Analysis", desc: "We identify repeated topics" },
                { step: 3, title: "Save Topics", desc: "Select topics to save" },
                { step: 4, title: "Deep Study", desc: "Generate detailed guides" },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{s.step}</div>
                  <div>
                    <h4 className="text-sm font-medium">{s.title}</h4>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Default fallback
  return null;
};

export default PriorityTopics;