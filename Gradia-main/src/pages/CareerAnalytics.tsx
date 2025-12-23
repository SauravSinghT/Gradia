import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import API_BASE_URL from "@/config";
import {
  TrendingUp,
  Rocket,
  Target,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Loader2,
  PieChart
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

// --- CONFIGURATION ---
const API_URL = `${API_BASE_URL}/roadmaps`;

// --- TYPES ---
interface QuizReport {
  score: number;
  total: number;
  strongAreas: string[];
  weakAreas: string[];
  takenAt: string;
}

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  quizReports?: QuizReport[];
}

interface Roadmap {
  _id: string;
  career: string;
  totalProgress: number;
  milestones: Milestone[];
}

interface AnalyticsSummary {
  totalRoadmaps: number;
  totalModules: number;
  completedModules: number;
  overallProgress: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  topStrengths: { name: string; count: number }[];
  topWeaknesses: { name: string; count: number }[];
  recentActivity: { career: string; milestone: string; score: number; date: string }[];
}

const CareerAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoadmaps(data);
      processAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (data: Roadmap[]) => {
    let totalModules = 0;
    let completedModules = 0;
    let totalScore = 0;
    let totalQuizzes = 0;
    
    const strengthMap: Record<string, number> = {};
    const weaknessMap: Record<string, number> = {};
    const activityLog: any[] = [];

    data.forEach(map => {
      map.milestones.forEach(m => {
        totalModules++;
        if (m.completed) completedModules++;

        if (m.quizReports && m.quizReports.length > 0) {
          // Get stats from all reports (or just latest if you prefer)
          m.quizReports.forEach(q => {
            totalQuizzes++;
            totalScore += (q.score / q.total) * 100;

            // Aggregate Strengths
            q.strongAreas.forEach(s => {
              strengthMap[s] = (strengthMap[s] || 0) + 1;
            });

            // Aggregate Weaknesses
            q.weakAreas.forEach(w => {
              weaknessMap[w] = (weaknessMap[w] || 0) + 1;
            });

            // Add to activity log
            activityLog.push({
              career: map.career,
              milestone: m.title,
              score: Math.round((q.score / q.total) * 100),
              date: q.takenAt
            });
          });
        }
      });
    });

    // Sort Maps
    const sortMap = (map: Record<string, number>) => 
      Object.entries(map)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    setStats({
      totalRoadmaps: data.length,
      totalModules,
      completedModules,
      overallProgress: totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100),
      totalQuizzesTaken: totalQuizzes,
      averageQuizScore: totalQuizzes === 0 ? 0 : Math.round(totalScore / totalQuizzes),
      topStrengths: sortMap(strengthMap),
      topWeaknesses: sortMap(weaknessMap),
      recentActivity: activityLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // --- VIEW: EMPTY STATE ---
  if (!stats || stats.totalRoadmaps === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">Career Analytics</span>
          </h1>
          <p className="text-muted-foreground">Track your progress on the career roadmap</p>
        </div>
        <Card variant="glass" className="p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-soft flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="w-10 h-10 text-accent-foreground" />
          </div>
          <h3 className="text-xl font-sora font-semibold mb-3">No analytics yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Start working on your career roadmap to track your daily progress, completed tasks, and learning milestones.
          </p>
          <Link to="/dashboard/career">
            <Button variant="accent">
              <Rocket className="w-4 h-4 mr-2" /> View Career Roadmap
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  // --- VIEW: DATA DASHBOARD ---
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text-accent">Career Analytics</span>
          </h1>
          <p className="text-muted-foreground">Detailed analysis of your learning journey</p>
        </div>
        <Card variant="glass" className="px-4 py-2 hidden sm:block">
            <span className="text-sm font-medium text-muted-foreground">Last Updated: Just now</span>
        </Card>
      </div>

      {/* 1. KEY METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="feature" className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Target className="w-5 h-5" /></div>
                <span className="text-sm text-muted-foreground">Completion</span>
            </div>
            <div className="text-3xl font-bold">{stats.overallProgress}%</div>
            <Progress value={stats.overallProgress} className="h-1.5 mt-3" />
        </Card>

        <Card variant="feature" className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-lg text-accent"><BrainCircuit className="w-5 h-5" /></div>
                <span className="text-sm text-muted-foreground">Avg. Quiz Score</span>
            </div>
            <div className="text-3xl font-bold">{stats.averageQuizScore}%</div>
            <div className="text-xs text-muted-foreground mt-2">Across {stats.totalQuizzesTaken} assessments</div>
        </Card>

        <Card variant="feature" className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-success/10 rounded-lg text-success"><CheckCircle2 className="w-5 h-5" /></div>
                <span className="text-sm text-muted-foreground">Modules Done</span>
            </div>
            <div className="text-3xl font-bold">{stats.completedModules} <span className="text-base text-muted-foreground font-normal">/ {stats.totalModules}</span></div>
        </Card>

        <Card variant="feature" className="p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><BarChart3 className="w-5 h-5" /></div>
                <span className="text-sm text-muted-foreground">Active Paths</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalRoadmaps}</div>
        </Card>
      </div>

      {/* 2. GAP ANALYSIS (Strengths vs Weaknesses) */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="glow" className="flex-1">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-destructive" /> Areas to Improve
                </CardTitle>
            </CardHeader>
            <CardContent>
                {stats.topWeaknesses.length > 0 ? (
                    <div className="space-y-4">
                        {stats.topWeaknesses.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-muted-foreground text-xs">Flagged {item.count} times</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-destructive/60" 
                                        style={{ width: `${(item.count / stats.totalQuizzesTaken) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        No specific weaknesses detected yet. Keep taking quizzes!
                    </div>
                )}
            </CardContent>
        </Card>

        <Card variant="glass" className="flex-1 border-success/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Rocket className="w-5 h-5 text-success-soft" /> Top Strengths
                </CardTitle>
            </CardHeader>
            <CardContent>
                {stats.topStrengths.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {stats.topStrengths.map((item, idx) => (
                            <Badge key={idx} variant="outline" className="px-3 py-1.5 text-sm bg-success/5 border-success/20 text-foreground">
                                {item.name}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Complete assessments to discover your strengths.
                    </div>
                )}
            </CardContent>
        </Card>
      </div>

      {/* 3. ROADMAP BREAKDOWN */}
      <div>
        <h2 className="text-xl font-bold mb-4 font-sora">Roadmap Performance</h2>
        <div className="grid gap-4">
            {roadmaps.map(map => (
                <Card key={map._id} variant="feature">
                    <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-lg">{map.career}</h3>
                                <span className="text-sm font-mono text-muted-foreground">{map.totalProgress}%</span>
                            </div>
                            <Progress value={map.totalProgress} className="h-2 mb-4" />
                            
                            <div className="flex gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Target className="w-4 h-4" /> {map.milestones.length} Modules
                                </div>
                                <div className="flex items-center gap-1">
                                    <PieChart className="w-4 h-4" /> {map.milestones.filter(m => m.completed).length} Completed
                                </div>
                            </div>
                        </div>
                        
                        <div className="w-full sm:w-auto flex flex-col gap-2">
                            <Link to="/dashboard/modules">
                                <Button variant="outline" className="w-full">View Modules</Button>
                            </Link>
                            <Link to="/dashboard/tasks">
                                <Button variant="ghost" className="w-full">Take Quiz</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>

    </motion.div>
  );
};

export default CareerAnalytics;