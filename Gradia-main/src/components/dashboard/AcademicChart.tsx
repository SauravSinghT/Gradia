import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  BrainCircuit, 
  FileText, 
  TrendingUp, 
  Activity,
  Loader2
} from "lucide-react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";

// --- TYPES ---
interface HistoryItem {
  historyType: 'summary' | 'flashcard' | 'quiz' | 'quizAttempt';
  createdAt: string;
  metadata?: {
    score?: number;
  };
}

const AcademicChart = () => {
  const [loading, setLoading] = useState(true);
  
  // Stats State
  const [stats, setStats] = useState({
    summaryCount: 0,
    flashcardCount: 0,
    quizCount: 0,
    avgQuizScore: 0,
    totalActivity: 0
  });

  // Chart Data
  const [activityData, setActivityData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all history types
      const { data } = await axios.get("http://localhost:5000/api/history?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      processData(data.data || []);
    } catch (error) {
      console.error("Failed to fetch academic history", error);
    } finally {
      setLoading(false);
    }
  };

  const processData = (items: HistoryItem[]) => {
    let sCount = 0; // Summaries
    let fCount = 0; // Flashcards
    let qCount = 0; // Quiz Attempts
    let totalScore = 0;

    // 1. Process Totals
    items.forEach(item => {
      if (item.historyType === 'summary') sCount++;
      if (item.historyType === 'flashcard') fCount++;
      if (item.historyType === 'quizAttempt') {
        qCount++;
        if (item.metadata?.score) totalScore += item.metadata.score;
      }
    });

    // 2. Process Activity Over Time (Last 7 Days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return { 
        date: d.toISOString().split('T')[0], 
        day: days[d.getDay()], 
        activity: 0 
      };
    });

    items.forEach(item => {
      const itemDate = item.createdAt.split('T')[0];
      const dayEntry = last7Days.find(d => d.date === itemDate);
      if (dayEntry) {
        dayEntry.activity += 1;
      }
    });

    setActivityData(last7Days);

    // 3. Process Radar Data (Normalized to 100 for balance visualization)
    // We normalize to show relative effort in each area
    const totalActions = sCount + fCount + qCount || 1;
    
    setRadarData([
      { subject: "Reading", A: Math.min((sCount / totalActions) * 100 * 3, 100), fullMark: 100 }, // Multiplier to make chart look fuller
      { subject: "Testing", A: Math.min((qCount / totalActions) * 100 * 3, 100), fullMark: 100 },
      { subject: "Recall", A: Math.min((fCount / totalActions) * 100 * 3, 100), fullMark: 100 },
      { subject: "Consistency", A: Math.min(items.length > 5 ? 80 : items.length * 10, 100), fullMark: 100 },
      { subject: "Mastery", A: qCount > 0 ? Math.round(totalScore / qCount) : 0, fullMark: 100 },
    ]);

    setStats({
      summaryCount: sCount,
      flashcardCount: fCount,
      quizCount: qCount,
      avgQuizScore: qCount > 0 ? Math.round(totalScore / qCount) : 0,
      totalActivity: items.length
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2 rounded-lg shadow-sm text-xs">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">{payload[0].value} Actions</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Card className="h-full border-transparent shadow-none bg-transparent sm:border-border sm:shadow-sm sm:bg-card">
      <CardHeader className="px-0 sm:px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="w-6 h-6 text-primary" />
            Academic Mastery
          </CardTitle>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            <Activity className="w-3 h-3 mr-1" />
            {stats.totalActivity} Activities
          </Badge>
        </div>
        <CardDescription>
          Overview of your study habits, resource creation, and quiz performance.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 sm:px-6 space-y-6">
        
        {/* 1. KPI CARDS ROW */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-secondary/20 rounded-xl p-3 border border-border/50 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Summaries</p>
            <div className="text-xl sm:text-2xl font-bold text-primary">{stats.summaryCount}</div>
          </div>
          <div className="bg-secondary/20 rounded-xl p-3 border border-border/50 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Flashcards</p>
            <div className="text-xl sm:text-2xl font-bold text-accent">{stats.flashcardCount}</div>
          </div>
          <div className="bg-secondary/20 rounded-xl p-3 border border-border/50 text-center">
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">Quiz Avg</p>
            <div className={`text-xl sm:text-2xl font-bold ${stats.avgQuizScore >= 80 ? 'text-green-500' : 'text-orange-500'}`}>
              {stats.avgQuizScore}%
            </div>
          </div>
        </div>

        {/* 2. AREA CHART: STUDY ACTIVITY */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Study Momentum (7 Days)
          </h4>
          <div className="h-[160px] w-full bg-gradient-to-b from-transparent to-secondary/5 rounded-xl border border-border/50 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fill: '#6b7280'}} 
                  dy={10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 1 }} />
                <Area 
                  type="monotone" 
                  dataKey="activity" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorActivity)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. RADAR CHART: BALANCE */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col items-center bg-secondary/10 rounded-xl p-2 border border-border/50 relative">
             <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider absolute top-4 left-4">
               Skill Balance
             </h4>
             <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Mastery"
                    dataKey="A"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default AcademicChart;