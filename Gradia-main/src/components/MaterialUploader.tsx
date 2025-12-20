import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  BookOpen,
  ClipboardList,
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface UploadedFile {
  id: string;
  name: string;
  type: "syllabus" | "notes" | "pyq";
  size: number;
  file: File;
}

interface MaterialUploaderProps {
  onAnalysisComplete: (files: UploadedFile[]) => void;
  featureName: string;
  description: string;
  allowedTypes?: ("syllabus" | "notes" | "pyq")[];
}

const allMaterialTypes = [
  { id: "syllabus", label: "Subject Syllabus", icon: BookOpen },
  { id: "notes", label: "Chapter Notes / Textbooks", icon: FileText },
  { id: "pyq", label: "Previous Year Questions", icon: ClipboardList },
] as const;

const MaterialUploader = ({ onAnalysisComplete, featureName, description, allowedTypes }: MaterialUploaderProps) => {
  const materialTypes = allowedTypes 
    ? allMaterialTypes.filter(t => allowedTypes.includes(t.id as "syllabus" | "notes" | "pyq"))
    : allMaterialTypes;
  
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedTypes.length === 0) {
      toast({
        title: "Select material type first",
        description: "Please select at least one material type before uploading.",
        variant: "destructive",
      });
      return;
    }

    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: selectedTypes[0] as "syllabus" | "notes" | "pyq",
      size: file.size,
      file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((t) => t !== typeId)
        : [...prev, typeId]
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const startAnalysis = async () => {
    if (files.length === 0) {
      toast({
        title: "No files uploaded",
        description: "Please upload at least one file to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const stages = [
      "Reading documents...",
      "Extracting key concepts...",
      "Cross-referencing materials...",
      "Identifying patterns...",
      `Generating ${featureName.toLowerCase()}...`,
      "Finalizing results...",
    ];

    for (let i = 0; i < stages.length; i++) {
      setAnalysisStage(stages[i]);
      setAnalysisProgress(((i + 1) / stages.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));
    }

    setIsAnalyzing(false);
    toast({
      title: "Analysis Complete!",
      description: `Your ${featureName.toLowerCase()} have been generated successfully.`,
    });
    onAnalysisComplete(files);
  };

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-sora font-semibold mb-2">Upload Study Materials</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        {/* Material Type Selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Select material type(s):</p>
          <div className="grid gap-3">
            {materialTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTypes.includes(type.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => toggleType(type.id)}
                />
                <type.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            selectedTypes.length > 0
              ? "border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10"
              : "border-border opacity-50"
          }`}
          onClick={() => selectedTypes.length > 0 && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
            className="hidden"
            disabled={selectedTypes.length === 0}
          />
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">
            {selectedTypes.length > 0
              ? "Click to upload or drag and drop"
              : "Select material type first"}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT, PPT (Max 20MB each)
          </p>
        </div>

        {/* Uploaded Files */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <p className="text-sm font-medium">Uploaded files ({files.length}):</p>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)} • {materialTypes.find((t) => t.id === file.type)?.label}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Progress */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-muted-foreground">{analysisStage}</span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Start Analysis Button */}
        <Button
          variant="hero"
          className="w-full"
          onClick={startAnalysis}
          disabled={files.length === 0 || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start AI Analysis
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MaterialUploader;
