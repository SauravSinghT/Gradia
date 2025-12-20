import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  Sparkles,
  Trash2,
  Loader2,
  Calendar,
  Download,
  XCircle,
  TrendingUp,
} from "lucide-react";
import MaterialUploader, { UploadedFile } from "@/components/MaterialUploader";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjs from "pdfjs-dist";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_BASE_URL = "http://localhost:5000/api";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

interface Quiz {
  id: string;
  name: string;
  topic: string;
  questions: Question[];
  completed: boolean;
  score?: number;
}

interface HistoryItem {
  _id: string;
  userId: string;
  historyType: string;
  title: string;
  sourceFileName: string;
  description?: string;
  data: Quiz;
  metadata?: any;
  createdAt: string;
}

const Tests = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ FIX 1: Get Token Utility
  const getToken = (): string | null => {
    const token = localStorage.getItem("token");
    return token ? token.trim() : null;
  };

  // ✅ FIX 2: Load history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  // ✅ FIX 3: Load History Function with proper error handling
  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = getToken();

      if (!token) {
        console.warn("No authentication token found");
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}/history?historyType=quiz,quizAttempt&limit=50`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          console.error("Unauthorized - token removed");
          return;
        }
        throw new Error(`HTTP ${res.status}: Failed to fetch history`);
      }

      const data = await res.json();
      console.log("✅ History loaded:", data.data);
      setHistory(data.data || []);
    } catch (error) {
      console.error("❌ Load history error:", error);
      toast({
        variant: "destructive",
        title: "Error Loading History",
        description:
          error instanceof Error ? error.message : "Failed to load history",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ✅ FIX 4: PDF Text Extraction
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
      throw new Error("Failed to extract text from PDF.");
    }
  };

  // ✅ FIX 5: Read File as Text
  const readFileAsText = async (file: File): Promise<string> => {
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      return extractTextFromPDF(file);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // ✅ FIX 6: Handle Analysis Complete with Backend Integration
  const handleAnalysisComplete = async (files: UploadedFile[]) => {
    if (!API_KEY) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Gemini API Key missing in .env",
      });
      return;
    }

    setIsGenerating(true);
    const token = getToken();

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" },
      });

      for (const [index, fileObj] of files.entries()) {
        const fileContent = await readFileAsText(fileObj.file);

        if (!fileContent || fileContent.length < 10) {
          console.warn(`Skipping file: ${fileObj.file.name} (too small)`);
          continue;
        }

        const prompt = `You are an expert examiner. Create a challenging multiple-choice quiz based strictly on the provided text.

Text Content:
${fileContent.substring(0, 50000)}

