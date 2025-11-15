"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Heart, Target, Bell, Sparkles, TrendingUp, DollarSign, Users, Dumbbell, CheckCircle2, Plus, X, Star, Check, BookOpen, Utensils, Footprints, Calendar, Award, Flame, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// Tipos
type HabitCategory = "financeiro" | "social" | "exercicio" | "alimentacao" | "caminhada";

interface DailyHabit {
  id: string;
  category: HabitCategory;
  title: string;
  completed: boolean;
  date: string;
}

interface WeeklyProgress {
  financeiro: number;
  social: number;
  exercicio: number;
  alimentacao: number;
  caminhada: number;
}

interface Goal {
  id: string;
  title: string;
  category: HabitCategory;
  progress: number;
  target: number;
  unit: string;
}

interface DiaryEntry {
  id: string;
  date: string;
  mood: string;
  content: string;
}

// Mensagens motivacionais realistas
const motivationalMessages = [
  "Pequenos passos todos os dias levam a grandes mudanças.",
  "Você não precisa ser perfeito, só precisa começar.",
  "Cada dia é uma nova chance de melhorar 1%.",
  "Progresso, não perfeição. Continue avançando.",
  "Sua saúde financeira começa com pequenas decisões diárias.",
  "Conexões reais importam mais do que você imagina.",
  "Movimento é vida. Seu corpo agradece cada esforço.",
  "Alimentar-se bem é um ato de amor próprio.",
  "Uma caminhada pode mudar completamente seu dia.",
  "Consistência supera intensidade. Continue firme.",
];

// Hábitos diários por categoria
const dailyHabitsTemplate = {
  financeiro: [
    { title: "Registrar gastos do dia", icon: "💰" },
    { title: "Revisar orçamento mensal", icon: "📊" },
    { title: "Poupar pelo menos R$ 10", icon: "🏦" },
    { title: "Evitar compras por impulso", icon: "🛑" },
  ],
  social: [
    { title: "Conversar com um amigo", icon: "💬" },
    { title: "Fazer um elogio genuíno", icon: "🌟" },
    { title: "Participar de atividade em grupo", icon: "👥" },
    { title: "Ligar para alguém querido", icon: "📞" },
  ],
  exercicio: [
    { title: "30 min de atividade física", icon: "🏃" },
    { title: "Alongamento matinal", icon: "🧘" },
    { title: "Subir escadas em vez de elevador", icon: "🪜" },
    { title: "Treino de força", icon: "💪" },
  ],
  alimentacao: [
    { title: "Tomar 2L de água", icon: "💧" },
    { title: "Comer 3 porções de frutas", icon: "🍎" },
    { title: "Incluir vegetais no almoço", icon: "🥗" },
    { title: "Evitar açúcar refinado", icon: "🚫" },
  ],
  caminhada: [
    { title: "Caminhar 10.000 passos", icon: "👟" },
    { title: "Caminhar 20 minutos", icon: "⏱️" },
    { title: "Caminhar ao ar livre", icon: "🌳" },
    { title: "Caminhar após refeições", icon: "🚶" },
  ],
};

const categoryConfig = {
  financeiro: { 
    label: "Financeiro", 
    icon: DollarSign, 
    color: "from-emerald-400 via-green-500 to-teal-500",
    description: "Controle suas finanças e construa seu futuro"
  },
  social: { 
    label: "Social", 
    icon: Users, 
    color: "from-blue-500 via-indigo-500 to-purple-600",
    description: "Cultive relacionamentos significativos"
  },
  exercicio: { 
    label: "Exercício", 
    icon: Dumbbell, 
    color: "from-orange-400 via-red-500 to-pink-500",
    description: "Fortaleça seu corpo e mente"
  },
  alimentacao: { 
    label: "Alimentação", 
    icon: Utensils, 
    color: "from-lime-400 via-green-500 to-emerald-600",
    description: "Nutra seu corpo com qualidade"
  },
  caminhada: { 
    label: "Caminhada", 
    icon: Footprints, 
    color: "from-cyan-400 via-blue-500 to-indigo-600",
    description: "Movimente-se e explore o mundo"
  },
};

