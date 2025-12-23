import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import API_BASE_URL from "@/config";
import {
  FolderOpen,
  Plus,
  Search,
  FileText,
  MoreVertical,
  Trash2,
  ChevronLeft,
  Sparkles,
  Loader2,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Download,
  Database,
  Clock,
  RefreshCw,
  Library,
  ArrowRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import MaterialUploader, { UploadedFile } from "@/components/MaterialUploader";

// ========================================
// CONFIGURATION
// ========================================
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ========================================
// TYPES & INTERFACES
// ========================================

// 1. Topic Structure
interface Topic {
  name: string;
  explanation: string;
  details?: string;
}

// 2. Analysis Result
export interface AnalysisResult {
  chapter?: string;
  overview: string;
  topics: Topic[];
  keyPoints: string[];
  expectedQuestions: string[];
}

// 3. Database Item Interfaces
interface StudySetFile {
  _id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  analysisData: AnalysisResult;
}

interface StudySet {
  _id: string;
  title: string;
  description?: string;
  files: StudySetFile[];
  createdAt: string;
  updatedAt: string;
}

type ViewMode = "list" | "details" | "uploader" | "analyzing";

// ========================================
// HELPER FUNCTIONS
// ========================================

const getAuthToken = () => localStorage.getItem("token");

async function fileToGenerativePart(file: File) {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>(
    (resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    }
  );
}

// Prompt matches Backend Schema
const analyzeDocument = async (file: File): Promise<AnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const filePart = await fileToGenerativePart(file);

    const prompt = `
      Analyze this study document. Return a JSON object matching this schema exactly:
      {
        "chapter": "Chapter Title (optional)",
        "overview": "A brief explanation (2-3 sentences)",
        "topics": [
          { "name": "Topic Name", "explanation": "Brief explanation", "details": "Extra details" }
        ],
        "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
        "expectedQuestions": ["Question 1?", "Question 2?", "Question 3?"]
      }
    `;

    const result = await model.generateContent([prompt, filePart]);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// ========================================
// MAIN COMPONENT
// ========================================
const StudySets = () => {
  // ===== MAIN STATES =====
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [newSetName, setNewSetName] = useState("");
  
  // Selection
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ===== ANALYSIS STATES =====
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Viewer State
  const [viewingAnalysis, setViewingAnalysis] = useState<{name: string, analysis: AnalysisResult} | null>(null);

  const { toast } = useToast();

  // Helper to get currently selected object from ID
  const selectedSet = studySets.find(s => s._id === selectedSetId) || null;

  // ========================================
  // BACKEND API INTEGRATION
  // ========================================

  // 1. Fetch Sets
  const fetchStudySets = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/studysets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setStudySets(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sets:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not load study sets.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load on mount
  useEffect(() => {
    fetchStudySets();
  }, [fetchStudySets]);

  // 2. Create Set (Direct to DB)
  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await axios.post(
        `${API_URL}/studysets`,
        { title: newSetName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Add to local state and switch view
        const newSet = response.data.data;
        setStudySets(prev => [newSet, ...prev]);
        setNewSetName("");
        setSelectedSetId(newSet._id);
        setViewMode("uploader");
        toast({ title: "Study set created", description: `"${newSet.title}" is ready.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create study set." });
    }
  };

  // 3. Delete Set
  const handleDeleteSet = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await axios.delete(`${API_URL}/studysets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudySets((prev) => prev.filter((set) => set._id !== id));
      if (selectedSetId === id) {
        setSelectedSetId(null);
        setViewMode("list");
      }
      toast({ title: "Deleted", description: "Study set removed." });
    } catch (error) {
      console.error("Delete error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete item." });
    }
  };

  // 4. Delete File from Set
  const handleDeleteFile = async (fileId: string) => {
    if (!selectedSetId) return;
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await axios.delete(`${API_URL}/studysets/${selectedSetId}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if(response.data.success) {
        // Update local state
        setStudySets(prev => prev.map(s => s._id === selectedSetId ? response.data.data : s));
        toast({ title: "Deleted", description: "File removed from set." });
      }
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Failed to remove file." });
    }
  };

  // ========================================
  // ANALYSIS LOGIC
  // ========================================
  const handleAnalysisComplete = async (files: UploadedFile[]) => {
    if (!selectedSetId) return;
    const token = getAuthToken();
    if (!token) return;

    setViewMode("analyzing");
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);

    const totalFiles = files.length;
    let successCount = 0;

    try {
      for (let index = 0; index < files.length; index++) {
        const f = files[index];
        let rawFile: File | null = null;

        if (f instanceof File) rawFile = f;
        else if ("file" in f && (f as any).file instanceof File) rawFile = (f as any).file;
        else if ("originFileObj" in f) rawFile = (f as any).originFileObj;

        if (rawFile) {
          try {
            // 1. Analyze
            const analysisData = await analyzeDocument(rawFile);
            
            // 2. Add to Set in Backend
            await axios.post(
                `${API_URL}/studysets/${selectedSetId}/files`,
                {
                  fileName: f.name,
                  fileType: f.type,
                  analysisData: analysisData
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            successCount++;
          } catch (err) {
            console.error(`Analysis failed for ${f.name}:`, err);
          }
        }
        setAnalysisProgress(Math.round(((index + 1) / totalFiles) * 100));
      }

      // Refresh Data to get updated files
      await fetchStudySets();

      setTimeout(() => {
        setViewMode("details");
        setIsAnalyzing(false);
        toast({ title: "Completed", description: `Added ${successCount} files to set.` });
      }, 1500);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unknown error");
      setIsAnalyzing(false);
    }
  };

  // ========================================
  // PDF GENERATION
  // ========================================
  const generateAnalysisPDF = async (data: { name: string; analysis: AnalysisResult } | null) => {
    if (!data?.analysis) return;
    const { name, analysis } = data;

    try {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "210mm";
      container.style.padding = "20px";
      container.style.backgroundColor = "white";
      container.style.color = "#000";

      const analysisHTML = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1 style="color: #2563eb;">${name}</h1>
          <hr/>
          <h3 style="color: #1e40af;">Overview</h3>
          <p>${analysis.overview}</p>
          
          <h3 style="color: #1e40af;">Important Topics</h3>
          ${analysis.topics.map(t => `
            <div style="margin-bottom: 10px;">
              <strong>${t.name}</strong>: ${t.explanation}
            </div>
          `).join('')}

          <h3 style="color: #1e40af;">Key Points</h3>
          <ul>${analysis.keyPoints.map(n => `<li>${n}</li>`).join('')}</ul>

          <h3 style="color: #1e40af;">Questions</h3>
          <ul>${analysis.expectedQuestions.map(q => `<li>${q}</li>`).join('')}</ul>
        </div>
      `;

      container.innerHTML = analysisHTML;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2 });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgHeight = (canvas.height * 210) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL("image/png");

      while (heightLeft >= 0) {
        pdf.addImage(imgData, "PNG", 0, position, 210, imgHeight);
        heightLeft -= 297;
        if (heightLeft > 0) {
          pdf.addPage();
          position = heightLeft - imgHeight;
        }
      }

      pdf.save(`${name}_analysis.pdf`);
      document.body.removeChild(container);
      toast({ title: "PDF Downloaded" });
    } catch (error) {
      toast({ variant: "destructive", title: "Download Failed" });
    }
  };

  // Filter Logic
  const filteredSets = studySets.filter((set) =>
    set.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ========================================
  // RENDER DIALOG (Same Design)
  // ========================================
  const renderAnalysisDialog = () => (
    <Dialog
      open={!!viewingAnalysis}
      onOpenChange={(open) => !open && setViewingAnalysis(null)}
    >
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between pr-6">
          <DialogHeader className="flex-1">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-primary" />
              {viewingAnalysis?.name}
            </DialogTitle>
          </DialogHeader>
          <Button
            onClick={() => generateAnalysisPDF(viewingAnalysis)}
            className="bg-primary hover:bg-primary/90 whitespace-nowrap ml-4"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
        </div>

        {viewingAnalysis?.analysis ? (
          <div className="flex-1 overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-6 py-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                  <BookOpen className="w-4 h-4" /> Overview
                </h4>
                <p className="text-sm leading-relaxed text-foreground/80">{viewingAnalysis.analysis.overview}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Important Topics</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      {viewingAnalysis.analysis.topics.map((topic, i) => (
                        <div key={i} className="bg-secondary/20 p-2 rounded text-sm">
                          <span className="font-semibold">{topic.name}: </span>
                          <span className="text-muted-foreground">{topic.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base">Key Points</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm space-y-1 text-foreground/70">
                      {viewingAnalysis.analysis.keyPoints.map((note, i) => <li key={i}>{note}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4 text-orange-500" /> Expected Questions</h4>
                <div className="grid gap-3">
                  {viewingAnalysis.analysis.expectedQuestions.map((q, i) => (
                    <div key={i} className="p-3 bg-secondary/30 border rounded-md text-sm">
                      <span className="font-mono text-primary font-bold mr-2">Q{i + 1}.</span> {q}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-3 text-yellow-500" />
            <p>Analysis Data Unavailable</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // ========================================
  // VIEW: ANALYZING
  // ========================================
  if (viewMode === "analyzing") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[60vh] flex flex-col items-center justify-center space-y-8">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="w-8 h-8 text-primary animate-pulse" /></div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Analyzing...</h2>
          <p className="text-muted-foreground">Gemini is processing your document and saving to database.</p>
        </div>
        <div className="w-full max-w-md space-y-2">
          <Progress value={analysisProgress} className="h-2" />
          <div className="flex justify-end text-xs text-muted-foreground">{analysisProgress}%</div>
        </div>
        {analysisError && <div className="text-destructive bg-destructive/10 p-3 rounded">{analysisError}</div>}
      </motion.div>
    );
  }

  // ========================================
  // VIEW: UPLOADER
  // ========================================
  if (viewMode === "uploader" && selectedSet) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => setViewMode("details")} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to {selectedSet.title}
          </Button>
          <h1 className="text-3xl font-bold text-primary">Add Materials</h1>
          <p className="text-muted-foreground">Upload to "{selectedSet.title}" for AI analysis</p>
        </div>
        <div className="max-w-2xl">
          <MaterialUploader onAnalysisComplete={handleAnalysisComplete} featureName="Study Set" description="Upload PDFs. AI will analyze and auto-save." />
        </div>
      </motion.div>
    );
  }

  // ========================================
  // VIEW: DETAILS (Inside a Set)
  // ========================================
  if (viewMode === "details" && selectedSet) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
        {renderAnalysisDialog()}
        <div className="flex justify-between items-center">
          <div>
            <Button variant="ghost" onClick={() => setViewMode("list")} className="mb-2"><ChevronLeft className="w-4 h-4 mr-2" /> Back</Button>
            <h1 className="text-3xl font-bold text-primary">{selectedSet.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
               <Clock className="w-3 h-3"/> Created: {new Date(selectedSet.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={() => setViewMode("uploader")}><Plus className="w-4 h-4 mr-2" /> Add Files</Button>
        </div>

        {selectedSet.files.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedSet.files.map((file) => (
              <Card key={file._id} className="group cursor-pointer hover:border-primary/50 transition-all" onClick={() => file.analysisData && setViewingAnalysis({ name: file.fileName, analysis: file.analysisData })}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileText className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{file.fileName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] text-green-600">Saved</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteFile(file._id); }}>
                        <Trash2 className="w-4 h-4 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border-dashed border-2 rounded-lg text-muted-foreground">
             <FolderOpen className="w-12 h-12 mx-auto mb-4 text-primary/20" />
             <p>No files in this session yet.</p>
          </div>
        )}
      </motion.div>
    );
  }

  // ========================================
  // VIEW: MAIN LIST
  // ========================================
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {renderAnalysisDialog()}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Study Sets</h1>
        <p className="text-muted-foreground">Manage your collections and saved analyses</p>
      </div>

      {/* 🟢 NEW SECTION: PROMINENT CREATE AREA */}
      <Card className="mb-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 -mr-10 -mt-10 bg-primary/5 rounded-full blur-3xl w-64 h-64 pointer-events-none"></div>
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
           <div className="flex-1 space-y-3 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 mx-auto md:mx-0">
                <Library className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Create a New Study Set</h2>
              <p className="text-muted-foreground text-base max-w-lg leading-relaxed">
                Start a new collection for your subjects. Upload PDFs and lecture notes to get AI-powered summaries and quizzes automatically organized.
              </p>
           </div>
           
           <div className="w-full md:w-[420px] bg-background/50 p-1 rounded-xl shadow-sm border border-border/50 backdrop-blur-sm">
             <div className="flex flex-col gap-3 p-4">
               <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground ml-1">Study Set Name</label>
                  <Input 
                    placeholder="e.g., Data Structures - Unit 1" 
                    value={newSetName} 
                    onChange={(e) => setNewSetName(e.target.value)} 
                    className="h-11 bg-background border-primary/20 focus-visible:ring-primary/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSet()}
                  />
               </div>
               <Button onClick={handleCreateSet} className="h-11 w-full text-base shadow-sm hover:shadow-md transition-all group" size="lg">
                 Create & Start Uploading <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
               </Button>
             </div>
           </div>
        </CardContent>
      </Card>

      {/* 🟠 BOTTOM SECTION: STUDY SETS GRID */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 pb-2 border-b">
           <div>
             <h2 className="text-xl font-semibold flex items-center gap-2">
               <Database className="w-5 h-5 text-primary" /> Your Collections
             </h2>
             <p className="text-xs text-muted-foreground mt-1">Access your saved documents and AI summaries</p>
           </div>
           
           <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search sets..." 
                   value={searchQuery} 
                   onChange={(e) => setSearchQuery(e.target.value)} 
                   className="pl-9 h-9 bg-background" 
                 />
              </div>
              <Button variant="outline" size="sm" onClick={fetchStudySets} disabled={isLoading} className="h-9 w-9 p-0" title="Refresh List">
                 <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
           </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>
        ) : filteredSets.length === 0 ? (
          <div className="p-12 text-center bg-secondary/5 rounded-xl border border-dashed border-border/60">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No study sets found.</p>
            <p className="text-xs text-muted-foreground mt-1">Create one above to get started.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSets.map((set) => (
              <motion.div key={set._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card 
                  className="group cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-300 bg-card/50 overflow-hidden"
                  onClick={() => { setSelectedSetId(set._id); setViewMode("details"); }}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteSet(set._id); }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <h3 className="font-bold text-lg mb-1 truncate text-foreground" title={set.title}>{set.title}</h3>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(set.createdAt).toLocaleDateString()}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                      <Badge variant="secondary" className="text-[10px] bg-secondary/50 font-normal">{set.files.length} Documents</Badge>
                      <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50/50">Saved</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudySets;