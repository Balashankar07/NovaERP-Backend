import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Bot, Sparkles, RotateCcw, ChevronRight, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  detectRole,
  resolveResponse,
  ROLE_PROFILES,
  type RoleKey,
  type ConversationContext,
} from "./ai-knowledge-base";
import {
  fetchLiveInsights,
  normalizeInput,
  type LiveInsight,
} from "./ai-live-data";

interface AIAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLiveData?: boolean;
}

// ─── Inline markdown renderer ─────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {content.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-0.5" />;
        if (/^#{1,3}\s/.test(line)) {
          return <p key={i} className="font-bold text-foreground text-[13px] mt-1">{line.replace(/^#+\s/, "")}</p>;
        }
        if (/^\d+[.)]\s|^\d+️⃣/.test(line)) {
          return <p key={i} className="pl-1 text-foreground">{renderInline(line)}</p>;
        }
        if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*  ")) {
          return (
            <p key={i} className="pl-2 flex gap-2 text-foreground">
              <span className="text-indigo-400 shrink-0">›</span>
              <span>{renderInline(line.replace(/^[•\-]\s*/, ""))}</span>
            </p>
          );
        }
        if (/^[⚠️✅📌💡🔍📊🚛📋📦⚙️🔬🛡️↩️💰👥🔄🏭📈🔐🔩]/.test(line)) {
          return <p key={i} className="text-[12px] text-muted-foreground italic mt-0.5">{renderInline(line)}</p>;
        }
        return <p key={i} className="text-foreground">{renderInline(line)}</p>;
      })}
    </div>
  );
}

