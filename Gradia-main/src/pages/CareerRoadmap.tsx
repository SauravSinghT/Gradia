import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Clock,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trophy,
  ArrowLeft,
  BrainCircuit,
  Layers,
  BookOpen,
  ArrowUpRight,
  Save,
  Trash2,
  History,
  Loader2,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import CareerChatbot from "@/components/CareerChatbot"; // Import the Chatbot

// --- CONFIGURATION ---
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const API_URL = "http://localhost:5000/api/roadmaps";

const careerOptions = [
  { id: "web", title: "Web Developer", duration: "3 weeks" },
  { id: "data", title: "Data Scientist", duration: "4 weeks" },
  { id: "mobile", title: "Mobile Developer", duration: "3 weeks" },
  { id: "cloud", title: "Cloud Engineer", duration: "4 weeks" },
  { id: "ai", title: "AI/ML Engineer", duration: "5 weeks" },
  { id: "devops", title: "DevOps Engineer", duration: "3 weeks" },
];

// --- TYPES ---
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  explanation: string;
  youtube_query: string;
  code_snippet: string;
  exercise: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  week: number;
  completed: boolean;
  tasks: Task[];
}

interface GeneratedRoadmap {
  _id?: string;
  career: string;
  timeline: string;
  milestones: Milestone[];
  totalProgress: number;
}

// --- LOADER COMPONENT ---
const RoadmapLoader = ({ career }: { career: string }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { text: "Analyzing career requirements...", icon: Target },
    { text: "Structuring learning milestones...", icon: Layers },
    { text: "Curating video tutorials...", icon: BookOpen },
    { text: "Generating code exercises...", icon: BrainCircuit },
    { text: "Finalizing your roadmap...", icon: Sparkles },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[600px] flex flex-col items-center justify-center text-center p-8 space-y-8">
      <div className="relative">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: 360 }} transition={{ scale: { repeat: Infinity, duration: 3 }, rotate: { repeat: Infinity, duration: 8, ease: "linear" }}} className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent/20 via-primary/20 to-accent/20 blur-xl absolute top-0 left-0 right-0 bottom-0 m-auto" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-background border border-accent/30 flex items-center justify-center shadow-2xl shadow-accent/10">
          <BrainCircuit className="w-10 h-10 text-accent animate-pulse" />
        </div>
      </div>
      <div className="space-y-4 max-w-md w-full">
        <h2 className="text-2xl font-sora font-bold">Building your <span className="gradient-text-accent">{career}</span> Path</h2>
        <div className="h-8 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="flex items-center justify-center gap-2 text-muted-foreground absolute w-full">
              {(() => { const Icon = steps[currentStep].icon; return <Icon className="w-4 h-4 text-accent" />; })()}
              <span className="text-sm font-medium">{steps[currentStep].text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden relative">
          <motion.div className="absolute top-0 bottom-0 left-0 bg-accent w-1/2 h-full rounded-full opacity-80" initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} />
        </div>
        <p className="text-xs text-muted-foreground/60 animate-pulse">This may take up to 30 seconds to generate a personalized plan.</p>
      </div>
    </motion.div>
  );
};

