import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface TopicPerformance {
  topic: string;
  score: number;
  questionsAttempted: number;
  trend: "up" | "down" | "stable";
}

const Assessment = () => {
  const [hasData, setHasData] = useState(false);
  const [performanceData, setPerformanceData] = useState<TopicPerformance[]>([]);
  const { toast } = useToast();

  const generateSampleData = () => {
    const sampleData: TopicPerformance[] = [
      { topic: "Data Structures", score: 85, questionsAttempted: 24, trend: "up" },
      { topic: "Object-Oriented Programming", score: 72, questionsAttempted: 18, trend: "stable" },
      { topic: "Database Management", score: 45, questionsAttempted: 12, trend: "down" },
      { topic: "Algorithms", score: 68, questionsAttempted: 20, trend: "up" },
      { topic: "Operating Systems", score: 55, questionsAttempted: 15, trend: "stable" },
      { topic: "Computer Networks", score: 38, questionsAttempted: 10, trend: "down" },
    ];
    setPerformanceData(sampleData);
    setHasData(true);
    toast({ title: "Assessment Data Loaded", description: "Showing your performance analytics." });
  };

  const strongTopics = performanceData.filter((t) => t.score >= 70);
  const weakTopics = performanceData.filter((t) => t.score < 60);
  const averageScore = performanceData.length > 0 
    ? Math.round(performanceData.reduce((acc, t) => acc + t.score, 0) / performanceData.length)
    : 0;

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success-soft" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success-soft";
    if (score >= 60) return "text-accent";
    return "text-destructive";
  };

  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">Assessment Analytics</span>
          </h1>
          <p className="text-muted-foreground">
            Track your quiz performance and identify areas for improvement
          </p>
        </div>

        {/* Empty State */}
        <Card variant="glass" className="p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-sora font-semibold mb-3">No assessment data yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Complete quizzes and tests to see your performance analytics, including strong topics and areas needing improvement
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard/tests">
              <Button variant="hero">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Take a Quiz
              </Button>
            </Link>
            <Button variant="outline" onClick={generateSampleData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Load Sample Data
            </Button>
          </div>
        </Card>

        {/* What you'll see */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card variant="feature">
            <CardContent className="p-6">
              <h3 className="font-sora font-semibold mb-4 text-success-soft">Strong Topics</h3>
              <p className="text-sm text-muted-foreground">
                Topics where you consistently score above 70% will appear here
              </p>
            </CardContent>
          </Card>
          <Card variant="feature">
            <CardContent className="p-6">
              <h3 className="font-sora font-semibold mb-4 text-destructive">Needs Improvement</h3>
              <p className="text-sm text-muted-foreground">
                Topics where you score below 60% will be highlighted for focused study
              </p>
            </CardContent>
          </Card>
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">Assessment Analytics</span>
          </h1>
          <p className="text-muted-foreground">
            Overall Average: <span className={`font-semibold ${getScoreColor(averageScore)}`}>{averageScore}%</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/tests">
            <Button variant="hero">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Take More Quizzes
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setHasData(false)}>
            Reset
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <Card variant="glow">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold gradient-text mb-2">{averageScore}%</p>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card variant="feature" className="border-success/30">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-success-soft mb-2">{strongTopics.length}</p>
            <p className="text-sm text-muted-foreground">Strong Topics</p>
          </CardContent>
        </Card>
        <Card variant="feature" className="border-destructive/30">
          <CardContent className="p-6 text-center">
            <p className="text-4xl font-bold text-destructive mb-2">{weakTopics.length}</p>
            <p className="text-sm text-muted-foreground">Need Improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* All Topics Performance */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Topic-wise Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceData.map((topic, index) => (
            <motion.div
              key={topic.topic}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{topic.topic}</span>
                  {getTrendIcon(topic.trend)}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {topic.questionsAttempted} questions
                  </span>
                  <span className={`font-semibold ${getScoreColor(topic.score)}`}>
                    {topic.score}%
                  </span>
                </div>
              </div>
              <Progress 
                value={topic.score} 
                className={`h-2 ${
                  topic.score >= 80 
                    ? "[&>div]:bg-success" 
                    : topic.score >= 60 
                    ? "[&>div]:bg-accent" 
                    : "[&>div]:bg-destructive"
                }`} 
              />
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Strong & Weak Topics */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card variant="feature" className="border-success/20">
          <CardHeader>
            <CardTitle className="text-lg text-success-soft flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Strong Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {strongTopics.length > 0 ? (
              strongTopics.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-3 rounded-lg bg-success/5">
                  <span>{topic.topic}</span>
                  <span className="font-semibold text-success-soft">{topic.score}%</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Keep practicing to build strong topics!</p>
            )}
          </CardContent>
        </Card>

        <Card variant="feature" className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {weakTopics.length > 0 ? (
              weakTopics.map((topic) => (
                <div key={topic.topic} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                  <span>{topic.topic}</span>
                  <span className="font-semibold text-destructive">{topic.score}%</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Great job! No weak areas detected.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default Assessment;