// ─── Live insight card ────────────────────────────────────────────────────────
function InsightCard({ insight }: { insight: LiveInsight }) {
  const statusColors: Record<LiveInsight["status"], string> = {
    ok: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800/30 dark:text-emerald-400",
    warn: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800/30 dark:text-amber-400",
    critical: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800/30 dark:text-rose-400",
    info: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/30 dark:text-blue-400",
  };
  return (
    <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-medium ${statusColors[insight.status]}`}>
      <span className="flex items-center gap-1.5">
        <span>{insight.emoji}</span>
        <span>{insight.label}</span>
      </span>
      <span className="font-bold text-[13px]">{insight.value}</span>
    </div>
  );
}

// ─── Role theme ───────────────────────────────────────────────────────────────
const ROLE_THEMES: Record<RoleKey, { bot: string; header: string; badge: string }> = {
  super_admin:        { bot: "bg-indigo-600",   header: "from-indigo-50/50 dark:from-indigo-950/20",  badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" },
  procurement_manager:{ bot: "bg-amber-600",    header: "from-amber-50/50 dark:from-amber-950/20",    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  production_manager: { bot: "bg-blue-600",     header: "from-blue-50/50 dark:from-blue-950/20",      badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  warehouse_manager:  { bot: "bg-orange-600",   header: "from-orange-50/50 dark:from-orange-950/20",  badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  quality_engineer:   { bot: "bg-emerald-600",  header: "from-emerald-50/50 dark:from-emerald-950/20",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  sales_manager:      { bot: "bg-rose-600",     header: "from-rose-50/50 dark:from-rose-950/20",      badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300" },
  warranty_executive: { bot: "bg-purple-600",   header: "from-purple-50/50 dark:from-purple-950/20",  badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" },
};

// ─── Main component ───────────────────────────────────────────────────────────
export function AIAssistantDrawer({ open, onOpenChange }: AIAssistantDrawerProps) {
  const { user } = useAuth();
  const roleKey: RoleKey = detectRole(user?.role);
  const profile = ROLE_PROFILES[roleKey];
  const theme = ROLE_THEMES[roleKey];

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<LiveInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [conversationCtx, setConversationCtx] = useState<ConversationContext>({
    lastIntentKeywords: [],
    lastRole: roleKey,
    turnCount: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const getInitials = (email?: string) =>
    !email ? "SA" : email.split("@")[0].substring(0, 2).toUpperCase();

  const buildGreeting = useCallback((): Message => ({
    id: "greeting",
    role: "assistant",
    content: profile.greeting,
    timestamp: new Date(),
  }), [profile.greeting]);

  // Load live insights from backend
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const data = await fetchLiveInsights(roleKey);
      setInsights(data);
    } catch {
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }, [roleKey]);

  // Initialize on open
  useEffect(() => {
    if (open) {
      setMessages([buildGreeting()]);
      setInput("");
      setShowInsights(true);
      setConversationCtx({ lastIntentKeywords: [], lastRole: roleKey, turnCount: 0 });
      loadInsights();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, user?.role]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Build proactive alerts from insights
  const buildProactiveAlert = useCallback((data: LiveInsight[]): string | null => {
    const critical = data.filter(i => i.status === "critical");
    const warnings = data.filter(i => i.status === "warn");
    if (critical.length === 0 && warnings.length === 0) return null;

    const lines: string[] = ["🔔 **Live System Alerts for You:**\n"];
    critical.forEach(i => lines.push(`❌ **CRITICAL — ${i.label}: ${i.value}** — requires immediate attention.`));
    warnings.forEach(i => lines.push(`⚠️ **${i.label}: ${i.value}** — review recommended.`));
    lines.push("\n💡 *Click any Quick Action or ask me how to handle these.*");
    return lines.join("\n");
  }, []);

  // After insights load, inject a proactive alert message if needed
  useEffect(() => {
    if (insights.length > 0 && messages.length === 1) {
      const alertText = buildProactiveAlert(insights);
      if (alertText) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: "proactive-alert",
            role: "assistant",
            content: alertText,
            timestamp: new Date(),
            isLiveData: true,
          }]);
        }, 800);
      }
    }
  }, [insights]);

  const handleSend = useCallback((overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setShowInsights(false);

    // Check for follow-up intent BEFORE normalization (so phrases are not destroyed)
    const rawLower = text.toLowerCase();
    const isFollowUp = ["what's next", "whats next", "what next", "next step", "and then", "after that", "what do i do after", "continue", "then what", "proceed", "show me more"].some(p => rawLower.includes(p));

    // Normalize for keyword matching (but follow-up already captured above)
    const normalized = isFollowUp ? rawLower : normalizeInput(text);
    // Smart delay: shorter for follow-ups, longer for new topics
    const delay = isFollowUp ? 400 : Math.min(500 + normalized.length * 6, 1200);

    setTimeout(() => {
      const { answer, matchedKeywords } = resolveResponse(normalized, roleKey, conversationCtx);

      // Inject live data if the answer is about counts/status
      let finalAnswer = answer;
      const dataKeywords = ["pending", "overdue", "stock", "open", "active", "expiring", "claims"];
      const wantsData = dataKeywords.some(k => normalized.includes(k));
      if (wantsData && insights.length > 0) {
        const relevant = insights.slice(0, 3).map(i => `• **${i.label}:** ${i.value}`).join("\n");
        finalAnswer += `\n\n📊 **Your Current Numbers:**\n${relevant}`;
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: finalAnswer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);

      // Update conversation context for multi-turn
      setConversationCtx(prev => ({
        lastIntentKeywords: matchedKeywords,
        lastRole: roleKey,
        turnCount: prev.turnCount + 1,
      }));
    }, delay);
  }, [input, isTyping, roleKey, conversationCtx, insights]);

  const handleReset = () => {
    setMessages([buildGreeting()]);
    setInput("");
    setShowInsights(true);
    setConversationCtx({ lastIntentKeywords: [], lastRole: roleKey, turnCount: 0 });
    loadInsights();
    inputRef.current?.focus();
  };

  // Keyboard shortcut: Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const criticalCount = insights.filter(i => i.status === "critical").length;
  const warnCount = insights.filter(i => i.status === "warn").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[500px] flex flex-col p-0 overflow-hidden border-l border-border/60 bg-background">

        {/* ─── Header ──────────────────────────────────────────────────────── */}
        <SheetHeader className={`shrink-0 px-5 py-3.5 border-b border-border/50 bg-gradient-to-r ${theme.header} to-background`}>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3 text-foreground">
              <div className={`h-9 w-9 rounded-xl ${theme.bot} flex items-center justify-center shadow-md`}>
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">NovaERP AI Guide</p>
                <p className="text-[11px] text-muted-foreground font-normal">Enterprise Workflow Intelligence</p>
              </div>
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={loadInsights} title="Refresh live data"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${insightsLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={handleReset} title="Reset conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Role badge + status bar */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${theme.badge}`}>
              <span>{profile.badge}</span>
              {profile.label}
            </span>
            {!insightsLoading && criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} critical
              </span>
            )}
            {!insightsLoading && warnCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                {warnCount} warning{warnCount > 1 ? "s" : ""}
              </span>
            )}
            {insightsLoading && (
              <span className="text-[10px] text-muted-foreground italic">Fetching live data...</span>
            )}
          </div>
          <SheetDescription className="sr-only">NovaERP AI Workflow Assistant</SheetDescription>
        </SheetHeader>

        {/* ─── Live Insights Panel ──────────────────────────────────────────── */}
        {showInsights && insights.length > 0 && (
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-border/30 bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                {(criticalCount > 0 || warnCount > 0) ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    Actionable Alerts
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    Live Snapshot — Right Now
                  </>
                )}
              </p>
              <button
                onClick={() => setShowInsights(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* ─── Messages ────────────────────────────────────────────────────── */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <Avatar className="h-7 w-7 shrink-0 mt-0.5 ring-2 ring-background shadow-sm">
                  {msg.role === "assistant" ? (
                    <div className={`h-full w-full flex items-center justify-center ${theme.bot} rounded-full`}>
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                      {getInitials(user?.email)}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 shadow-sm border ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm border-primary/20"
                    : msg.isLiveData
                    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30 rounded-tl-sm"
                    : "bg-white dark:bg-slate-900 rounded-tl-sm border-border/60"
                }`}>
                  {msg.role === "assistant" ? (
                    <AssistantMessage content={msg.content} />
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  <p className={`text-[9px] mt-1.5 ${
                    msg.role === "user" ? "text-primary-foreground/50 text-right" : "text-muted-foreground"
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5">
                <Avatar className="h-7 w-7 shrink-0 ring-2 ring-background shadow-sm">
                  <div className={`h-full w-full flex items-center justify-center ${theme.bot} rounded-full`}>
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                </Avatar>
                <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-sm px-4 py-3 border border-border/60 shadow-sm flex items-center gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* ─── Quick Actions (shown when conversation is fresh) ─────────────── */}
        {messages.length <= 2 && !isTyping && (
          <div className="shrink-0 px-4 pt-3 pb-2 border-t border-border/30 bg-muted/5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3" />
              Quick Actions
            </p>
            <div className="flex flex-col gap-1">
              {profile.suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="group w-full flex items-center justify-between gap-2 text-left text-xs bg-white hover:bg-indigo-50 dark:bg-slate-900/60 dark:hover:bg-indigo-900/20 text-foreground px-3 py-1.5 rounded-lg border border-border/50 hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all"
                >
                  <span className="leading-snug">{q}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Follow-up suggestions (after first exchange) ────────────────── */}
        {conversationCtx.turnCount > 0 && messages.length > 2 && !isTyping && (
          <div className="shrink-0 px-4 pb-2 pt-1 bg-muted/5">
            <div className="flex flex-wrap gap-1.5">
              {["What's next?", "Show me more detail", "How do I fix this?"].map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Input ───────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 py-3 border-t border-border/50 bg-background">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything about ${profile.label.toLowerCase()} workflows...`}
              disabled={isTyping}
              className="flex-1 h-10 px-4 text-sm rounded-full bg-muted/50 border border-border/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 placeholder:text-muted-foreground/60 transition-all disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className={`rounded-full h-10 w-10 shrink-0 ${theme.bot} hover:opacity-90 text-white shadow-sm transition-all active:scale-95 disabled:opacity-40`}
            >
              <Send className="h-4 w-4 ml-0.5" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Live data • Workflow guidance • Context-aware responses
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
