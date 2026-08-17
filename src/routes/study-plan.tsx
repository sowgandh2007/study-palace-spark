import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Download, RotateCcw, BookOpen, Clock, Calendar, CheckCircle, ArrowRight, ShieldCheck, BrainCircuit } from "lucide-react";
import { EchoNavbar } from "@/components/EchoNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEcho } from "@/lib/echo/store";
import { generateStructuredStudyPlan } from "@/lib/echo/studyPlanGenerator";
import { StudyPlanData, StudyTask } from "@/lib/echo/types";
import { toast } from "sonner";

export const Route = createFileRoute("/study-plan")({
  validateSearch: (search: Record<string, unknown>) => ({
    concept: typeof search["concept"] === "string" ? (search["concept"] as string) : undefined,
  }),
  component: StudyPlanPage,
});

export function StudyPlanPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { 
    reflections, 
    activeLearnMaterial, 
    activeStudyPlan, 
    setActiveStudyPlan,
    completeStudyTask,
    moveStudyTaskToTomorrow
  } = useEcho();
  const latestReflection = reflections[0];

  const defaultTopic = search.concept || latestReflection?.conceptName || activeLearnMaterial?.topic || "Binary Search";

  const [conceptInput, setConceptInput] = useState(defaultTopic);
  const [daysAvailable, setDaysAvailable] = useState<number>(7);
  const [hoursPerDay, setHoursPerDay] = useState<number>(2);
  const [generating, setGenerating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleGeneratePlan(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const topicToUse = conceptInput.trim() || defaultTopic;
    if (!topicToUse || daysAvailable <= 0 || hoursPerDay <= 0) return;

    setGenerating(true);
    try {
      const plan = await generateStructuredStudyPlan(
        topicToUse,
        daysAvailable,
        hoursPerDay,
        latestReflection?.understoodText,
        latestReflection?.notUnderstoodText,
        latestReflection?.confidence
      );
      setActiveStudyPlan(plan);
      toast.success("Generated Structured Study Plan!");
    } catch {
      toast.error("Failed to generate study plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownloadPdf() {
    if (!activeStudyPlan) return;
    setDownloadingPdf(true);
    try {
      const html2pdfModule = await import("html2pdf.js");
      const html2pdf = html2pdfModule.default || (window as any).html2pdf;
      
      const element = document.getElementById("echo-study-plan-doc-view");
      if (!element) throw new Error("Plan element not found");

      const opt = {
        margin: [12, 12, 12, 12] as [number, number, number, number],
        filename: `${activeStudyPlan.topic.replace(/[^a-z0-9_-]/gi, "_")}_Study_Plan.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt as never).from(element).save();
      toast.success("Downloaded Study Plan PDF!");
    } catch (err) {
      console.error(err);
      toast.error("PDF download failed. Opening print view...");
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "HIGH": return "text-rose-600 border-rose-200 bg-rose-50";
      case "MEDIUM": return "text-amber-600 border-amber-200 bg-amber-50";
      case "LOW": return "text-emerald-600 border-emerald-200 bg-emerald-50";
      default: return "text-slate-600 border-slate-200 bg-slate-50";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case "HIGH": return "🔴";
      case "MEDIUM": return "🟡";
      case "LOW": return "🟢";
      default: return "⚪";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-royal-ice-page selection:bg-primary/30 pb-28 md:pb-20">
      <EchoNavbar variant="light" />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Header */}
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            ECHO STUDY PLANNER
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mt-1">
            Structured Daily Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1">
            Generate an adaptive, priority-aware daily study schedule derived from your context.
          </p>
        </div>

        {/* Input & Generator Card */}
        {!activeStudyPlan && (
          <div className="glass-card-light p-6 sm:p-8 space-y-6 rounded-2xl bg-white/95 border border-slate-200 shadow-md">
            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="size-4 text-primary" /> Target Concept / Subject
                </label>
                <Input
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="e.g. Data Structures, React, Operating Systems"
                  className="bg-white border-slate-300 text-slate-900 min-h-[46px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar className="size-4 text-primary" /> Days Available
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={daysAvailable}
                    onChange={(e) => setDaysAvailable(parseInt(e.target.value) || 1)}
                    className="bg-white border-slate-300 text-slate-900 min-h-[46px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="size-4 text-primary" /> Max Hours / Day
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(parseInt(e.target.value) || 1)}
                    className="bg-white border-slate-300 text-slate-900 min-h-[46px]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={generating || !conceptInput.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-glow text-base min-h-[48px] rounded-2xl"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" /> Generating Study Schedule...
                  </>
                ) : (
                  <>
                    Generate Study Plan <Sparkles className="ml-2 size-5 text-sky-200" />
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Generated Plan View */}
        {activeStudyPlan && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Action Bar */}
            <div className="glass-card-light p-5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase text-primary">Active Plan</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">{activeStudyPlan.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[38px] shadow-glow"
                >
                  {downloadingPdf ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Download className="size-3.5 mr-1.5" />}
                  PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveStudyPlan(null)}
                  className="border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs min-h-[38px]"
                >
                  <RotateCcw className="size-3.5 mr-1 text-primary" /> New
                </Button>
              </div>
            </div>

            {/* Print Container */}
            <div id="echo-study-plan-doc-view" className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-2xl font-black text-slate-900 uppercase">{activeStudyPlan.title}</h1>
                <p className="text-slate-500 font-mono text-sm mt-2">
                  {activeStudyPlan.startDate} to {activeStudyPlan.endDate} &bull; {Math.round(activeStudyPlan.totalStudyMinutes / 60)}h Total Focus
                </p>
                <div className="flex justify-center gap-4 mt-4 text-xs font-bold text-slate-600 uppercase">
                  <span>🔴 HIGH PRIORITY</span>
                  <span>🟡 MEDIUM PRIORITY</span>
                  <span>🟢 LOW PRIORITY</span>
                </div>
              </div>

              <div className="space-y-8">
                {activeStudyPlan.days.map((day, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm break-inside-avoid">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-900">Day {day.dayIndex} &bull; {day.date}</h3>
                        <p className="text-xs text-primary font-bold uppercase">{day.focus}</p>
                      </div>
                      <Badge variant="outline" className="bg-white shadow-sm font-mono">{day.tasks.reduce((acc, t) => acc + t.durationMinutes, 0)} mins</Badge>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                      {day.tasks.length === 0 ? (
                        <div className="p-4 text-sm text-slate-500 italic text-center">Rest / Catch-up day</div>
                      ) : (
                        day.tasks.map((task: StudyTask) => (
                          <div key={task.id} className={`p-4 flex flex-col sm:flex-row gap-4 justify-between ${task.completed ? 'opacity-50 bg-slate-50' : 'bg-white'}`}>
                            <div className="flex gap-3">
                              <div className="pt-1">{getPriorityIcon(task.priority)}</div>
                              <div>
                                <h4 className={`font-bold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                  {task.topic}
                                </h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <span className="text-xs font-mono text-slate-500 flex items-center"><Clock className="size-3 mr-1"/>{task.durationMinutes}m</span>
                                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getPriorityColor(task.priority)}`}>{task.type}</Badge>
                                  <Badge variant="outline" className="text-[10px] uppercase bg-slate-100 text-slate-600">{task.difficulty}</Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Interactive Actions (Hidden in PDF print) */}
                            <div className="print:hidden flex items-center gap-2 self-start sm:self-center">
                              <Button
                                size="sm"
                                variant={task.completed ? "outline" : "default"}
                                onClick={() => completeStudyTask(task.id)}
                                className={`text-xs min-h-[36px] ${task.completed ? '' : 'bg-primary text-white shadow-glow'}`}
                              >
                                {task.completed ? <RotateCcw className="size-3.5 mr-1"/> : <CheckCircle className="size-3.5 mr-1"/>}
                                {task.completed ? 'Undo' : 'Done'}
                              </Button>
                              
                              {!task.completed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moveStudyTaskToTomorrow(task.id)}
                                  className="text-xs text-slate-600 border-slate-300 min-h-[36px]"
                                  title="Move to Tomorrow"
                                >
                                  <ArrowRight className="size-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
             {/* Connected CTAs */}
             <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => navigate({ to: "/reflection", search: { concept: activeStudyPlan.topic } })}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs min-h-[44px] shadow-glow"
              >
                <BrainCircuit className="size-4 mr-2" /> Reflect on this concept →
              </Button>

              <Button
                type="button"
                onClick={() => navigate({ to: "/assessment", search: { concept: activeStudyPlan.topic } })}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 font-bold text-xs min-h-[44px]"
              >
                <ShieldCheck className="size-4 mr-2" /> Verify understanding →
              </Button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
