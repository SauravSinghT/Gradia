import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Loader2, 
  Award,
} from "lucide-react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie
} from "recharts";

// --- TYPES ---
interface QuizReport {
  score: number;
  total: number;
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

const CareerChart = () => {
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  // Chart Data States
  const [barData, setBarData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    avgScore: 0,
    totalModules: 0,
    completedModules: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get("http://localhost:5000/api/roadmaps", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setRoadmaps(data);
      processChartData(data);
    } catch (error) {
      console.error("Failed to fetch career data", error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data: Roadmap[]) => {
    // 1. Bar Data: Compare Roadmap Progress
    const bData = data.map(map => ({
      name: map.career.split(' ')[0], // Short name
      fullName: map.career,
      progress: map.totalProgress,
      modules: map.milestones.length
    }));
    setBarData(bData);

    // 2. Radar Data: Quiz Performance by Module (Top 6 recent)
    let allMilestones: any[] = [];
    let totalScore = 0;
    let quizCount = 0;
    let totalMods = 0;
    let completedMods = 0;

    data.forEach(map => {
      map.milestones.forEach(m => {
        totalMods++;
        if (m.completed) completedMods++;

        if (m.quizReports && m.quizReports.length > 0) {
          const latestReport = m.quizReports[m.quizReports.length - 1];
          const percentage = Math.round((latestReport.score / latestReport.total) * 100);
          
          totalScore += percentage;
          quizCount++;

          allMilestones.push({
            subject: m.title.substring(0, 10) + "..", // Truncate for radar label
            fullTitle: m.title,
            score: percentage,
            fullMark: 100
          });
        }
      });
    });

    // Take top 5 most recent/relevant modules for the Radar chart to keep it clean
    setRadarData(allMilestones.slice(0, 5));

    // 3. Pie Data: Completion Status
    setPieData([
      { name: 'Completed', value: completedMods, color: '#10b981' }, // emerald-500
      { name: 'Pending', value: totalMods - completedMods, color: '#f59e0b' } // amber-500
    ]);

    setStats({
      avgScore: quizCount === 0 ? 0 : Math.round(totalScore / quizCount),
      totalModules: totalMods,
      completedModules: completedMods
    });
  };

  // Custom Tooltip for Bar Chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-xs">
          <p className="font-semibold mb-1">{payload[0].payload.fullName}</p>
          <p className="text-muted-foreground">Progress: <span className="font-bold text-primary">{payload[0].value}%</span></p>
          <p className="text-muted-foreground">Modules: {payload[0].payload.modules}</p>
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

  if (roadmaps.length === 0) {
    return (
      <Card className="h-full border-dashed min-h-[400px]">
        <CardContent className="flex flex-col items-center justify-center h-full text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">Start Your Journey</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a roadmap to unlock analytics.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-transparent shadow-none bg-transparent sm:border-border sm:shadow-sm sm:bg-card">
      <CardHeader className="px-0 sm:px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="w-6 h-6 text-accent" />
            Career Velocity
          </CardTitle>
          {stats.avgScore > 0 && (
            <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20">
              <Zap className="w-3 h-3 mr-1 fill-current" />
              {stats.avgScore}% Perf.
            </Badge>
          )}
        </div>
        <CardDescription>
          Real-time analysis of your learning trajectory and skill acquisition.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 sm:px-6 space-y-8">
        
        {/* 1. PROGRESS BAR CHART (Top Section) */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Path Progress</h4>
          <div className="h-[180px] w-full bg-secondary/10 rounded-xl p-2 border border-border/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#06b6d4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. SPLIT VIEW: RADAR & PIE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Radar Chart */}
          <div className="flex flex-col items-center bg-secondary/10 rounded-xl p-4 border border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">Skill Radar</h4>
            {radarData.length >= 3 ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.4}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground/60">
                <Zap className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">Take 3+ quizzes to unlock Radar</p>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="flex flex-col items-center bg-secondary/10 rounded-xl p-4 border border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">Module Status</h4>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold">{stats.completedModules}</span>
                <span className="text-[10px] text-muted-foreground uppercase">Done</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex gap-4 justify-center mt-[-10px]">
              <div className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Done
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> Pending
              </div>
            </div>
          </div>

        </div>

        {/* Footer KPI Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Modules</p>
              <p className="font-bold text-sm">{stats.completedModules} / {stats.totalModules}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg text-accent">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Accuracy</p>
              <p className="font-bold text-sm">{stats.avgScore}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerChart;