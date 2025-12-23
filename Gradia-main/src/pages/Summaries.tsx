import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import API_BASE_URL from "@/config";
import {
  FileText,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Check,
  Download,
  Loader2,
  Trash2,
  Eye,
  Calendar,
} from "lucide-react";
import MaterialUploader, { UploadedFile } from "@/components/MaterialUploader";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
// ✅ CHANGED: Import from standard build (not legacy)
import * as pdfjs from "pdfjs-dist";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// ✅ Set worker path BEFORE using any pdfjs functions
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// const API_BASE_URL = "/api";
interface Topic {
  name: string;
  explanation: string;
  details: string;
}

interface Summary {
  id: string;
  chapter: string;
  title: string;
  overview: string;
  topics: Topic[];
  keyPoints: string[];
  expectedQuestions: string[];
}

interface HistoryItem {
  _id: string;
  userId: string;
  historyType: string;
  title: string;
  sourceFileName: string;
  description?: string;
  data: Summary;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

const Summaries = () => {
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const { toast } = useToast();

  // Get token from localStorage
  const getToken = () => localStorage.getItem("token");

  // ✅ Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = getToken();

      if (!token) {
        console.log("No token found, skipping history load");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/history?historyType=summary&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast({
            variant: "destructive",
            title: "Session expired",
            description: "Please login again",
          });
          return;
        }
        throw new Error("Failed to fetch history");
      }

