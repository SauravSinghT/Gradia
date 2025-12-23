import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import API_BASE_URL from "@/config";
import {
  ListTodo,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  BarChart3,
  RefreshCcw,
  BookOpen,
  Target,
  ChevronRight,
  Layout,
  ArrowLeft,
  History,
  CalendarClock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import { format } from "date-fns";

// --- CONFIGURATION ---
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const API_URL = `${API_BASE_URL}/roadmaps`;

// --- TYPES ---
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface QuizReport {
  score: number;
  total: number;
  strongAreas: string[];
  weakAreas: string[];
  summary: string;
  takenAt?: string;
}

interface DbMilestone {
  id: string;
  title: string;
  week: number;
  description: string;
  quizReports?: QuizReport[];
}

interface DbRoadmap {
  _id: string;
  career: string;
  totalProgress: number; // Keep for internal tracking if needed
  milestones: DbMilestone[];
}

const DailyTasks = () => {
  // Navigation State
  const [view, setView] = useState<"empty" | "careers" | "modules" | "loading" | "quiz" | "report">("loading");
  
  // Data State
  const [roadmaps, setRoadmaps] = useState<DbRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<DbRoadmap | null>(null);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading your modules...");
  
  // Quiz Session State
  const [activeModuleTitle, setActiveModuleTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [report, setReport] = useState<QuizReport | null>(null);

  const { toast } = useToast();

  // 1. Fetch User's Roadmaps
  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        setView("empty");
        return;
    }

    try {
      const { data } = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      
      if (data.length === 0) {
        setView("empty");
      } else {
        setRoadmaps(data);
        if (activeRoadmap) {
            const updatedActive = data.find((r: DbRoadmap) => r._id === activeRoadmap._id);
            if (updatedActive) setActiveRoadmap(updatedActive);
        }
        if (view === "loading") setView("careers");
      }
    } catch (error) {
      console.error("Failed to fetch roadmaps", error);
      setView("empty");
    }
  };

  const selectCareer = (roadmap: DbRoadmap) => {
    setActiveRoadmap(roadmap);
    setView("modules");
  };

  const viewReport = (milestone: DbMilestone) => {
    if (milestone.quizReports && milestone.quizReports.length > 0) {
        const latestReport = milestone.quizReports[milestone.quizReports.length - 1];
        setReport(latestReport);
        setActiveModuleTitle(milestone.title);
        setActiveMilestoneId(milestone.id);
        setView("report");
    }
  };

  const startQuiz = async (milestoneId: string, moduleTitle: string) => {
    if (!activeRoadmap) return;
    
    setView("loading");
    setLoadingMessage(`Generating assessment for ${moduleTitle}...`);
    setActiveModuleTitle(moduleTitle);
    setActiveMilestoneId(milestoneId);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `
        Create a multiple-choice quiz for a student learning "${activeRoadmap.career}".
        Focus specifically on the topic: "${moduleTitle}".
        
        Generate exactly 5 questions.
        Return ONLY a JSON array. No markdown.
        Schema:
        [
          {
            "id": 1,
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact text of the correct option"
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const generatedQuestions = JSON.parse(text);

      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setView("quiz");
    } catch (error) {
      console.error(error);
      toast({ title: "Generation Error", description: "Failed to create quiz.", variant: "destructive" });
      setView("modules");
    }
  };

  const handleOptionSelect = (option: string) => {
    setUserAnswers((prev) => ({ ...prev, [questions[currentQuestionIndex].id]: option }));
  };

  const submitQuiz = async () => {
    setView("loading");
    setLoadingMessage("Analyzing & Saving Results...");

    let correctCount = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) correctCount++;
    });

    try {
      const analysisPayload = {
        topic: activeModuleTitle,
        questions: questions.map(q => ({
          question: q.question,
          isCorrect: userAnswers[q.id] === q.correctAnswer
        }))
      };

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `
        Analyze performance on "${activeModuleTitle}".
        Data: ${JSON.stringify(analysisPayload)}
        
        Return JSON object:
        {
          "strongAreas": ["string", "string"], 
          "weakAreas": ["string", "string"], 
          "summary": "One sentence feedback."
        }
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const analysis = JSON.parse(text);

      const newReport: QuizReport = {
        score: correctCount,
        total: questions.length,
        strongAreas: analysis.strongAreas,
        weakAreas: analysis.weakAreas,
        summary: analysis.summary
      };

      const token = localStorage.getItem("token");
      if (token && activeRoadmap && activeMilestoneId) {
        await axios.post(
            `${API_URL}/${activeRoadmap._id}/milestones/${activeMilestoneId}/quiz`,
            newReport,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchRoadmaps();
      }

      setReport(newReport);
      setView("report");

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Could not save results.", variant: "destructive" });
      setView("modules");
    }
  };

  // --- HELPER TO COUNT ATTEMPTED QUIZZES ---
  const getAttemptedCount = (map: DbRoadmap) => {
    return map.milestones.filter(m => m.quizReports && m.quizReports.length > 0).length;
  };

  // ------------------------------------------------------------------
  // VIEWS
  // ------------------------------------------------------------------

  if (view === "loading") {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
                <BrainCircuit className="absolute top-0 left-0 right-0 bottom-0 m-auto w-6 h-6 text-accent animate-pulse" />
            </div>
            <p className="text-lg font-medium animate-pulse text-muted-foreground">{loadingMessage}</p>
        </div>
    );
  }

  if (view === "empty") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
            <h1 className="text-3xl font-sora font-bold mb-2"><span className="gradient-text-accent">Assessment Center</span></h1>
            <p className="text-muted-foreground">Test your knowledge against your active roadmaps</p>
        </div>
        <Card variant="glass" className="p-12 text-center">
          <ListTodo className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Modules</h3>
          <p className="text-muted-foreground mb-6">Create a career roadmap to unlock quizzes.</p>
          <Link to="/dashboard/career">
            <Button variant="accent">Create Roadmap</Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  if (view === "careers") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">Assessment Center</span>
          </h1>
          <p className="text-muted-foreground">Select a career path to view available quizzes</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((map) => {
                // Calculate Attempted vs Total
                const attempted = getAttemptedCount(map);
                const total = map.milestones.length;
                const percentage = total > 0 ? (attempted / total) * 100 : 0;

                return (
                    <Card 
                        key={map._id}
                        variant="feature"
                        className="cursor-pointer group hover:border-accent/50 transition-all"
                        onClick={() => selectCareer(map)}
                    >
                        <CardHeader className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-accent/10 text-accent">
                                    <Layout className="w-6 h-6" />
                                </div>
                                <Badge variant="outline">{total} Modules</Badge>
                            </div>
                            <CardTitle className="text-xl mb-2">{map.career}</CardTitle>
                            
                            {/* UPDATED PROGRESS UI */}
                            <div className="space-y-2">
                                <Progress value={percentage} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                    <span>Attempted</span>
                                    <span>{attempted} / {total} Quizzes</span>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>
                );
            })}
        </div>
      </motion.div>
    );
  }

  if (view === "modules" && activeRoadmap) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setView("careers")} className="-ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Paths
            </Button>
        </div>
        
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">{activeRoadmap.career}</span> Quizzes
          </h1>
          <p className="text-muted-foreground">Select a week to start your assessment or view results</p>
        </div>

        <div className="space-y-4 max-w-4xl">
            {activeRoadmap.milestones.map((milestone, index) => {
                const hasReport = milestone.quizReports && milestone.quizReports.length > 0;
                const lastReport = hasReport ? milestone.quizReports![milestone.quizReports!.length - 1] : null;

                return (
                    <Card 
                        key={milestone.id || index}
                        variant="glass"
                        className="group hover:border-accent/50 transition-all"
                    >
                        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                                    hasReport ? "bg-success/10 text-success-soft" : "bg-secondary text-muted-foreground group-hover:text-accent group-hover:bg-accent/10"
                                }`}>
                                    {hasReport ? <CheckCircle2 className="w-5 h-5"/> : milestone.week}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{milestone.description}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {hasReport && lastReport ? (
                                    <Button variant="outline" size="sm" onClick={() => viewReport(milestone)}>
                                        <History className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <div className="text-left">
                                            <span className="block text-xs font-bold text-foreground">Score: {lastReport.score}/{lastReport.total}</span>
                                            <span className="block text-[10px] text-muted-foreground">
                                                {lastReport.takenAt ? format(new Date(lastReport.takenAt), "MMM d, h:mm a") : "View Report"}
                                            </span>
                                        </div>
                                    </Button>
                                ) : null}

                                <Button 
                                    variant={hasReport ? "ghost" : "default"} 
                                    size="sm"
                                    onClick={() => startQuiz(milestone.id, milestone.title)}
                                >
                                    {hasReport ? <RefreshCcw className="w-4 h-4" /> : "Start Quiz"}
                                    {!hasReport && <ChevronRight className="w-4 h-4 ml-1" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
      </motion.div>
    );
  }

  if (view === "quiz" && questions.length > 0) {
    const question = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{activeRoadmap?.career} &bull; {activeModuleTitle}</span>
                <span>{currentQuestionIndex + 1} / {questions.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
        </div>

        <Card variant="glow" className="p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-8 leading-snug">{question.question}</h2>
            <div className="space-y-3">
                {question.options.map((option, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleOptionSelect(option)}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center gap-4 ${
                            userAnswers[question.id] === option
                                ? "bg-accent/10 border-accent text-accent-foreground"
                                : "bg-card border-transparent hover:bg-secondary/50 hover:border-border"
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${
                            userAnswers[question.id] === option ? "bg-accent text-white border-accent" : "bg-background border-muted-foreground text-muted-foreground"
                        }`}>
                            {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="font-medium">{option}</span>
                    </button>
                ))}
            </div>
        </Card>

        <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => setView("modules")}>Cancel</Button>
            {currentQuestionIndex < questions.length - 1 ? (
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={!userAnswers[question.id]}>
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            ) : (
                <Button variant="hero" onClick={submitQuiz} disabled={!userAnswers[question.id]}>
                    Submit <Trophy className="w-4 h-4 ml-2" />
                </Button>
            )}
        </div>
      </motion.div>
    );
  }

  if (view === "report" && report) {
    const percentage = Math.round((report.score / report.total) * 100);
    const isPass = percentage >= 60;

    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-sora font-bold">Assessment Report</h1>
            <p className="text-muted-foreground">{activeModuleTitle}</p>
            {report.takenAt && (
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CalendarClock className="w-3 h-3" /> Taken on {format(new Date(report.takenAt), "PPpp")}
                </p>
            )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
            <Card variant="glass" className="md:col-span-1 flex flex-col items-center justify-center p-8 text-center border-accent/20">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center mb-6 border-8 shadow-2xl ${isPass ? "border-success/20 text-success" : "border-destructive/20 text-destructive"}`}>
                    <div className="text-center">
                        <span className="text-5xl font-bold block">{percentage}%</span>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Score</span>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-lg">{report.score} / {report.total} Correct</p>
                    <Badge variant={isPass ? "default" : "destructive"}>{isPass ? "Passed" : "Needs Review"}</Badge>
                </div>
            </Card>

            <Card variant="feature" className="md:col-span-2 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-lg">Performance Analysis</h3>
                </div>
                <div className="space-y-8">
                    <div>
                        <h4 className="text-sm font-medium text-success-soft mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Strong Areas</h4>
                        <div className="flex flex-wrap gap-2">{report.strongAreas.map((area, i) => <div key={i} className="bg-success/10 text-success-soft px-3 py-1.5 rounded-md text-sm font-medium border border-success/20">{area}</div>)}</div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-destructive mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" /> Areas to Focus On</h4>
                        <div className="flex flex-wrap gap-2">{report.weakAreas.map((area, i) => <div key={i} className="bg-destructive/10 text-destructive px-3 py-1.5 rounded-md text-sm font-medium border border-destructive/20">{area}</div>)}</div>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg border border-border text-sm text-muted-foreground italic"><span className="font-bold not-italic text-foreground mr-1">AI Feedback:</span> "{report.summary}"</div>
                </div>
            </Card>
        </div>

        <div className="flex justify-center gap-4 pt-4">
            <Button variant="outline" size="lg" onClick={() => setView("modules")}><BookOpen className="w-4 h-4 mr-2" /> Back to List</Button>
            <Button variant="accent" size="lg" onClick={() => activeMilestoneId && startQuiz(activeMilestoneId, activeModuleTitle)}><RefreshCcw className="w-4 h-4 mr-2" /> Retake</Button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default DailyTasks;