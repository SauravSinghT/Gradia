import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import {
  BarChart,
  Bar,
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
} from "recharts";

const academicData = [
  { name: "Quizzes", score: 0, fill: "hsl(var(--primary))" },
  { name: "Flashcards", score: 0, fill: "hsl(var(--accent))" },
  { name: "Tasks", score: 0, fill: "hsl(var(--primary))" },
  { name: "Tests", score: 0, fill: "hsl(var(--accent))" },
  { name: "Summaries", score: 0, fill: "hsl(var(--primary))" },
];

const radarData = [
  { subject: "Quiz Score", A: 0, fullMark: 100 },
  { subject: "Task Completion", A: 0, fullMark: 100 },
  { subject: "Flashcard Mastery", A: 0, fullMark: 100 },
  { subject: "Test Performance", A: 0, fullMark: 100 },
  { subject: "Study Time", A: 0, fullMark: 100 },
];

const AcademicChart = () => {
  return (
    <Card variant="glass" className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-primary" />
          Academic Mastery Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bar Chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Progress Overview</p>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={academicData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Skill Distribution</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                />
                <Radar
                  name="Progress"
                  dataKey="A"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Complete quizzes and tasks to see your progress
        </p>
      </CardContent>
    </Card>
  );
};

export default AcademicChart;
