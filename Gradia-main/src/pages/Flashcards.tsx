import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import API_BASE_URL from "@/config";
import {
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Sparkles,
  Loader2,
  BookOpen,
  History as HistoryIcon,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MaterialUploader, { UploadedFile } from "@/components/MaterialUploader";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIGURATION ---
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// const API_BASE_URL = "/api";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface FlashcardDeck {
  id: string;
  name: string;
  cards: Flashcard[];
  isAIGenerated?: boolean;
  _id?: string;
}

interface HistoryItem {
  _id: string;
  userId: string;
  historyType: string;
  title: string;
  data: {
    cards: Array<{
      id: string;
      front: string;
      back: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

type ViewType = "generate" | "decks" | "history" | "study" | "empty-deck" | "uploader";

const Flashcards = () => {
  const [currentView, setCurrentView] = useState<ViewType>("generate");
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [historyDecks, setHistoryDecks] = useState<HistoryItem[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  const { toast } = useToast();

  // Load history on component mount
  useEffect(() => {
    fetchFlashcardHistory();
  }, []);

  // Get token from localStorage
  const getToken = () => localStorage.getItem("token");

  // Normalize card data - handles both front/back and question/answer formats
  const normalizeCard = (card: any): Flashcard => ({
    id: card.id || card._id || Date.now().toString(),
    front: card.front || card.question || "",
    back: card.back || card.answer || "",
  });

  // Fetch history from backend
  const fetchFlashcardHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = getToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in to view history.",
        });
        setIsLoadingHistory(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/history?historyType=flashcard&limit=50`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch history");

      const result = await response.json();
      setHistoryDecks(result.data || []);

      console.log("Loaded history decks:", result.data);
    } catch (error: any) {
      console.error("Fetch history error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load history.",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save flashcard deck to history
  const saveToHistory = async (deck: FlashcardDeck) => {
    try {
      const token = getToken();
      if (!token) {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Please log in to save history.",
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          historyType: "flashcard",
          title: deck.name,
          data: {
            cards: deck.cards.map((card) => ({
              id: card.id,
              front: card.front,
              back: card.back,
            })),
          },
          metadata: {
            totalCards: deck.cards.length,
            isAIGenerated: deck.isAIGenerated || false,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save history");

      toast({
        title: "Saved to History",
        description: `"${deck.name}" has been saved.`,
      });

      // Refresh history
      await fetchFlashcardHistory();
    } catch (error: any) {
      console.error("Save history error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save to history.",
      });
    }
  };

  // Delete from history
  const deleteFromHistory = async (historyId: string, title: string) => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/history/${historyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete");

      setHistoryDecks((prev) => prev.filter((item) => item._id !== historyId));
      toast({
        title: "Deleted",
        description: `"${title}" has been removed from history.`,
      });
    } catch (error: any) {
      console.error("Delete history error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete from history.",
      });
    }
  };

  // Load history deck to study
  const loadHistoryDeck = (historyItem: HistoryItem) => {
    const deck: FlashcardDeck = {
      id: historyItem._id,
      name: historyItem.title,
      cards: (historyItem.data.cards || []).map(normalizeCard),
      _id: historyItem._id,
    };
    setSelectedDeck(deck);
    setCurrentCardIndex(0);
    setCurrentView("study");
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleAnalysisComplete = async (files: UploadedFile[]) => {
    if (!API_KEY) {
      toast({
        variant: "destructive",
        title: "API Key Missing",
        description: "Please add VITE_GEMINI_API_KEY to your .env file.",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        generationConfig: { responseMimeType: "application/json" },
      });

      let combinedContent = "";
      for (const fileObj of files) {
        const text = await readFileAsText(fileObj.file);
        combinedContent += `\n--- Document: ${fileObj.name} ---\n${text.slice(0, 20000)}`;
      }

      const prompt = `
        You are an expert tutor. Create a set of high-quality flashcards based on the following study materials (Syllabus/PYQs).
        
        Materials:
        "${combinedContent}"

        Requirements:
        - Generate 10-15 flashcards.
        - "front": The Topic Name or Question (e.g., "Polymorphism").
        - "back": The detailed Definition or Answer.
        - Focus on high-yield topics.
        
        Output Format (JSON Array only):
        [
          { "front": "Topic 1", "back": "Definition 1" }
        ]
      `;

      const result = await model.generateContent(prompt);
      const generatedCards = JSON.parse(result.response.text());

      const aiDeck: FlashcardDeck = {
        id: Date.now().toString(),
        name: `AI Deck - ${files[0].name.split(".")[0]}`,
        isAIGenerated: true,
        cards: generatedCards.map((card: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          front: card.front,
          back: card.back,
        })),
      };

      setDecks((prev) => [...prev, aiDeck]);
      setSelectedDeck(aiDeck);
      setCurrentView("study");

      // Auto-save to history
      await saveToHistory(aiDeck);

      toast({
        title: "Flashcards Generated!",
        description: `Created ${aiDeck.cards.length} cards from your documents.`,
      });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Could not generate flashcards.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    const newDeck: FlashcardDeck = {
      id: Date.now().toString(),
      name: newDeckName,
      cards: [],
    };
    setDecks((prev) => [...prev, newDeck]);
    setNewDeckName("");
    setIsCreating(false);
    setSelectedDeck(newDeck);
    setCurrentView("empty-deck");
  };

  const addCard = () => {
    if (!selectedDeck || !newCardFront.trim() || !newCardBack.trim()) return;
    const newCard: Flashcard = {
      id: Date.now().toString(),
      front: newCardFront,
      back: newCardBack,
    };
    const updatedDeck = { ...selectedDeck, cards: [...selectedDeck.cards, newCard] };

    setDecks((prev) =>
      prev.map((deck) => (deck.id === selectedDeck.id ? updatedDeck : deck))
    );
    setSelectedDeck(updatedDeck);
    setNewCardFront("");
    setNewCardBack("");
    toast({ title: "Card added" });
  };

  const deleteDeck = (id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (selectedDeck?.id === id) {
      setSelectedDeck(null);
      setCurrentView("decks");
    }
    toast({ title: "Deck deleted" });
  };

  const nextCard = () => {
    if (!selectedDeck) return;
    setDirection(1);
    setCurrentCardIndex((prev) => (prev + 1) % selectedDeck.cards.length);
  };

  const prevCard = () => {
    if (!selectedDeck) return;
    setDirection(-1);
    setCurrentCardIndex((prev) =>
      prev === 0 ? selectedDeck.cards.length - 1 : prev - 1
    );
  };

  // --- ANIMATION VARIANTS ---
  const flipVariants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: (direction: number) => ({
      rotateY: direction < 0 ? 90 : -90,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: "easeIn",
      },
    }),
  };

  // --- LOADING VIEW ---
  if (isAnalyzing) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-sora font-bold mb-2">Generating Flashcards...</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Gemini is analyzing your syllabus and PYQs to find the most important questions.
          </p>
        </div>
      </div>
    );
  }

  // --- HISTORY VIEW ---
  if (currentView === "history") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <Button variant="ghost" onClick={() => setCurrentView("generate")} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">Flashcard History</span>
          </h1>
          <p className="text-muted-foreground">View and restore your previously created flashcard decks</p>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : historyDecks.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyDecks.map((item) => (
              <Card
                key={item._id}
                variant="feature"
                className="group hover:border-primary/50 transition-all flex flex-col"
              >
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFromHistory(item._id, item.title);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sora font-semibold mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {item.data.cards.length} cards
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => loadHistoryDeck(item)}
                    className="w-full mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" /> Load Deck
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="p-12 text-center">
            <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground">Your created flashcard decks will appear here</p>
          </Card>
        )}
      </motion.div>
    );
  }

  // --- DECKS VIEW ---
  if (currentView === "decks") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <Button variant="ghost" onClick={() => setCurrentView("generate")} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">My Decks</span>
          </h1>
          <p className="text-muted-foreground">Your locally created flashcard decks</p>
        </div>

        {isCreating && (
          <Card variant="glow">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Create New Deck</h3>
              <div className="flex gap-3">
                <Input
                  placeholder="Deck name..."
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                />
                <Button variant="hero" onClick={createDeck}>
                  Create
                </Button>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {decks.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card
                key={deck.id}
                variant="feature"
                className="group cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => {
                  setSelectedDeck(deck);
                  setCurrentCardIndex(0);
                  setCurrentView(deck.cards.length > 0 ? "study" : "empty-deck");
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
                      <Layers className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDeck(deck.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-sora font-semibold">{deck.name}</h3>
                    {deck.isAIGenerated && <Sparkles className="w-4 h-4 text-accent" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{deck.cards.length} cards</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="p-12 text-center">
            <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No local decks yet</h3>
            <p className="text-muted-foreground mb-6">Create a new deck to get started</p>
            <Button variant="hero" onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Deck
            </Button>
          </Card>
        )}

        {!isCreating && decks.length > 0 && (
          <Button variant="outline" onClick={() => setIsCreating(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" /> Create New Deck
          </Button>
        )}
      </motion.div>
    );
  }

  // --- STUDY MODE ---
  if (currentView === "study" && selectedDeck && selectedDeck.cards.length > 0) {
    const currentCard = selectedDeck.cards[currentCardIndex];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedDeck(null);
                setCurrentView("generate");
              }}
              className="mb-2"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-sora font-bold">
              <span className="gradient-text">{selectedDeck.name}</span>
            </h1>
            <p className="text-muted-foreground">
              Card {currentCardIndex + 1} of {selectedDeck.cards.length}
            </p>
          </div>
          {!selectedDeck._id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveToHistory(selectedDeck)}
            >
              <Download className="w-4 h-4 mr-2" /> Save to History
            </Button>
          )}
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full max-w-2xl h-96 perspective-1000">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={currentCardIndex}
                custom={direction}
                // variants={flipVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card variant="feature" className="w-full h-full border-primary/20 shadow-xl overflow-y-auto">
                  <CardContent className="flex flex-col h-full p-8 text-center">
                    <div className="mb-6 pb-6 border-b border-border/50">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full mb-3">
                        TOPIC
                      </span>
                      <h2 className="text-2xl font-sora font-bold leading-tight">
                        {currentCard.front || "No topic"}
                      </h2>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full mb-3 mx-auto">
                        DEFINITION
                      </span>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {currentCard.back || "No definition"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={prevCard}
              className="rounded-full w-12 h-12 p-0 hover:border-primary hover:text-primary transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="text-sm font-medium text-muted-foreground">
              {currentCardIndex + 1} / {selectedDeck.cards.length}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={nextCard}
              className="rounded-full w-12 h-12 p-0 hover:border-primary hover:text-primary transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- EMPTY DECK ---
  if (currentView === "empty-deck" && selectedDeck) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedDeck(null);
              setCurrentView("decks");
            }}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Decks
          </Button>
          <h1 className="text-3xl font-sora font-bold">
            <span className="gradient-text">{selectedDeck.name}</span>
          </h1>
        </div>
        <Card variant="glass" className="p-12 text-center">
          <Layers className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cards in this deck</h3>
          <p className="text-muted-foreground mb-6">Add your first flashcard below</p>
        </Card>
        <Card variant="feature">
          <CardHeader>
            <CardTitle className="text-lg">Add Your First Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Topic / Question"
              value={newCardFront}
              onChange={(e) => setNewCardFront(e.target.value)}
            />
            <Textarea
              placeholder="Definition / Answer"
              value={newCardBack}
              onChange={(e) => setNewCardBack(e.target.value)}
            />
            <Button variant="hero" onClick={addCard}>
              <Plus className="w-4 h-4 mr-2" /> Add Card
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // --- UPLOADER VIEW ---
  if (currentView === "uploader") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div>
          <Button variant="ghost" onClick={() => setCurrentView("generate")} className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">Generate Flashcards</span>
          </h1>
          <p className="text-muted-foreground">Upload your study materials to auto-generate flashcards</p>
        </div>
        <div className="max-w-xl">
          <MaterialUploader
            onAnalysisComplete={handleAnalysisComplete}
            featureName="Flashcards"
            description="Upload syllabus or notes (.txt, .md, .json) to automatically generate flashcards"
            allowedTypes={["syllabus", "pyq"]}
          />
        </div>
      </motion.div>
    );
  }

  // --- MAIN/GENERATE VIEW (Initial View) ---
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sora font-bold mb-2">
            <span className="gradient-text">Flashcards</span>
          </h1>
          <p className="text-muted-foreground">Create and study flashcards for effective memorization</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentView("history");
              fetchFlashcardHistory();
            }}
          >
            <HistoryIcon className="w-4 h-4 mr-2" /> History
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentView("decks")}
          >
            <Layers className="w-4 h-4 mr-2" /> My Decks
          </Button>
          <Button variant="hero" onClick={() => setCurrentView("uploader")}>
            <Sparkles className="w-4 h-4 mr-2" /> AI Generate
          </Button>
        </div>
      </div>

      {/* Generate Flashcards Content */}
      <Card variant="feature" className="p-12">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-cyan-soft flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-sora font-bold mb-2">Generate Flashcards with AI</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload your syllabus, notes, or previous year questions. Our AI will automatically create high-quality flashcards from your study materials.
            </p>
          </div>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => setCurrentView("uploader")}
          >
            <Sparkles className="w-5 h-5 mr-2" /> Start Generating
          </Button>
        </div>
      </Card>

      {/* Or Create Manually */}
      <Card variant="glass" className="p-12">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-yellow-soft flex items-center justify-center">
              <Plus className="w-10 h-10 text-accent-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-sora font-bold mb-2">Create Manually</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create your own custom flashcard decks with your own questions and answers. Perfect for personalized study sessions.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => {
              setCurrentView("decks");
              setIsCreating(true);
            }}
          >
            <Plus className="w-5 h-5 mr-2" /> Create Deck
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export default Flashcards;