import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import API_BASE_URL from "@/config";
import {
  BarChart3,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  Loader2,
  Minus,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// --- TYPES ---
interface QuizAttempt {
  _id: string;
  title: string;
  description: string;
  metadata?: {
    score: number;
    questionCount: number;
    correctAnswers: number;
  };
  createdAt: string;
}

interface TopicPerformance {
  topic: string;
  score: number; // Average Score
  questionsAttempted: number;
  attempts: number;
  lastScore: number;
  trend: "up" | "down" | "stable";
}

// --- HELPER FUNCTIONS (Moved Outside Component to fix ReferenceError) ---
const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up": return <TrendingUp className="w-4 h-4 text-green-500" />;
    case "down": return <TrendingDown className="w-4 h-4 text-red-500" />;
    default: return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const Assessment = () => {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [performanceData, setPerformanceData] = useState<TopicPerformance[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rawHistory, setRawHistory] = useState<QuizAttempt[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Ensure your backend URL is correct here (e.g. localhost:5000 or your render URL)
      const { data } = await axios.get("http://localhost:5000/api/history?historyType=quizAttempt&limit=100", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.data && data.data.length > 0) {
        setRawHistory(data.data);
        processAnalytics(data.data);
        setHasData(true);
      } else {
        setHasData(false);
      }
    } catch (error) {
      console.error("Failed to load assessment history", error);
      toast({ title: "Error", description: "Could not load analytics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (history: QuizAttempt[]) => {
    const topicMap: Record<string, { 
      totalScore: number; 
      count: number; 
      totalQuestions: number; 
      scores: number[]; 
    }> = {};

    history.forEach(item => {
      // Fallback topic name if title is missing
      const topicName = item.title ? item.title.split('-')[0].trim() : "General"; 
      const score = item.metadata?.score || 0;
      const questions = item.metadata?.questionCount || 0;

      if (!topicMap[topicName]) {
        topicMap[topicName] = { totalScore: 0, count: 0, totalQuestions: 0, scores: [] };
      }

      topicMap[topicName].totalScore += score;
      topicMap[topicName].count += 1;
      topicMap[topicName].totalQuestions += questions;
      topicMap[topicName].scores.push(score);
    });

    const processed: TopicPerformance[] = Object.keys(topicMap).map(topic => {
      const data = topicMap[topic];
      const avgScore = Math.round(data.totalScore / data.count);
      
      const lastScore = data.scores[0]; 
      let trend: "up" | "down" | "stable" = "stable";
      
      if (data.scores.length > 1) {
        if (lastScore > avgScore + 5) trend = "up";
        else if (lastScore < avgScore - 5) trend = "down";
      }

      return {
        topic,
        score: avgScore,
        questionsAttempted: data.totalQuestions,
        attempts: data.count,
        lastScore,
        trend
      };
    });

    setPerformanceData(processed.sort((a, b) => b.score - a.score));
  };

  // Derived Stats
  const strongTopics = performanceData.filter((t) => t.score >= 70);
  const weakTopics = performanceData.filter((t) => t.score < 60);
  const averageScore = performanceData.length > 0 
    ? Math.round(performanceData.reduce((acc, t) => acc + t.score, 0) / performanceData.length)
    : 0;

  // Chart Data
  const barChartData = performanceData.map(p => ({
    name: p.topic.length > 12 ? p.topic.substring(0, 12) + '...' : p.topic,
    fullName: p.topic,
    score: p.score
  }));

  // --- RENDERING ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2"><span className="gradient-text">Assessment Analytics</span></h1>
          <p className="text-muted-foreground">Track your quiz performance and identify areas for improvement</p>
        </div>
        <Card variant="glass" className="p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-sora font-semibold mb-3">No assessment data yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Complete quizzes and tests to see your performance analytics here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard/tests">
              <Button variant="hero">
                <ClipboardCheck className="w-4 h-4 mr-2" /> Take a Quiz
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2"><span className="gradient-text">Assessment Analytics</span></h1>
          <p className="text-muted-foreground">
            Overall Average: <span className={`font-bold text-lg ${getScoreColor(averageScore)}`}>{averageScore}%</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/tests">
            <Button variant="hero"><ClipboardCheck className="w-4 h-4 mr-2" /> Take Quiz</Button>
          </Link>
          <Button variant="outline" onClick={fetchHistory} title="Refresh Data">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card variant="glow">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold gradient-text mb-2">{averageScore}%</p>
            <p className="text-sm text-muted-foreground">Global Average</p>
          </CardContent>
        </Card>
        <Card variant="feature" className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-green-600 mb-2">{strongTopics.length}</p>
            <p className="text-sm text-muted-foreground">Strong Topics (70%+)</p>
          </CardContent>
        </Card>
        <Card variant="feature" className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-red-600 mb-2">{weakTopics.length}</p>
            <p className="text-sm text-muted-foreground">Needs Focus (&lt;60%)</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* 1. Topic Performance Bar Chart */}
        <Card>
            <CardHeader>
                <CardTitle>Score by Topic</CardTitle>
                <CardDescription>Average performance across different subjects</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                            {barChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.score >= 70 ? '#22c55e' : entry.score >= 50 ? '#eab308' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>

        {/* 2. Detailed Metrics List */}
        <Card>
            <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
                <CardDescription>Breakdown by questions attempted and trends</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {performanceData.slice(0, 5).map((topic, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{topic.topic}</span>
                                    {getTrendIcon(topic.trend)}
                                </div>
                                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${topic.score >= 70 ? 'bg-green-500' : topic.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{ width: `${topic.score}%` }} 
                                    />
                                </div>
                            </div>
                            <div className="text-right pl-4">
                                <span className="block font-bold text-sm">{topic.score}%</span>
                                <span className="text-xs text-muted-foreground">{topic.questionsAttempted} Qs</span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Recommendation Section */}
      {weakTopics.length > 0 && (
        <Card variant="glass" className="border-l-4 border-l-red-500">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground mb-1">
                        <Target className="w-5 h-5 text-red-500" /> Focus Recommendation
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        You should review <strong>{weakTopics[0].topic}</strong> based on your recent performance ({weakTopics[0].score}%).
                    </p>
                </div>
                <Link to="/dashboard/study-sets">
                    <Button variant="outline" className="shrink-0">
                        Generate Study Material <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
      )}

    </motion.div>
  );
};

export default Assessment;