// --- MAIN COMPONENT ---
const CareerRoadmap = () => {
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [customTimeline, setCustomTimeline] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<GeneratedRoadmap[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    fetchSavedRoadmaps();
  }, []);

  const fetchSavedRoadmaps = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const { data } = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedRoadmaps(data);
    } catch (error) {
      console.error("Error fetching roadmaps", error);
    }
  };

  const saveRoadmapToDb = async () => {
    if (!roadmap) return;
    setIsSaving(true);
    const token = getToken();

    try {
      if (!token) {
        toast({ title: "Auth Error", description: "You must be logged in to save.", variant: "destructive" });
        return;
      }

      const { data } = await axios.post(API_URL, roadmap, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRoadmap(data); 
      setSavedRoadmaps([data, ...savedRoadmaps]);
      
      toast({ title: "Saved!", description: "Roadmap saved to your dashboard." });
    } catch (error) {
      toast({ title: "Save Failed", description: "Could not save roadmap.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSavedRoadmap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getToken();
    try {
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedRoadmaps(savedRoadmaps.filter(r => r._id !== id));
      toast({ title: "Deleted", description: "Roadmap removed." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete roadmap.", variant: "destructive" });
    }
  };

  const updateRoadmapProgressInDb = async (updatedRoadmap: GeneratedRoadmap) => {
    if (!updatedRoadmap._id) return;
    const token = getToken();
    try {
      await axios.put(`${API_URL}/${updatedRoadmap._id}`, {
        milestones: updatedRoadmap.milestones,
        totalProgress: updatedRoadmap.totalProgress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Background sync failed", error);
    }
  };

  const getDurationInWeeks = (timelineStr: string): number => {
    const lower = timelineStr.toLowerCase();
    const number = parseInt(lower.replace(/\D/g, '')) || 1;
    if (lower.includes("month")) return number * 4;
    if (lower.includes("year")) return number * 52;
    return number;
  };

  const generateRoadmap = async () => {
    if (!selectedCareer || !customTimeline) {
        toast({ title: "Missing Information", description: "Please select a career and timeline.", variant: "destructive" });
        return;
    }
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        toast({ title: "Configuration Error", description: "Gemini API Key missing.", variant: "destructive" });
        return;
    }

    setIsGenerating(true);
    try {
      const careerTitle = careerOptions.find((c) => c.id === selectedCareer)?.title || selectedCareer;
      const targetWeeks = getDurationInWeeks(customTimeline);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      // --- DETAILED PROMPT ---
      const prompt = `
        Act as an expert technical mentor. Create a learning roadmap for "${careerTitle}".
        Timeline: ${targetWeeks} weeks.
        
        Generate exactly ${targetWeeks} milestones (Week 1 to Week ${targetWeeks}).
        For each week, provide 3 key tasks.
        
        CRITICAL CONTENT REQUIREMENTS:
        1. "explanation": Provide a DETAILED, 4-5 line explanation (approx 60-80 words) covering the 'Why', 'What', and 'How' of the concept. It should be educational and standalone.
        2. "code_snippet": A relevant, practical code example (e.g. CLI command or Code block).
        3. "youtube_query": A specific search term for a high-quality tutorial.
        4. "exercise": A challenging practice task.
        
        JSON Schema:
        [
          {
            "id": "unique_id",
            "title": "Week N: Topic",
            "description": "Brief summary",
            "week": N,
            "completed": false,
            "tasks": [
              { 
                "id": "unique_task_id", 
                "title": "Task Name", 
                "completed": false,
                "explanation": "Detailed 4-5 line explanation...",
                "youtube_query": "Exact YouTube search term",
                "code_snippet": "Code example",
                "exercise": "Specific practice task"
              }
            ]
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const firstBracket = responseText.indexOf("[");
      const lastBracket = responseText.lastIndexOf("]");

      if (firstBracket === -1 || lastBracket === -1) throw new Error("No valid JSON");

      const cleanedJson = responseText.substring(firstBracket, lastBracket + 1);
      const generatedMilestones: Milestone[] = JSON.parse(cleanedJson);

      setRoadmap({
        career: careerTitle,
        timeline: customTimeline,
        milestones: generatedMilestones,
        totalProgress: 0,
      });
      
      toast({ title: "Roadmap Generated!", description: "Review and save your plan." });

    } catch (error) {
      console.error(error);
      toast({ title: "Generation Failed", description: "Try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskStatus = (e: React.MouseEvent, milestoneId: string, taskId: string) => {
    e.stopPropagation();
    if (!roadmap) return;

    const updatedMilestones = roadmap.milestones.map((milestone) => {
      if (milestone.id === milestoneId) {
        const updatedTasks = milestone.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const allCompleted = updatedTasks.every((t) => t.completed);
        return { ...milestone, tasks: updatedTasks, completed: allCompleted };
      }
      return milestone;
    });

    const total = updatedMilestones.reduce((acc, m) => acc + m.tasks.length, 0);
    const completed = updatedMilestones.reduce((acc, m) => acc + m.tasks.filter((t) => t.completed).length, 0);
    
    const newRoadmap = {
        ...roadmap,
        milestones: updatedMilestones,
        totalProgress: Math.round((completed / total) * 100),
    };

    setRoadmap(newRoadmap);
    updateRoadmapProgressInDb(newRoadmap);
  };

  const handleTaskClick = (task: Task) => {
     navigate(`/dashboard/roadmap/task/${task.id}`, { state: { task, careerName: roadmap?.career } });
  };

  // --- RENDER ---
  if (isGenerating) {
    const careerTitle = careerOptions.find((c) => c.id === selectedCareer)?.title || "Career";
    return <RoadmapLoader career={careerTitle} />;
  }

  // 1. RESULT VIEW (Active Roadmap)
  if (roadmap) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={() => setRoadmap(null)} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Saved
            </Button>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-sora font-bold">
                    <span className="gradient-text-accent">{roadmap.career}</span> Roadmap
                </h1>
                {!roadmap._id ? (
                    <Button size="sm" variant="outline" onClick={saveRoadmapToDb} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save to Dashboard
                    </Button>
                ) : (
                    <Badge variant="outline" className="border-green-500 text-green-500 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                    </Badge>
                )}
            </div>
            <p className="text-muted-foreground">Timeline: {roadmap.timeline} • {roadmap.milestones.length} milestones</p>
          </div>
          <Card variant="glass" className="px-4 py-2">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-medium">{roadmap.totalProgress}% Complete</p>
                <Progress value={roadmap.totalProgress} className="h-1.5 w-24 mt-1" />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {roadmap.milestones.map((milestone, index) => (
            <motion.div key={milestone.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}>
              <Card variant={milestone.completed ? "glow" : "feature"} className={`overflow-hidden ${milestone.completed ? "border-success/30" : ""}`}>
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedMilestone(expandedMilestone === milestone.id ? null : milestone.id)}
                  >
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${milestone.completed ? "bg-success/20" : "bg-gradient-to-br from-accent to-amber-soft"}`}>
                      {milestone.completed ? <CheckCircle2 className="w-6 h-6 text-success-soft" /> : <span className="text-lg font-bold text-accent-foreground">W{milestone.week}</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{milestone.title}</h3>
                        {milestone.completed && <Badge variant="outline" className="bg-success/10 text-success-soft border-success/30">Completed</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedMilestone === milestone.id ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {expandedMilestone === milestone.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-3 border-t border-border">
                          <p className="text-sm font-medium text-muted-foreground mt-3">Actionable Tasks:</p>
                          {milestone.tasks.map((task) => (
                            <div key={task.id} className={`group relative flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all cursor-pointer ${task.completed ? "bg-success/5 border-success/20" : "bg-secondary/30 hover:bg-secondary hover:border-accent/20"}`} onClick={() => handleTaskClick(task)}>
                              <button onClick={(e) => toggleTaskStatus(e, milestone.id, task.id)} className="z-10 hover:scale-110 transition-transform">
                                {task.completed ? <CheckCircle2 className="w-5 h-5 text-success-soft" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                              </button>
                              <span className={`text-sm flex-1 ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 p-1 rounded-md">
                                <ArrowUpRight className="w-4 h-4 text-accent" />
                              </div>
                            </div>
                          ))}
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
  }

  // 2. SELECTION VIEW
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-sora font-bold mb-2"><span className="gradient-text-accent">Go-Getter</span> Guide</h1>
        <p className="text-muted-foreground">Get a personalized career roadmap tailored to your goals and timeline</p>
      </div>

      {/* --- SAVED ROADMAPS SECTION --- */}
      {savedRoadmaps.length > 0 && (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-accent" /> Saved Roadmaps
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
                {savedRoadmaps.map((saved) => (
                    <Card key={saved._id} variant="glass" className="cursor-pointer hover:border-accent/50 transition-all group" onClick={() => setRoadmap(saved)}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{saved.career}</h3>
                                <p className="text-xs text-muted-foreground">{saved.timeline} • {saved.totalProgress}% Done</p>
                                <Progress value={saved.totalProgress} className="h-1 w-20 mt-2" />
                            </div>
                            <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={(e) => deleteSavedRoadmap(saved._id!, e)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="border-b border-border my-8"></div>
        </div>
      )}

      {/* --- CREATE NEW SECTION --- */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-accent" /> Choose Your Career Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careerOptions.map((career) => (
              <button key={career.id} onClick={() => setSelectedCareer(career.id)} className={`p-4 rounded-xl text-left transition-all border ${selectedCareer === career.id ? "bg-accent/10 border-accent/50" : "bg-secondary/50 border-transparent hover:bg-secondary"}`}>
                <h4 className="font-semibold mb-1">{career.title}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground"><Clock className="w-3 h-3" /> {career.duration}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card variant="feature">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5 text-primary" /> Set Your Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">How much time do you have?</p>
          <div className="flex flex-wrap gap-3 mb-4">
            {["2 weeks", "1 month", "2 months", "3 months"].map((time) => (
              <Button key={time} variant={customTimeline === time ? "hero" : "outline"} onClick={() => setCustomTimeline(time)}>{time}</Button>
            ))}
          </div>
          <Input placeholder="Or enter custom timeline..." value={customTimeline} onChange={(e) => setCustomTimeline(e.target.value)} className="max-w-xs" />
        </CardContent>
      </Card>

      <Card variant="glow">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center"><Sparkles className="w-6 h-6 text-accent-foreground" /></div>
            <div>
              <h3 className="font-sora font-semibold">Ready to start?</h3>
              <p className="text-sm text-muted-foreground">AI will create a personalized roadmap</p>
            </div>
          </div>
          <Button variant="accent" disabled={!selectedCareer || !customTimeline || isGenerating} onClick={generateRoadmap}>
            {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Rocket className="w-4 h-4 mr-2" /> Generate Roadmap</>}
          </Button>
        </CardContent>
      </Card>

      {/* Floating Chatbot */}
      <CareerChatbot />
    </motion.div>
  );
};

export default CareerRoadmap;