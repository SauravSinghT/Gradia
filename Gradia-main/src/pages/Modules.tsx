import { useState } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  progress: number;
}

const sampleModules: Module[] = [
  {
    id: "1",
    title: "Getting Started with Web Development",
    description: "Learn the fundamentals of HTML, CSS, and JavaScript",
    progress: 0,
    lessons: [
      { id: "1-1", title: "Introduction to HTML", duration: "15 min", completed: false, locked: false },
      { id: "1-2", title: "HTML Structure & Elements", duration: "20 min", completed: false, locked: true },
      { id: "1-3", title: "CSS Basics & Styling", duration: "25 min", completed: false, locked: true },
      { id: "1-4", title: "JavaScript Fundamentals", duration: "30 min", completed: false, locked: true },
    ],
  },
  {
    id: "2",
    title: "Building Interactive Websites",
    description: "Create dynamic and responsive web applications",
    progress: 0,
    lessons: [
      { id: "2-1", title: "DOM Manipulation", duration: "25 min", completed: false, locked: true },
      { id: "2-2", title: "Event Handling", duration: "20 min", completed: false, locked: true },
      { id: "2-3", title: "Responsive Design", duration: "30 min", completed: false, locked: true },
      { id: "2-4", title: "Mini Project: Portfolio", duration: "45 min", completed: false, locked: true },
    ],
  },
];

const Modules = () => {
  const [hasStartedRoadmap, setHasStartedRoadmap] = useState(false);
  const [modules, setModules] = useState<Module[]>(sampleModules);
  const [activeLesson, setActiveLesson] = useState<{ moduleId: string; lessonId: string } | null>(null);
  const { toast } = useToast();

  const startRoadmap = () => {
    setHasStartedRoadmap(true);
    toast({ title: "Modules Unlocked!", description: "Start with the first lesson." });
  };

  const startLesson = (moduleId: string, lessonId: string) => {
    setActiveLesson({ moduleId, lessonId });
  };

  const completeLesson = () => {
    if (!activeLesson) return;

    setModules((prev) =>
      prev.map((module) => {
        if (module.id === activeLesson.moduleId) {
          const updatedLessons = module.lessons.map((lesson, index, arr) => {
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
        // Unlock first lesson of next module if current module is complete
        return module;
      })
    );

    setActiveLesson(null);
    toast({ title: "Lesson Completed!", description: "Great progress! Keep going." });
  };

  // Active lesson view
  if (activeLesson) {
    const module = modules.find((m) => m.id === activeLesson.moduleId);
    const lesson = module?.lessons.find((l) => l.id === activeLesson.lessonId);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <Button variant="ghost" onClick={() => setActiveLesson(null)} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">{lesson?.title}</span>
          </h1>
          <p className="text-muted-foreground">{module?.title}</p>
        </div>

        <Card variant="glow" className="p-8">
          <div className="aspect-video bg-secondary/50 rounded-xl flex items-center justify-center mb-6">
            <div className="text-center">
              <Play className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Video lesson content would appear here</p>
              <p className="text-sm text-muted-foreground mt-2">Duration: {lesson?.duration}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Lesson Content</h3>
            <p className="text-muted-foreground">
              This is where the detailed lesson content, code examples, and explanations would be displayed. 
              The content would be dynamically loaded based on the career path and module selected.
            </p>
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm font-mono text-primary">
                // Example code snippet<br />
                console.log("Hello, World!");
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button variant="hero" onClick={completeLesson}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Complete
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (!hasStartedRoadmap) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">Learning Modules</span>
          </h1>
          <p className="text-muted-foreground">
            Step-by-step learning content for your career path
          </p>
        </div>

        {/* Empty State */}
        <Card variant="glass" className="p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-accent-foreground" />
          </div>
          <h3 className="text-xl font-sora font-semibold mb-3">Ready to start learning?</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Begin your learning journey with structured modules covering theory, practical skills, and mini-projects
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="accent" onClick={startRoadmap}>
              <Rocket className="w-4 h-4 mr-2" />
              Start Learning
            </Button>
            <Link to="/dashboard/career">
              <Button variant="outline">
                Create Career Roadmap First
              </Button>
            </Link>
          </div>
        </Card>

        {/* What modules include */}
        <Card variant="feature">
          <CardContent className="p-6">
            <h3 className="font-sora font-semibold mb-4">What Learning Modules Include</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-medium mb-2">Theory</h4>
                <p className="text-sm text-muted-foreground">
                  Core concepts and fundamentals explained clearly
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3">
                  <Code className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-medium mb-2">Practical Skills</h4>
                <p className="text-sm text-muted-foreground">
                  Hands-on exercises and coding challenges
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-3">
                  <Trophy className="w-5 h-5 text-success-soft" />
                </div>
                <h4 className="font-medium mb-2">Mini-Projects</h4>
                <p className="text-sm text-muted-foreground">
                  Build real projects to apply what you've learned
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-sora font-bold mb-2">
          <span className="gradient-text-accent">Learning Modules</span>
        </h1>
        <p className="text-muted-foreground">
          Complete lessons to unlock the next ones
        </p>
      </div>

      {/* Modules List */}
      <div className="space-y-6">
        {modules.map((module, moduleIndex) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: moduleIndex * 0.1 }}
          >
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
                      lesson.locked
                        ? "opacity-50 cursor-not-allowed bg-secondary/30"
                        : lesson.completed
                        ? "bg-success/5 border border-success/20"
                        : "bg-secondary/50 hover:bg-secondary cursor-pointer"
                    }`}
                  >
                    {lesson.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success-soft flex-shrink-0" />
                    ) : lesson.locked ? (
                      <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Play className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                    <span className={`flex-1 text-left text-sm ${lesson.completed ? "line-through text-muted-foreground" : ""}`}>
                      {lesson.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                    {!lesson.locked && !lesson.completed && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Modules;