const moodEmojis = [
  { emoji: "😊", label: "Feliz" },
  { emoji: "😌", label: "Calmo" },
  { emoji: "😔", label: "Triste" },
  { emoji: "😰", label: "Ansioso" },
  { emoji: "😡", label: "Irritado" },
  { emoji: "🤗", label: "Grato" },
  { emoji: "💪", label: "Motivado" },
  { emoji: "😴", label: "Cansado" },
];

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("habitos");
  const [dailyHabits, setDailyHabits] = useState<DailyHabit[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress>({
    financeiro: 0,
    social: 0,
    exercicio: 0,
    alimentacao: 0,
    caminhada: 0,
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showDiaryDialog, setShowDiaryDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ 
    title: "", 
    category: "financeiro" as HabitCategory, 
    target: 0, 
    unit: "" 
  });
  const [newDiaryEntry, setNewDiaryEntry] = useState({ mood: "😊", content: "" });
  const [mounted, setMounted] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticação
  useEffect(() => {
    setMounted(true);
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push("/login");
          return;
        }
        
        setUser(session.user);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        router.push("/login");
      }
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Carregar dados do localStorage
  useEffect(() => {
    if (!mounted || !user) return;

    try {
      const savedHabits = localStorage.getItem("dailyHabits");
      const savedProgress = localStorage.getItem("weeklyProgress");
      const savedGoals = localStorage.getItem("goals");
      const savedDiary = localStorage.getItem("diaryEntries");
      const savedStreak = localStorage.getItem("currentStreak");

      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        if (Array.isArray(parsed)) {
          setDailyHabits(parsed);
        }
      } else {
        initializeDailyHabits();
      }

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        if (parsed && typeof parsed === 'object') {
          setWeeklyProgress(parsed);
        }
      }

      if (savedGoals) {
        const parsed = JSON.parse(savedGoals);
        if (Array.isArray(parsed)) {
          setGoals(parsed);
        }
      }

      if (savedDiary) {
        const parsed = JSON.parse(savedDiary);
        if (Array.isArray(parsed)) {
          setDiaryEntries(parsed);
        }
      }

      if (savedStreak) {
        setCurrentStreak(parseInt(savedStreak) || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, [mounted, user]);

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      router.push("/login");
    } catch (error: any) {
      toast.error("Erro ao fazer logout");
    }
  };

  // Inicializar hábitos diários
  const initializeDailyHabits = () => {
    const today = new Date().toISOString().split('T')[0];
    const habits: DailyHabit[] = [];

    Object.entries(dailyHabitsTemplate).forEach(([category, items]) => {
      items.forEach((item, index) => {
        habits.push({
          id: `${category}-${index}-${today}`,
          category: category as HabitCategory,
          title: item.title,
          completed: false,
          date: today,
        });
      });
    });

    setDailyHabits(habits);
    if (mounted) {
      localStorage.setItem("dailyHabits", JSON.stringify(habits));
    }
  };

  // Toggle hábito
  const toggleHabit = (habitId: string) => {
    const updatedHabits = dailyHabits.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, completed: !habit.completed };
      }
      return habit;
    });

    setDailyHabits(updatedHabits);

    // Atualizar progresso semanal
    const progress: WeeklyProgress = {
      financeiro: 0,
      social: 0,
      exercicio: 0,
      alimentacao: 0,
      caminhada: 0,
    };

    Object.keys(progress).forEach(category => {
      const categoryHabits = updatedHabits.filter(h => h.category === category);
      const completed = categoryHabits.filter(h => h.completed).length;
      const total = categoryHabits.length;
      progress[category as HabitCategory] = total > 0 ? Math.round((completed / total) * 100) : 0;
    });

    setWeeklyProgress(progress);

    if (mounted) {
      localStorage.setItem("dailyHabits", JSON.stringify(updatedHabits));
      localStorage.setItem("weeklyProgress", JSON.stringify(progress));
    }

    const habit = updatedHabits.find(h => h.id === habitId);
    if (habit?.completed) {
      toast.success("Hábito concluído! Continue assim! 🎉");
    }
  };

  // Adicionar meta
  const addGoal = () => {
    if (!newGoal.title.trim() || newGoal.target <= 0) {
      toast.error("Preencha todos os campos corretamente!");
      return;
    }

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title.trim(),
      category: newGoal.category,
      progress: 0,
      target: newGoal.target,
      unit: newGoal.unit.trim(),
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);

    if (mounted) {
      localStorage.setItem("goals", JSON.stringify(updatedGoals));
    }

    setShowGoalDialog(false);
    setNewGoal({ title: "", category: "financeiro", target: 0, unit: "" });
    toast.success("Meta criada com sucesso!");
  };

  // Atualizar progresso da meta
  const updateGoalProgress = (goalId: string, newProgress: number) => {
    const updatedGoals = goals.map(goal => {
      if (goal.id === goalId) {
        return { ...goal, progress: Math.min(newProgress, goal.target) };
      }
      return goal;
    });

    setGoals(updatedGoals);

    if (mounted) {
      localStorage.setItem("goals", JSON.stringify(updatedGoals));
    }

    const goal = updatedGoals.find(g => g.id === goalId);
    if (goal && goal.progress >= goal.target) {
      toast.success("🎉 Parabéns! Meta alcançada!");
    }
  };

  // Deletar meta
  const deleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);

    if (mounted) {
      localStorage.setItem("goals", JSON.stringify(updatedGoals));
      toast.success("Meta removida!");
    }
  };

  // Adicionar entrada no diário
  const addDiaryEntry = () => {
    if (!newDiaryEntry.content.trim()) {
      toast.error("Escreva algo no seu diário!");
      return;
    }

    const entry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      date: new Date().toISOString(),
      mood: newDiaryEntry.mood,
      content: newDiaryEntry.content.trim(),
    };

    const updatedEntries = [entry, ...diaryEntries];
    setDiaryEntries(updatedEntries);

    if (mounted) {
      localStorage.setItem("diaryEntries", JSON.stringify(updatedEntries));
    }

    setShowDiaryDialog(false);
    setNewDiaryEntry({ mood: "😊", content: "" });
    toast.success("Entrada salva no diário!");
  };

  // Deletar entrada do diário
  const deleteDiaryEntry = (entryId: string) => {
    const updatedEntries = diaryEntries.filter(entry => entry.id !== entryId);
    setDiaryEntries(updatedEntries);

    if (mounted) {
      localStorage.setItem("diaryEntries", JSON.stringify(updatedEntries));
      toast.success("Entrada removida!");
    }
  };

  // Calcular progresso geral
  const overallProgress = Object.values(weeklyProgress).reduce((a, b) => a + b, 0) / 5;

  // Renderizar loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 p-2 sm:p-3 rounded-2xl shadow-2xl shadow-emerald-500/50">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-2xl">
                  Vida Plena
                </h1>
                <p className="text-xs sm:text-sm text-white/90 font-medium drop-shadow-lg">
                  Construa hábitos que transformam
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-white/60">Olá, {user?.user_metadata?.name || user?.email?.split('@')[0]}</p>
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-lg font-bold text-white">{currentStreak} dias</span>
                </div>
              </div>
              <Button
                onClick={() => {
                  const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
                  toast.success(message, { duration: 5000 });
                }}
                className="bg-white/10 hover:bg-white/20 text-white shadow-xl backdrop-blur-xl border border-white/20 hover:scale-105 transition-all duration-300"
              >
                <Bell className="w-4 h-4 mr-2" />
                Motivação
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Progresso Geral */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl mb-6">
          <CardHeader>
            <CardTitle className="text-xl text-white font-bold">Progresso Geral de Hoje</CardTitle>
            <CardDescription className="text-white/70">
              {overallProgress.toFixed(0)}% dos hábitos concluídos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 gap-2 backdrop-blur-xl bg-white/5 p-2 rounded-2xl shadow-2xl border border-white/10">
            <TabsTrigger value="habitos" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-white/60">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Hábitos
            </TabsTrigger>
            <TabsTrigger value="metas" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-white/60">
              <Target className="w-4 h-4 mr-2" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="diario" className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-white/60">
              <BookOpen className="w-4 h-4 mr-2" />
              Diário
            </TabsTrigger>
          </TabsList>

          {/* Hábitos Diários */}
          <TabsContent value="habitos" className="space-y-6">
            {Object.entries(categoryConfig).map(([category, config]) => {
              const Icon = config.icon;
              const categoryHabits = dailyHabits.filter(h => h.category === category);
              const completed = categoryHabits.filter(h => h.completed).length;
              const total = categoryHabits.length;
              const progress = weeklyProgress[category as HabitCategory];

              return (
                <Card key={category} className="backdrop-blur-xl bg-white/5 border-white/10 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`bg-gradient-to-br ${config.color} p-3 rounded-xl shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-white font-bold">{config.label}</CardTitle>
                          <CardDescription className="text-white/70 text-sm">
                            {config.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
                        {completed}/{total}
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2 mt-3" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryHabits.map(habit => (
                      <div
                        key={habit.id}
                        onClick={() => toggleHabit(habit.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                          habit.completed
                            ? "bg-white/10 border border-white/20"
                            : "bg-white/5 hover:bg-white/10 border border-white/10"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          habit.completed
                            ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-400"
                            : "border-white/30"
                        }`}>
                          {habit.completed && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`flex-1 ${habit.completed ? "text-white/70 line-through" : "text-white"}`}>
                          {habit.title}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Metas */}
          <TabsContent value="metas" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-white font-bold">Minhas Metas</CardTitle>
                    <CardDescription className="text-white/70">
                      Defina e acompanhe seus objetivos
                    </CardDescription>
                  </div>
                  <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-white/10 hover:bg-white/20 text-white shadow-xl border border-white/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Meta
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md backdrop-blur-xl bg-gray-900/95 border-white/20">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white">Nova Meta</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Defina um objetivo específico e mensurável
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label className="text-white">Título da Meta</Label>
                          <Input
                            placeholder="Ex: Economizar para viagem"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                            className="bg-white/5 border-white/20 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Categoria</Label>
                          <Select
                            value={newGoal.category}
                            onValueChange={(value) => setNewGoal({ ...newGoal, category: value as HabitCategory })}
                          >
                            <SelectTrigger className="bg-white/5 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(categoryConfig).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white">Meta</Label>
                            <Input
                              type="number"
                              placeholder="100"
                              value={newGoal.target || ""}
                              onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })}
                              className="bg-white/5 border-white/20 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-white">Unidade</Label>
                            <Input
                              placeholder="kg, R$, dias"
                              value={newGoal.unit}
                              onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                              className="bg-white/5 border-white/20 text-white"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={addGoal}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          Criar Meta
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {goals.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="w-16 h-16 text-white/30 mb-4" />
                  <p className="text-white/70 text-center">
                    Crie sua primeira meta e comece a transformar seus objetivos em realidade!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const config = categoryConfig[goal.category];
                  const Icon = config.icon;
                  const percentage = (goal.progress / goal.target) * 100;

                  return (
                    <Card key={goal.id} className="backdrop-blur-xl bg-white/5 border-white/10 shadow-xl">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`bg-gradient-to-br ${config.color} p-3 rounded-xl shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <Badge className="text-xs mb-2 bg-white/10 text-white border-white/20">
                                {config.label}
                              </Badge>
                              <CardTitle className="text-lg text-white">{goal.title}</CardTitle>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteGoal(goal.id)}
                            className="text-white/50 hover:text-red-400"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white/70">Progresso</span>
                            <span className="text-white font-bold">
                              {goal.progress} / {goal.target} {goal.unit}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Atualizar"
                            className="bg-white/5 border-white/20 text-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(value)) {
                                  updateGoalProgress(goal.id, value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              const value = parseFloat(input.value);
                              if (!isNaN(value)) {
                                updateGoalProgress(goal.id, value);
                                input.value = '';
                              }
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Diário */}
          <TabsContent value="diario" className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-2xl">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl text-white font-bold">Diário de Progresso</CardTitle>
                    <CardDescription className="text-white/70">
                      Registre suas conquistas e reflexões
                    </CardDescription>
                  </div>
                  <Dialog open={showDiaryDialog} onOpenChange={setShowDiaryDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-white/10 hover:bg-white/20 text-white shadow-xl border border-white/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Entrada
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md backdrop-blur-xl bg-gray-900/95 border-white/20">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white">Nova Entrada</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Como foi seu dia?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label className="text-white">Como você se sente?</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {moodEmojis.map((mood) => (
                              <Button
                                key={mood.emoji}
                                variant={newDiaryEntry.mood === mood.emoji ? "default" : "outline"}
                                onClick={() => setNewDiaryEntry({ ...newDiaryEntry, mood: mood.emoji })}
                                className={`h-16 text-3xl ${
                                  newDiaryEntry.mood === mood.emoji
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                                    : "hover:bg-white/10 border-white/20 text-white"
                                }`}
                              >
                                {mood.emoji}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">O que você conquistou hoje?</Label>
                          <Textarea
                            placeholder="Escreva sobre suas conquistas, desafios ou aprendizados do dia..."
                            value={newDiaryEntry.content}
                            onChange={(e) => setNewDiaryEntry({ ...newDiaryEntry, content: e.target.value })}
                            className="min-h-[150px] bg-white/5 border-white/20 text-white placeholder:text-white/40"
                          />
                        </div>
                        <Button
                          onClick={addDiaryEntry}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                        >
                          Salvar Entrada
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
            </Card>

            {diaryEntries.length === 0 ? (
              <Card className="backdrop-blur-xl bg-white/5 border-white/10 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="w-16 h-16 text-white/30 mb-4" />
                  <p className="text-white/70 text-center">
                    Comece seu diário hoje! Registre suas conquistas e reflexões.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {diaryEntries.map((entry) => (
                  <Card key={entry.id} className="backdrop-blur-xl bg-white/5 border-white/10 shadow-xl">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{entry.mood}</span>
                          <div>
                            <CardTitle className="text-lg text-white">
                              {new Date(entry.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </CardTitle>
                            <p className="text-sm text-white/60">
                              {new Date(entry.date).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDiaryEntry(entry.id)}
                          className="text-white/50 hover:text-red-400"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-xl bg-black/80 border-t border-white/10 mt-12 shadow-lg">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-white/70 text-sm font-medium">
            Pequenos passos, grandes transformações 🌱
          </p>
        </div>
      </footer>
    </div>
  );
}
