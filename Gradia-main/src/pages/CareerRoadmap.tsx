import { useState } from "react";
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
  Calendar,
  BookOpen,
  Code,
  Trophy,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const careerOptions = [
  { id: "web", title: "Web Developer", duration: "3 weeks" },
  { id: "data", title: "Data Scientist", duration: "4 weeks" },
  { id: "mobile", title: "Mobile Developer", duration: "3 weeks" },
  { id: "cloud", title: "Cloud Engineer", duration: "4 weeks" },
  { id: "ai", title: "AI/ML Engineer", duration: "5 weeks" },
  { id: "devops", title: "DevOps Engineer", duration: "3 weeks" },
];

interface Milestone {
  id: string;
  title: string;
  description: string;
  week: number;
  completed: boolean;
  tasks: { id: string; title: string; completed: boolean }[];
}

interface GeneratedRoadmap {
  career: string;
  timeline: string;
  milestones: Milestone[];
  totalProgress: number;
}

const CareerRoadmap = () => {
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);
  const [customTimeline, setCustomTimeline] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const { toast } = useToast();

  const generateRoadmap = async () => {
    if (!selectedCareer || !customTimeline) return;
    
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const careerTitle = careerOptions.find(c => c.id === selectedCareer)?.title || "";
    
    const generatedMilestones: Milestone[] = [
      {
        id: "1",
        title: "Foundation & Setup",
        description: "Set up development environment and learn core fundamentals",
        week: 1,
        completed: false,
        tasks: [
          { id: "1-1", title: "Install required tools and IDE", completed: false },
          { id: "1-2", title: "Complete beginner tutorials", completed: false },
          { id: "1-3", title: "Understand basic concepts and terminology", completed: false },
          { id: "1-4", title: "Build your first hello world project", completed: false },
        ],
      },
      {
        id: "2",
        title: "Core Skills Development",
        description: "Master essential skills and build foundational projects",
        week: 2,
        completed: false,
        tasks: [
          { id: "2-1", title: "Learn data structures and algorithms basics", completed: false },
          { id: "2-2", title: "Complete 5 coding challenges", completed: false },
          { id: "2-3", title: "Build a small portfolio project", completed: false },
          { id: "2-4", title: "Study best practices and patterns", completed: false },
        ],
      },
      {
        id: "3",
        title: "Advanced Concepts",
        description: "Dive into advanced topics and real-world applications",
        week: 3,
        completed: false,
        tasks: [
          { id: "3-1", title: "Learn framework/library specifics", completed: false },
          { id: "3-2", title: "Build an intermediate project", completed: false },
          { id: "3-3", title: "Implement testing and debugging", completed: false },
          { id: "3-4", title: "Code review and refactoring practice", completed: false },
        ],
      },
      {
        id: "4",
        title: "Portfolio & Job Ready",
        description: "Create impressive portfolio and prepare for interviews",
        week: 4,
        completed: false,
        tasks: [
          { id: "4-1", title: "Build a capstone project", completed: false },
          { id: "4-2", title: "Create portfolio website", completed: false },
          { id: "4-3", title: "Practice interview questions", completed: false },
          { id: "4-4", title: "Apply to entry-level positions", completed: false },
        ],
      },
    ];
    
    setRoadmap({
      career: careerTitle,
      timeline: customTimeline,
      milestones: generatedMilestones,
      totalProgress: 0,
    });
    
    setIsGenerating(false);
    toast({ 
      title: "Roadmap Generated!", 
      description: `Your ${careerTitle} roadmap is ready.` 
    });
  };

  const toggleTask = (milestoneId: string, taskId: string) => {
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
    
    const totalTasks = updatedMilestones.reduce((acc, m) => acc + m.tasks.length, 0);
    const completedTasks = updatedMilestones.reduce(
      (acc, m) => acc + m.tasks.filter((t) => t.completed).length,
      0
    );
    
    setRoadmap({
      ...roadmap,
      milestones: updatedMilestones,
      totalProgress: Math.round((completedTasks / totalTasks) * 100),
    });
    
    toast({ title: "Progress updated!" });
  };

  const resetRoadmap = () => {
    setRoadmap(null);
    setSelectedCareer(null);
    setCustomTimeline("");
  };

  // Show generated roadmap
  if (roadmap) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={resetRoadmap} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Create New Roadmap
            </Button>
            <h1 className="text-3xl font-sora font-bold">
              <span className="gradient-text-accent">{roadmap.career}</span> Roadmap
            </h1>
            <p className="text-muted-foreground">
              Timeline: {roadmap.timeline} • {roadmap.milestones.length} milestones
            </p>
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

        {/* Milestones */}
        <div className="space-y-4">
          {roadmap.milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                variant={milestone.completed ? "glow" : "feature"} 
                className={`overflow-hidden ${milestone.completed ? "border-success/30" : ""}`}
              >
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedMilestone(
                      expandedMilestone === milestone.id ? null : milestone.id
                    )}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      milestone.completed 
                        ? "bg-success/20" 
                        : "bg-gradient-to-br from-accent to-amber-soft"
                    }`}>
                      {milestone.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-success-soft" />
                      ) : (
                        <span className="text-lg font-bold text-accent-foreground">
                          W{milestone.week}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{milestone.title}</h3>
                        {milestone.completed && (
                          <Badge variant="outline" className="bg-success/10 text-success-soft border-success/30">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedMilestone === milestone.id ? "rotate-90" : ""
                    }`} />
                  </button>

                  <AnimatePresence>
                    {expandedMilestone === milestone.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3 border-t border-border">
                          <p className="text-sm font-medium text-muted-foreground">Tasks:</p>
                          {milestone.tasks.map((task) => (
                            <button
                              key={task.id}
                              onClick={() => toggleTask(milestone.id, task.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                                task.completed
                                  ? "bg-success/5 border border-success/20"
                                  : "bg-secondary/50 hover:bg-secondary"
                              }`}
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-success-soft flex-shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={`text-sm text-left ${
                                task.completed ? "line-through text-muted-foreground" : ""
                              }`}>
                                {task.title}
                              </span>
                            </button>
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

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/dashboard/tasks">
            <Card variant="feature" className="p-4 hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <h4 className="font-medium">Daily Tasks</h4>
                  <p className="text-sm text-muted-foreground">Manage your daily activities</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link to="/dashboard/modules">
            <Card variant="feature" className="p-4 hover:border-accent/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-accent" />
                <div>
                  <h4 className="font-medium">Learning Modules</h4>
                  <p className="text-sm text-muted-foreground">Access structured content</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
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
          <span className="gradient-text-accent">Go-Getter</span> Guide
        </h1>
        <p className="text-muted-foreground">
          Get a personalized career roadmap tailored to your goals and timeline
        </p>
      </div>

      {/* Career Selection */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-accent" />
            Choose Your Career Path
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {careerOptions.map((career) => (
              <button
                key={career.id}
                onClick={() => setSelectedCareer(career.id)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  selectedCareer === career.id
                    ? "bg-accent/10 border-accent/50"
                    : "bg-secondary/50 border-transparent hover:bg-secondary"
                }`}
              >
                <h4 className="font-semibold mb-1">{career.title}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {career.duration}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Selection */}
      <Card variant="feature">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-primary" />
            Set Your Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            How much time do you have to complete this roadmap?
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            {["2 weeks", "1 month", "2 months", "3 months"].map((time) => (
              <Button
                key={time}
                variant={customTimeline === time ? "hero" : "outline"}
                onClick={() => setCustomTimeline(time)}
              >
                {time}
              </Button>
            ))}
          </div>
          <div className="flex gap-3">
            <Input
              placeholder="Or enter custom timeline..."
              value={customTimeline}
              onChange={(e) => setCustomTimeline(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Generate Roadmap CTA */}
      <Card variant="glow">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-sora font-semibold">Ready to start your journey?</h3>
              <p className="text-sm text-muted-foreground">
                AI will create a personalized roadmap with daily tasks and milestones
              </p>
            </div>
          </div>
          <Button 
            variant="accent" 
            disabled={!selectedCareer || !customTimeline || isGenerating}
            onClick={generateRoadmap}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Generate Roadmap
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* What you'll get */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">📋</div>
            <h3 className="font-semibold mb-2">Daily Tasks</h3>
            <p className="text-sm text-muted-foreground">
              Bite-sized daily activities to keep you on track
            </p>
          </CardContent>
        </Card>
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-semibold mb-2">Learning Modules</h3>
            <p className="text-sm text-muted-foreground">
              Structured content with theory and practice
            </p>
          </CardContent>
        </Card>
        <Card variant="feature">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold mb-2">Milestones</h3>
            <p className="text-sm text-muted-foreground">
              Clear goals to measure your progress
            </p>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default CareerRoadmap;