      const data = await res.json();
      setHistory(data.data || []);
    } catch (error: any) {
      console.error("Load history error:", error);
      // Don't show error for history - it's optional
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
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
      console.error("PDF extraction error:", error);
      throw new Error("Failed to extract text from PDF. Ensure it's a valid text-based PDF.");
    }
  };

  const readFileAsText = async (file: File): Promise<string> => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      return extractTextFromPDF(file);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleAnalysisComplete = async (files: UploadedFile[]) => {
    if (!API_KEY) {
      toast({
        variant: "destructive",
        title: "API Key Missing",
        description: "Please add VITE_GEMINI_API_KEY to your .env file.",
      });
      return;
    }

    setIsAnalyzing(true);
    const newSummaries: Summary[] = [];

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" }
      });

      const token = getToken();

      for (const [index, fileObj] of files.entries()) {
        const fileContent = await readFileAsText(fileObj.file);

        if (!fileContent || fileContent.length < 10) {
          toast({
            variant: "destructive",
            title: "Empty File",
            description: `"${fileObj.file.name}" appears to be empty or unreadable.`
          });
          continue;
        }

        const prompt = `You are an expert academic tutor. Analyze the following study material and generate a DETAILED, STRUCTURED summary.

Material Content:
${fileContent.slice(0, 50000)}

Output Requirements:
Return a SINGLE JSON object with this EXACT structure (no markdown, no extra formatting):
{
  "chapter": "Suggest a Chapter Number/Name based on content",
  "title": "A concise title for the material (max 60 chars)",
  "overview": "Brief 2-3 sentence overview of the entire material",
  "topics": [
    {
      "name": "Topic Name",
      "explanation": "One-line concise explanation of this topic (max 50 words)",
      "details": "2-3 sentence detailed explanation with key concepts and context"
    }
  ],
  "keyPoints": [
    "Point 1",
    "Point 2",
    "Point 3",
    "Point 4",
    "Point 5"
  ],
  "expectedQuestions": [
    "Question 1?",
    "Question 2?",
    "Question 3?"
  ]
}

IMPORTANT CONSTRAINTS:
1. Create AT LEAST 8-12 distinct topics (not 3-5, aim for comprehensive coverage)
2. Each topic must have EXACTLY 3 fields: name, explanation, details
3. explanation field MUST be ONE LINE (concise, 30-50 words max)
4. details field MUST be 2-3 sentences with specific examples
5. Ensure topics are logically ordered and build upon each other
6. Cover all major concepts, subtopics, and learning objectives from the material`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON parse error:", responseText);
          throw new Error("Invalid response format from AI model");
        }

        const summary: Summary = {
          id: Date.now().toString() + index,
          chapter: data.chapter || `Chapter ${index + 1}`,
          title: data.title || fileObj.file.name.replace(/\.[^/.]+$/, ""),
          overview: data.overview || "No overview available",
          topics: data.topics || [],
          keyPoints: data.keyPoints || [],
          expectedQuestions: data.expectedQuestions || []
        };

        newSummaries.push(summary);

        // ✅ Save to backend history
        if (token) {
          try {
            const res = await fetch(`${API_BASE_URL}/history`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                historyType: "summary",
                title: summary.title,
                sourceFileName: fileObj.file.name,
                description: `Auto-saved from: ${fileObj.file.name}`,
                data: summary,
                metadata: {
                  fileSize: fileObj.file.size,
                  processingTime: 0,
                },
              }),
            });

            if (res.ok) {
              const saved = await res.json();
              console.log("Summary saved to history:", saved);
            }
          } catch (err) {
            console.error("Error saving to history:", err);
            // Don't block on history save error
          }
        }
      }

      if (newSummaries.length > 0) {
        setSummaries(newSummaries);
        setHasAnalyzed(true);
        setActiveTab("current");
        toast({
          title: "✅ Analysis Complete",
          description: `Generated detailed summaries for ${newSummaries.length} document(s)!`
        });
        // Refresh history
        loadHistory();
      }

    } catch (error: any) {
      console.error("Analysis Error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Could not summarize the documents.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ Delete history item
  const deleteHistoryItem = async (historyId: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/history/${historyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete");

      setHistory((prev) => prev.filter((item) => item._id !== historyId));
      toast({
        title: "✓ Deleted",
        description: "Summary removed from history",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error.message,
      });
    }
  };

  // ✅ View history item
  const viewHistoryItem = (item: HistoryItem) => {
    const summary: Summary = {
      id: item._id,
      ...item.data,
    };
    setSummaries([summary]);
    setHasAnalyzed(true);
    setActiveTab("current");
    setExpandedId(item._id);
  };

  const downloadSummaryAsPDF = async (summary: Summary) => {
    try {
      setDownloadingId(summary.id);

      const pdfContent = document.createElement("div");
      pdfContent.style.width = "210mm";
      pdfContent.style.padding = "20px";
      pdfContent.style.fontFamily = "Arial, sans-serif";
      pdfContent.style.lineHeight = "1.6";
      pdfContent.style.color = "#333";
      pdfContent.style.backgroundColor = "#fff";
      pdfContent.innerHTML = `
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 15px;">
          <h1 style="margin: 0; color: #007bff; font-size: 28px;">${summary.title}</h1>
          <p style="margin: 5px 0; color: #666; font-size: 14px;">${summary.chapter}</p>
        </div>

        <!-- Overview Section -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 18px; margin: 0 0 12px 0;">📋 Overview</h2>
          <p style="margin: 0; color: #444; font-size: 13px;">${summary.overview}</p>
        </div>

        <!-- Topics Section -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 18px; margin: 0 0 12px 0;">📚 Topics (${summary.topics.length})</h2>
          <div>
            ${summary.topics.map((topic, i) => `
              <div style="margin-bottom: 18px; padding: 12px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
                <h3 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: bold;">${i + 1}. ${topic.name}</h3>
                <p style="margin: 6px 0; color: #555; font-size: 12px;"><strong>Summary:</strong> ${topic.explanation}</p>
                <p style="margin: 6px 0; color: #666; font-size: 12px;"><strong>Details:</strong> ${topic.details}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Key Points Section -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 18px; margin: 0 0 12px 0;">⭐ Key Points</h2>
          <ul style="margin: 0; padding-left: 20px;">
            ${summary.keyPoints.map(point => `
              <li style="margin-bottom: 8px; color: #444; font-size: 12px;">${point}</li>
            `).join('')}
          </ul>
        </div>

        <!-- Expected Questions Section -->
        <div style="margin-bottom: 25px;">
          <h2 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 8px; font-size: 18px; margin: 0 0 12px 0;">❓ Expected Questions</h2>
          <ol style="margin: 0; padding-left: 20px;">
            ${summary.expectedQuestions.map(question => `
              <li style="margin-bottom: 12px; color: #444; font-size: 12px;">${question}</li>
            `).join('')}
          </ol>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 11px;">
          <p style="margin: 0;">Generated on ${new Date().toLocaleDateString('en-IN')} | AI-Powered Study Summary</p>
        </div>
      `;

      document.body.appendChild(pdfContent);

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#fff"
      });

      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`${summary.title.replace(/\s+/g, '_')}_summary.pdf`);

      toast({
        title: "✅ PDF Downloaded",
        description: `"${summary.title}" has been downloaded successfully!`
      });

    } catch (error: any) {
      console.error("PDF Download Error:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not generate PDF. Please try again."
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "✓ Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // --- LOADING STATE ---
  if (isAnalyzing) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-sora font-bold mb-2">Analyzing Materials...</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Creating detailed, structured summaries with comprehensive topic coverage and exam prep questions.
          </p>
        </div>
      </div>
    );
  }

  if (!hasAnalyzed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">AI Summaries</span>
          </h1>
          <p className="text-muted-foreground">
            AI-generated detailed summaries with comprehensive topic coverage and exam questions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <MaterialUploader
            onAnalysisComplete={handleAnalysisComplete}
            featureName="Summaries"
            description="Upload study materials (.txt, .md, .json, .pdf) for detailed AI-powered summaries organized by topics"
            allowedTypes={["notes"]}
          />

          <div className="space-y-6">
            <Card className="border hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-sora font-semibold mb-2">Detailed Summaries</h3>
                <p className="text-sm text-muted-foreground">
                  Structured summaries with 8-12 topics, each with concise one-line explanations
                </p>
              </CardContent>
            </Card>
            <Card className="border hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-sora font-semibold mb-2">Download as PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Export your summaries as beautifully formatted PDF documents for offline study
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Section */}
        <Card className="border">
          <CardContent className="p-6">
            <h2 className="text-3xl font-sora font-bold mb-2 gradient-text">Previous Summaries</h2>
            
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <p className="text-muted-foreground">Loading history...</p>
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No previous summaries yet. Process a document to see it here.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('en-IN')}
                      </p>
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.sourceFileName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewHistoryItem(item)}
                        title="View summary"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHistoryItem(item._id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Current summaries view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">AI Summaries</span>
          </h1>
          <p className="text-muted-foreground">
            {summaries.length} document{summaries.length !== 1 ? "s" : ""} with detailed breakdowns
          </p>
        </div>
        <Button variant="outline" onClick={() => setHasAnalyzed(false)}>
          Upload More Materials
        </Button>
      </div>

      {/* Summaries List */}
      <div className="space-y-4">
        {summaries.map((summary) => (
          <motion.div
            key={summary.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden border hover:border-primary/50 transition-colors">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <button
                    className="flex-1 flex items-center gap-4 text-left"
                    onClick={() => setExpandedId(expandedId === summary.id ? null : summary.id)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="mb-1">
                        {summary.chapter}
                      </Badge>
                      <h3 className="font-semibold">{summary.title}</h3>
                    </div>
                    {expandedId === summary.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadSummaryAsPDF(summary)}
                    disabled={downloadingId === summary.id}
                    className="ml-2"
                    title="Download as PDF"
                  >
                    {downloadingId === summary.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <AnimatePresence>
                  {expandedId === summary.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-6 border-t border-border">
                        {/* Overview */}
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Overview
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {summary.overview}
                          </p>
                        </div>

                        {/* Topics Section */}
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-accent" />
                            Topics ({summary.topics.length})
                          </h4>
                          <div className="space-y-2">
                            {summary.topics.map((topic, i) => (
                              <motion.div
                                key={i}
                                className="rounded-lg border border-border/50 overflow-hidden"
                              >
                                <button
                                  className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                                  onClick={() => setExpandedTopic(expandedTopic === `${summary.id}-${i}` ? null : `${summary.id}-${i}`)}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-sm">{i + 1}. {topic.name}</h5>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {topic.explanation}
                                    </p>
                                  </div>
                                  {expandedTopic === `${summary.id}-${i}` ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                                  )}
                                </button>

                                <AnimatePresence>
                                  {expandedTopic === `${summary.id}-${i}` && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="px-3 py-2 bg-secondary/30 border-t border-border/50 text-xs text-muted-foreground"
                                    >
                                      {topic.details}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Key Points */}
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-accent" />
                            Key Points
                          </h4>
                          <ul className="space-y-2">
                            {summary.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-primary">{i + 1}</span>
                                </span>
                                <span className="text-muted-foreground">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Expected Questions */}
                        <div>
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                            <HelpCircle className="w-4 h-4 text-primary" />
                            Expected Questions
                          </h4>
                          <ul className="space-y-2">
                            {summary.expectedQuestions.map((question, i) => (
                              <li
                                key={i}
                                className="p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground flex gap-2"
                              >
                                <span className="font-medium text-primary flex-shrink-0">Q{i + 1}:</span>
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Summaries;
