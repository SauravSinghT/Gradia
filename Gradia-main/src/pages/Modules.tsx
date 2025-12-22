import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  Rocket,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  BookOpen,
  Code,
  Trophy,
  ArrowLeft,
  Loader2,
  Layout,
  Clock,
  Plus,
  Dumbbell // Icon for Exercise
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

// --- API CONFIG ---
const API_URL = "http://localhost:5000/api/roadmaps";

// --- TYPES ---
interface LessonContent {
  explanation: string;
  code: string;
  video: string;
  exercise: string; // Added Exercise
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  content: LessonContent;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: number;
}

// Database Types (Matching your Schema)
interface DbTask {
  id: string;
  title: string;
  completed: boolean;
  explanation: string;
  code_snippet: string;
  youtube_query: string;
  exercise: string;
}

interface DbMilestone {
  id: string;
  title: string;
  description: string;
  tasks: DbTask[];
}

interface DbRoadmap {
  _id: string;
  career: string;
  timeline: string;
  totalProgress: number;
  milestones: DbMilestone[];
}

const Modules = () => {
  const [loading, setLoading] = useState(true);
  const [savedRoadmaps, setSavedRoadmaps] = useState<DbRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<DbRoadmap | null>(null);
  const [currentModules, setCurrentModules] = useState<Module[]>([]);
  const [activeLesson, setActiveLesson] = useState<{ moduleId: string; lessonId: string } | null>(null);
  
  const { toast } = useToast();

  // --- 1. FETCH DATA ---
  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
        setLoading(false);
        return;
    }

    try {
      const { data } = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedRoadmaps(data);
    } catch (error) {
      console.error("Error fetching modules:", error);
      toast({ title: "Error", description: "Could not load modules.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. TRANSFORM DATA (DB -> UI) ---
  const selectRoadmap = (roadmap: DbRoadmap) => {
    setActiveRoadmap(roadmap);

    // Convert DB Milestones -> UI Modules
    const transformedModules: Module[] = roadmap.milestones.map((milestone) => {
      const totalTasks = milestone.tasks.length;
      const completedTasks = milestone.tasks.filter(t => t.completed).length;
      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      return {
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        progress: progress,
        lessons: milestone.tasks.map((task, index, arr) => {
            // Logic: Lesson is locked if the previous one isn't complete
            const isLocked = index > 0 && !arr[index - 1].completed;
            return {
                id: task.id,
                title: task.title,
                duration: "15 min", // Default duration
                completed: task.completed,
                locked: task.completed ? false : isLocked,
                content: {
                    explanation: task.explanation,
                    code: task.code_snippet,
                    video: task.youtube_query,
                    exercise: task.exercise
                }
            };
        })
      };
    });

    setCurrentModules(transformedModules);
  };

  const startLesson = (moduleId: string, lessonId: string) => {
    setActiveLesson({ moduleId, lessonId });
  };

  // --- 3. PROGRESS TRACKING & SYNC ---
  const completeLesson = async () => {
    if (!activeLesson || !activeRoadmap) return;

    // A. Update UI State (Optimistic Update)
    const updatedModules = currentModules.map((module) => {
      if (module.id === activeLesson.moduleId) {
        const updatedLessons = module.lessons.map((lesson, index, arr) => {
          // Mark current lesson as complete
          if (lesson.id === activeLesson.lessonId) {
            return { ...lesson, completed: true };
          }
          // Unlock next lesson
          if (index > 0 && arr[index - 1].id === activeLesson.lessonId) {
            return { ...lesson, locked: false };
          }
          return lesson;
        });
        
        const completedCount = updatedLessons.filter((l) => l.completed).length;
        return {
          ...module,
          lessons: updatedLessons,
          progress: Math.round((completedCount / updatedLessons.length) * 100),
        };
      }
      return module;
    });

    setCurrentModules(updatedModules);
    setActiveLesson(null); // Return to module list

    // B. Sync to Database
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        // 1. Reconstruct the roadmap object for the DB
        // We need to map the UI 'updatedModules' back to the DB 'milestones' structure
        const updatedMilestones = activeRoadmap.milestones.map(m => {
            const matchingUIModule = updatedModules.find(mod => mod.id === m.id);
            if (!matchingUIModule) return m;

            return {
                ...m,
                tasks: m.tasks.map(t => {
                    const matchingUILesson = matchingUIModule.lessons.find(l => l.id === t.id);
                    return matchingUILesson ? { ...t, completed: matchingUILesson.completed } : t;
                })
            };
        });

        // 2. Calculate Total Progress
        let totalTasks = 0;
        let totalCompleted = 0;
        updatedMilestones.forEach(m => {
            m.tasks.forEach(t => {
                totalTasks++;
                if (t.completed) totalCompleted++;
            });
        });
        const newTotalProgress = totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);

        // 3. Send PUT Request
        await axios.put(`${API_URL}/${activeRoadmap._id}`, {
            milestones: updatedMilestones,
            totalProgress: newTotalProgress
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 4. Update savedRoadmaps state so the main grid reflects changes
        const updatedActiveRoadmap = { ...activeRoadmap, milestones: updatedMilestones, totalProgress: newTotalProgress };
        setActiveRoadmap(updatedActiveRoadmap);
        setSavedRoadmaps(prev => prev.map(r => r._id === activeRoadmap._id ? updatedActiveRoadmap : r));

        toast({ title: "Progress Saved!", description: "Keep up the great work." });

    } catch (error) {
        console.error("Sync Error:", error);
        toast({ title: "Sync Failed", description: "Could not save progress to server.", variant: "destructive" });
    }
  };

  // --- VIEW 1: ACTIVE LESSON PLAYER ---
  if (activeLesson) {
    const module = currentModules.find((m) => m.id === activeLesson.moduleId);
    const lesson = module?.lessons.find((l) => l.id === activeLesson.lessonId);

    if (!lesson) return <div>Lesson not found</div>;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <Button variant="ghost" onClick={() => setActiveLesson(null)} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
          </Button>
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="outline" className="text-muted-foreground">{module?.title}</Badge>
          </div>
          <h1 className="text-3xl font-sora font-bold">
            <span className="gradient-text-accent">{lesson.title}</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN: Video & Code */}
            <div className="lg:col-span-2 space-y-6">
                {/* VIDEO CARD */}
                <Card variant="glow" className="overflow-hidden border-accent/20">
                    <div className="aspect-video bg-black/90 relative group flex items-center justify-center overflow-hidden">
                        {/* Abstract Background for video placeholder */}
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.8),rgba(20,20,20,0.9))]" />
                        
                        <div className="z-10 text-center p-6">
                            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 border border-accent/40 group-hover:scale-110 transition-transform cursor-pointer">
                                <Play className="w-6 h-6 text-accent fill-current ml-1" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{lesson.content.video}</h3>
                            <p className="text-gray-400 text-xs mb-4">Recommended Tutorial</p>
                            <Button 
                                size="sm" 
                                className="bg-red-600 hover:bg-red-700 text-white border-0"
                                onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(lesson.content.video)}`, '_blank')}
                            >
                                Watch on YouTube <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* CODE CARD */}
                <Card variant="feature">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Code className="w-5 h-5 text-accent" /> Code Example
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-border">
                            <pre className="text-primary">
                                {lesson.content.code || "// No code snippet provided"}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: Explanation & Exercise */}
            <div className="space-y-6">
                 {/* EXPLANATION */}
                <Card variant="feature">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-primary" /> Key Concept
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed text-sm">
                            {lesson.content.explanation}
                        </p>
                    </CardContent>
                </Card>

                {/* PRACTICE EXERCISE */}
                <Card variant="glow" className="border-accent/30 bg-accent/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2 text-accent-foreground text-white">
                            <Dumbbell className="w-5 h-5 text-primary" /> Practice Exercise
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium text-sm mb-4 text-muted-foreground">
                            {lesson.content.exercise || "Complete the code example above to finish."}
                        </p>
                        <Button className="w-full" variant="hero" onClick={completeLesson}>
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Complete
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
      </motion.div>
    );
  }

  // --- VIEW 2: MODULE LIST (Selected Roadmap) ---
  if (activeRoadmap) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <Button variant="ghost" onClick={() => setActiveRoadmap(null)} className="mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
                <h1 className="text-3xl font-sora font-bold mb-2">
                    <span className="gradient-text-accent">{activeRoadmap.career}</span> Path
                </h1>
                <p className="text-muted-foreground">Detailed Learning Modules</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium mb-1">Overall Progress</p>
                <div className="flex items-center gap-2">
                    <Progress value={activeRoadmap.totalProgress} className="w-32 h-2" />
                    <span className="text-sm font-bold">{activeRoadmap.totalProgress}%</span>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {currentModules.map((module, moduleIndex) => (
            <motion.div key={module.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: moduleIndex * 0.1 }}>
                <Card variant="feature">
                <CardHeader>
                    <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg mb-1">{module.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    <Badge variant="outline" className={module.progress === 100 ? "bg-success/10 text-success-soft" : ""}>
                        {module.progress}% Complete
                    </Badge>
                    </div>
                    <Progress value={module.progress} className="h-2 mt-3" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {module.lessons.map((lesson) => (
                    <button
                        key={lesson.id}
                        disabled={lesson.locked}
                        onClick={() => !lesson.locked && !lesson.completed && startLesson(module.id, lesson.id)}
                        className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all ${
                        lesson.locked ? "opacity-50 cursor-not-allowed bg-secondary/30" : 
                        lesson.completed ? "bg-success/5 border border-success/20" : 
                        "bg-secondary/50 hover:bg-secondary cursor-pointer"
                        }`}
                    >
                        {lesson.completed ? <CheckCircle2 className="w-5 h-5 text-success-soft" /> : 
                         lesson.locked ? <Lock className="w-5 h-5 text-muted-foreground" /> : 
                         <Play className="w-5 h-5 text-primary" />}
                        <span className={`flex-1 text-left text-sm ${lesson.completed ? "line-through text-muted-foreground" : ""}`}>{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                    </button>
                    ))}
                </CardContent>
                </Card>
            </motion.div>
            ))}
        </div>
      </motion.div>
    );
  }

  // --- VIEW 3: MAIN DASHBOARD (Empty or Pending) ---
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-sora font-bold mb-2">
          <span className="gradient-text-accent">Learning Modules</span>
        </h1>
        <p className="text-muted-foreground">
          Step-by-step learning content for your career path
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <>
            {savedRoadmaps.length === 0 ? (
                <>
                    <Card variant="glass" className="p-12 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center mx-auto mb-6">
                            <GraduationCap className="w-10 h-10 text-accent-foreground" />
                        </div>
                        <h3 className="text-xl font-sora font-semibold mb-3">Ready to start learning?</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            Begin your learning journey with structured modules covering theory, practical skills, and mini-projects
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/dashboard/career">
                                <Button variant="accent">
                                    <Rocket className="w-4 h-4 mr-2" /> Start Learning
                                </Button>
                            </Link>
                        </div>
                    </Card>

                    <Card variant="feature">
                        <CardContent className="p-6">
                            <h3 className="font-sora font-semibold mb-4">What Learning Modules Include</h3>
                            <div className="grid sm:grid-cols-3 gap-6">
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                    </div>
                                    <h4 className="font-medium mb-2">Theory</h4>
                                    <p className="text-sm text-muted-foreground">Core concepts and fundamentals explained clearly</p>
                                </div>
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                                        <Code className="w-5 h-5 text-accent" />
                                    </div>
                                    <h4 className="font-medium mb-2">Practical Skills</h4>
                                    <p className="text-sm text-muted-foreground">Hands-on exercises and coding challenges</p>
                                </div>
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="w-5 h-5 text-success-soft" />
                                    </div>
                                    <h4 className="font-medium mb-2">Mini-Projects</h4>
                                    <p className="text-sm text-muted-foreground">Build real projects to apply what you've learned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 1. Saved Roadmaps */}
                        {savedRoadmaps.map((roadmap) => (
                            <Card 
                                key={roadmap._id} 
                                variant="feature" 
                                className="cursor-pointer group hover:border-accent/50 transition-all"
                                onClick={() => selectRoadmap(roadmap)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 rounded-lg bg-accent/10">
                                            <Layout className="w-6 h-6 text-accent" />
                                        </div>
                                        <Badge variant="outline">{roadmap.timeline}</Badge>
                                    </div>
                                    <CardTitle className="text-xl">{roadmap.career}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-bold">{roadmap.totalProgress}%</span>
                                        </div>
                                        <Progress value={roadmap.totalProgress} className="h-2" />
                                        <div className="pt-2 flex items-center text-sm text-muted-foreground gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>{roadmap.milestones.length} Modules</span>
                                        </div>
                                        <Button className="w-full mt-2 group-hover:bg-accent group-hover:text-accent-foreground transition-colors" variant="outline">
                                            Continue
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* 2. Create New Path Card */}
                        <Link to="/dashboard/career">
                            <Card className="h-full border-dashed border-2 bg-transparent hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-6 min-h-[250px]">
                                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                    <Plus className="w-8 h-8 text-accent" />
                                </div>
                                <h3 className="font-sora font-bold text-xl mb-2">Create New Path</h3>
                                <p className="text-muted-foreground text-sm">Start a new career roadmap</p>
                            </Card>
                        </Link>
                    </div>

                    <Card variant="feature">
                        <CardContent className="p-6">
                            <h3 className="font-sora font-semibold mb-4">What Learning Modules Include</h3>
                            <div className="grid sm:grid-cols-3 gap-6">
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                    </div>
                                    <h4 className="font-medium mb-2">Theory</h4>
                                    <p className="text-sm text-muted-foreground">Core concepts and fundamentals explained clearly</p>
                                </div>
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                                        <Code className="w-5 h-5 text-accent" />
                                    </div>
                                    <h4 className="font-medium mb-2">Practical Skills</h4>
                                    <p className="text-sm text-muted-foreground">Hands-on exercises and coding challenges</p>
                                </div>
                                <div className="text-center p-4">
                                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="w-5 h-5 text-success-soft" />
                                    </div>
                                    <h4 className="font-medium mb-2">Mini-Projects</h4>
                                    <p className="text-sm text-muted-foreground">Build real projects to apply what you've learned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
      )}
    </motion.div>
  );
};

export default Modules;