Requirements:
1. Generate exactly 20 to 25 questions.
2. Return ONLY a valid JSON object (no extra text).
3. Structure: { "topic": "Main topic", "questions": [{ "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0 }] }`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const data = JSON.parse(responseText);

        const formattedQuestions: Question[] = data.questions.map(
          (q: any, idx: number) => ({
            id: `q-${Date.now()}-${idx}`,
            question: q.question || "Question text missing",
            options: q.options || ["A", "B", "C", "D"],
            correctAnswer: q.correctAnswer || 0,
          })
        );

        const newQuiz: Quiz = {
          id: Date.now().toString() + index,
          name: fileObj.file.name.replace(/\.[^/.]+$/, ""),
          topic: data.topic || "General Knowledge",
          questions: formattedQuestions,
          completed: false,
        };

        setQuizzes((prev) => [...prev, newQuiz]);

        // ✅ FIX 7: Save Quiz to Backend
        if (token) {
          try {
            const saveRes = await fetch(`${API_BASE_URL}/history`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                historyType: "quiz",
                title: newQuiz.name,
                sourceFileName: fileObj.file.name,
                description: `Quiz: ${newQuiz.topic} (${newQuiz.questions.length} Questions)`,
                data: newQuiz,
                metadata: {
                  questionCount: newQuiz.questions.length,
                },
              }),
            });

            if (!saveRes.ok) {
              const errorData = await saveRes.json();
              console.error("Save quiz error:", errorData);
              throw new Error(errorData.message || "Failed to save quiz");
            }

            console.log("✅ Quiz saved to backend");
          } catch (err) {
            console.error("❌ Error saving quiz to backend:", err);
            toast({
              variant: "destructive",
              title: "Warning",
              description: "Quiz generated but not saved to history",
            });
          }
        }
      }

      // Reload history after all quizzes are generated
      await loadHistory();

      toast({
        title: "✅ Quiz Generated!",
        description: "Ready to test your knowledge.",
      });
    } catch (error) {
      console.error("❌ Generation Error:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not create quiz from this document.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ FIX 8: Delete History Item with Loading State
  const deleteHistoryItem = async (historyId: string) => {
    try {
      setDeletingId(historyId);
      const token = getToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication required",
        });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/history/${historyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to delete`);
      }

      setHistory((prev) => prev.filter((item) => item._id !== historyId));
      toast({
        title: "✅ Deleted",
        description: "Quiz removed from history",
      });
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Could not delete quiz",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ FIX 9: Start Quiz
  const startQuiz = (quizData: Quiz) => {
    const freshQuiz: Quiz = {
      ...quizData,
      questions: quizData.questions.map((q) => ({
        ...q,
        userAnswer: undefined,
      })),
      completed: false,
      score: undefined,
    };
    setActiveQuiz(freshQuiz);
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };

  // ✅ FIX 10: Answer Question
  const answerQuestion = (answerIndex: number) => {
    if (!activeQuiz) return;

    const updatedQuestions = [...activeQuiz.questions];
    updatedQuestions[currentQuestionIndex].userAnswer = answerIndex;
    setActiveQuiz({ ...activeQuiz, questions: updatedQuestions });

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex((prev) => prev + 1), 400);
    } else {
      finishQuiz(updatedQuestions);
    }
  };

  // ✅ FIX 11: Finish Quiz and Save Attempt to Backend
  const finishQuiz = async (questions: Question[]) => {
    if (!activeQuiz) return;

    const correct = questions.filter(
      (q) => q.userAnswer === q.correctAnswer
    ).length;
    const score = Math.round((correct / questions.length) * 100);

    const completedQuiz: Quiz = {
      ...activeQuiz,
      questions,
      completed: true,
      score,
    };

    setActiveQuiz(completedQuiz);
    setShowResults(true);

    // ✅ FIX 12: Save Quiz Attempt to Backend
    const token = getToken();
    if (token) {
      try {
        const saveRes = await fetch(`${API_BASE_URL}/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            historyType: "quizAttempt",
            title: completedQuiz.name,
            sourceFileName: completedQuiz.name,
            description: `Attempt: ${completedQuiz.topic} - Score: ${score}%`,
            data: completedQuiz,
            metadata: {
              questionCount: completedQuiz.questions.length,
              score: score,
              correctAnswers: correct,
            },
          }),
        });

        if (!saveRes.ok) {
          throw new Error("Failed to save attempt");
        }

        console.log("✅ Quiz attempt saved");
        await loadHistory();
      } catch (err) {
        console.error("❌ Error saving attempt:", err);
      }
    }
  };

  // ✅ FIX 13: Download Quiz as PDF
  const downloadQuizAsPDF = async (quiz: Quiz) => {
    try {
      setDownloadingId(quiz.id);
      const pdfContent = document.createElement("div");
      pdfContent.style.width = "210mm";
      pdfContent.style.padding = "20px";
      pdfContent.style.fontFamily = "Arial, sans-serif";
      pdfContent.style.backgroundColor = "#fff";
      pdfContent.style.color = "#333";

      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 15px;">
          <h1 style="color: #007bff; font-size: 24px; margin: 0;">${quiz.name}</h1>
          <p style="color: #666; margin: 5px 0;">Topic: ${quiz.topic}</p>
        </div>
        <div style="margin-bottom: 30px;">
          ${quiz.questions
            .map(
              (q, i) => `
            <div style="margin-bottom: 20px; page-break-inside: avoid;">
              <p style="font-weight: bold; margin-bottom: 8px;">${i + 1}. ${q.question}</p>
              <ul style="list-style-type: none; padding-left: 15px; margin: 0;">
                ${q.options
                  .map(
                    (opt, idx) => `
                  <li style="margin-bottom: 5px; font-size: 14px;">
                    <span style="display:inline-block; width: 20px;">${String.fromCharCode(65 + idx)}.</span> ${opt}
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          `
            )
            .join("")}
        </div>
        <div style="page-break-before: always; margin-top: 30px;">
          <h2 style="color: #007bff; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Answer Key</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            ${quiz.questions
              .map(
                (q, i) => `
              <div style="font-size: 14px; padding: 5px; background: #f8f9fa;">
                <strong>${i + 1}:</strong> ${String.fromCharCode(65 + q.correctAnswer)}
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;

      document.body.appendChild(pdfContent);
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
      });
      document.body.removeChild(pdfContent);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
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

      pdf.save(`${quiz.name}_quiz.pdf`);
      toast({
        title: "✅ Download Complete",
        description: "Quiz saved as PDF.",
      });
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "PDF generation failed",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // --- DERIVED DATA ---
  const generatedQuizzes = history.filter(
    (item) => item.historyType === "quiz"
  );

  const recentAttempts = history
    .filter(
      (item) =>
        item.historyType === "quizAttempt" && item.metadata?.score != null
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  console.log("📊 Recent attempts:", recentAttempts);
  console.log("📝 Generated quizzes:", generatedQuizzes);

  // --- RENDERING VIEWS ---

  // 1. Loading / Generating View
  if (isGenerating) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-sora font-bold mb-2">Generating Quiz...</h3>
          <p className="text-muted-foreground">
            Reading document and crafting 20-25 questions.
          </p>
        </div>
      </div>
    );
  }

  // 2. Results View
  if (activeQuiz && showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <Card className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-sora font-bold mb-2">Quiz Complete!</h2>
          <p className="text-4xl font-bold text-primary mb-4">
            {activeQuiz.score}%
          </p>
          <p className="text-muted-foreground mb-6">
            You got{" "}
            {
              activeQuiz.questions.filter(
                (q) => q.userAnswer === q.correctAnswer
              ).length
            }{" "}
            out of {activeQuiz.questions.length} correct
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => startQuiz(activeQuiz)}>
              Retry
            </Button>
            <Button
              onClick={() => {
                setActiveQuiz(null);
                setShowResults(false);
              }}
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // 3. Active Quiz View
  if (activeQuiz) {
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-sora font-bold">{activeQuiz.name}</h1>
            <Badge variant="outline" className="mt-1">
              {activeQuiz.topic}
            </Badge>
            <p className="text-muted-foreground mt-2">
              Question {currentQuestionIndex + 1} of{" "}
              {activeQuiz.questions.length}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setActiveQuiz(null)}>
            <XCircle className="w-5 h-5 mr-2" /> Exit
          </Button>
        </div>

        <Card className="p-8">
          <h3 className="text-xl font-medium mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={
                  currentQuestion.userAnswer === index ? "default" : "outline"
                }
                className="w-full justify-start text-left h-auto py-4 px-6"
                onClick={() => answerQuestion(index)}
                disabled={currentQuestion.userAnswer !== undefined}
              >
                <span className="mr-4 font-bold w-6">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </Button>
            ))}
          </div>
        </Card>
      </motion.div>
    );
  }

  // 4. Main Dashboard View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-sora font-bold mb-2">
          <span className="text-primary">Tests & Quizzes</span>
        </h1>
        <p className="text-muted-foreground">
          Generate new tests or review your previous attempts
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          {/* Generator */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Generate New Quiz
            </h2>
            <MaterialUploader
              onAnalysisComplete={handleAnalysisComplete}
              featureName="Quiz Generator"
              description="Upload notes or PDFs to create a 20-25 question test."
            />
          </div>

          {/* Recent Attempts */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Recent Attempts
            </h2>

            {recentAttempts.length === 0 ? (
              <div className="p-8 rounded-lg border border-dashed border-border/50 bg-accent/5 text-center">
                <div className="text-3xl mb-3 opacity-50">📊</div>
                <p className="text-sm text-muted-foreground">
                  Complete a quiz to see your attempts and scores here
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recentAttempts.map((item) => {
                  const quiz = { id: item._id, ...item.data } as Quiz;
                  const score = item.metadata?.score ?? 0;
                  const correct = item.metadata?.correctAnswers ?? 0;
                  const total =
                    item.metadata?.questionCount ?? quiz.questions.length;

                  const scoreColor =
                    score >= 80
                      ? "text-green-600"
                      : score >= 60
                      ? "text-yellow-600"
                      : "text-red-600";

                  return (
                    <Card
                      key={item._id}
                      className="group hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        {/* Header with Score and Delete */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${scoreColor}`}>
                              {score}%
                            </span>
                            {/* Delete Button - Appears on Hover with Loading State */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                              onClick={() => deleteHistoryItem(item._id)}
                              title="Delete attempt"
                              disabled={deletingId === item._id}
                            >
                              {deletingId === item._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Quiz Info */}
                        <h3 className="font-semibold truncate mb-1">
                          {quiz.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          {correct}/{total} Correct
                        </p>
                        <div className="text-xs text-muted-foreground mb-4 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>

                        {/* Reattempt Button */}
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => startQuiz(quiz)}
                        >
                          <Play className="w-4 h-4 mr-2" /> Reattempt
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-semibold flex items-center">
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Ready to Start
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] p-4">
                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : quizzes.length === 0 && generatedQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                      No quizzes generated yet. Upload a document to start!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Session quizzes */}
                    {quizzes.map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/5 transition-all bg-background"
                      >
                        <h4 className="font-medium text-sm truncate">
                          {quiz.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {quiz.questions.length} Qs
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {quiz.topic}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs mt-3"
                          onClick={() => startQuiz(quiz)}
                        >
                          <Play className="w-3 h-3 mr-1" /> Start
                        </Button>
                      </div>
                    ))}

                    {/* History quizzes */}
                    {generatedQuizzes.map((item) => (
                      <div
                        key={item._id}
                        className="p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/5 transition-all bg-background"
                      >
                        <h4 className="font-medium text-sm truncate">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {item.metadata?.questionCount || 20} Qs
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {item.data.topic}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-dashed border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              downloadQuizAsPDF({
                                id: item._id,
                                ...item.data,
                              } as Quiz)
                            }
                            disabled={downloadingId === item._id}
                            title="Download as PDF"
                          >
                            {downloadingId === item._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                          </Button>

                          <div className="flex-1"></div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            onClick={() => deleteHistoryItem(item._id)}
                            disabled={deletingId === item._id}
                            title="Delete quiz"
                          >
                            {deletingId === item._id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            className="h-7 text-xs px-3 ml-1"
                            onClick={() =>
                              startQuiz({
                                id: item._id,
                                ...item.data,
                              } as Quiz)
                            }
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default Tests;
