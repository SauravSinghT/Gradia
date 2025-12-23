import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap, Loader2, Award } from "lucide-react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie } from "recharts";

// 1. IMPORT CONFIG
import API_BASE_URL from "@/config";

// ... [Keep Interfaces exactly as they are] ...
interface QuizReport { score: number; total: number; }
interface Milestone { id: string; title: string; completed: boolean; quizReports?: QuizReport[]; }
interface Roadmap { _id: string; career: string; totalProgress: number; milestones: Milestone[]; }

const CareerChart = () => {
  const [loading, setLoading] = useState(true);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [stats, setStats] = useState({ avgScore: 0, totalModules: 0, completedModules: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    try {
      // 2. USE API_BASE_URL
      const { data } = await axios.get(`${API_BASE_URL}/roadmaps`, {
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

  // ... [Keep processChartData, CustomTooltip, and Loading/Empty states] ...
  const processChartData = (data: Roadmap[]) => {
    const bData = data.map(map => ({ name: map.career.split(' ')[0], fullName: map.career, progress: map.totalProgress, modules: map.milestones.length }));
    setBarData(bData);

    let allMilestones: any[] = [];
    let totalScore = 0, quizCount = 0, totalMods = 0, completedMods = 0;

    data.forEach(map => {
      map.milestones.forEach(m => {
        totalMods++;
        if (m.completed) completedMods++;
        if (m.quizReports && m.quizReports.length > 0) {
          const latestReport = m.quizReports[m.quizReports.length - 1];
          const percentage = Math.round((latestReport.score / latestReport.total) * 100);
          totalScore += percentage;
          quizCount++;
          allMilestones.push({ subject: m.title.substring(0, 10) + "..", fullTitle: m.title, score: percentage, fullMark: 100 });
        }
      });
    });

    setRadarData(allMilestones.slice(0, 5));
    setPieData([{ name: 'Completed', value: completedMods, color: '#10b981' }, { name: 'Pending', value: totalMods - completedMods, color: '#f59e0b' }]);
    setStats({ avgScore: quizCount === 0 ? 0 : Math.round(totalScore / quizCount), totalModules: totalMods, completedModules: completedMods });
  };

  if (loading) return <Card className="h-full flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></Card>;
  if (roadmaps.length === 0) return <Card className="h-full border-dashed min-h-[400px]"><CardContent className="flex flex-col items-center justify-center h-full text-center"><TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" /><h3 className="font-semibold text-lg">Start Your Journey</h3><p className="text-sm text-muted-foreground mb-4">Create a roadmap to unlock analytics.</p></CardContent></Card>;

  return (
    <Card className="h-full border-transparent shadow-none bg-transparent sm:border-border sm:shadow-sm sm:bg-card">
      <CardHeader className="px-0 sm:px-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2 text-xl"><TrendingUp className="w-6 h-6 text-accent" /> Career Velocity</CardTitle>
          {stats.avgScore > 0 && <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20"><Zap className="w-3 h-3 mr-1 fill-current" /> {stats.avgScore}% Perf.</Badge>}
        </div>
        <CardDescription>Real-time analysis of your learning trajectory and skill acquisition.</CardDescription>
      </CardHeader>
      <CardContent className="px-0 sm:px-6 space-y-8">
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Path Progress</h4>
          <div className="h-[180px] w-full bg-secondary/10 rounded-xl p-2 border border-border/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#06b6d4"} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col items-center bg-secondary/10 rounded-xl p-4 border border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">Skill Radar</h4>
            <div className="h-[200px] w-full">
              {radarData.length >= 3 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              ) : <div className="h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground/60"><Zap className="w-8 h-8 mb-2 opacity-30" /><p className="text-xs">Take 3+ quizzes to unlock Radar</p></div>}
            </div>
          </div>
          <div className="flex flex-col items-center bg-secondary/10 rounded-xl p-4 border border-border/50">
            <h4 className="text-sm font-semibold text-muted-foreground mb-4">Module Status</h4>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-2xl font-bold">{stats.completedModules}</span><span className="text-[10px] text-muted-foreground uppercase">Done</span></div>
            </div>
            <div className="flex gap-4 justify-center mt-[-10px]"><div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Done</div><div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-amber-500" /> Pending</div></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg text-primary"><Target className="w-4 h-4" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Modules</p><p className="font-bold text-sm">{stats.completedModules} / {stats.totalModules}</p></div></div>
          <div className="flex items-center gap-3"><div className="p-2 bg-accent/10 rounded-lg text-accent"><Award className="w-4 h-4" /></div><div><p className="text-[10px] text-muted-foreground uppercase">Accuracy</p><p className="font-bold text-sm">{stats.avgScore}%</p></div></div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CareerChart;