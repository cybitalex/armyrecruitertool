import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth, ProtectedRoute } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { qrScanAnalytics } from "@/lib/api";
import {
  Users, TrendingUp, Plus, Search, X, Edit2, Save,
  Shield, Star, Activity, QrCode, Zap, ArrowUpRight,
} from "lucide-react";
import type { Recruit } from "@shared/schema";

// ── SORB field types ────────────────────────────────────────────────────────

export interface SorbFields {
  rank?: string;
  gt?: number | null;
  mos?: string;
  post?: string;
  unit?: string;
  sorbCo?: string;
  logAttempt?: string;
  contacted?: boolean;
  pipeline?: string;
  runTime2mi?: string;
  ruckTime12mi?: string;
  pushups?: number;
  situps?: number;
  ptScore?: number;
  medicalEligible?: boolean;
  airborneQualified?: boolean;
  noMoralWaiver?: boolean;
  priorSOCOM?: boolean;
  readinessScore?: number;
}

export function parseSorb(notes: string | null | undefined): SorbFields {
  if (!notes) return {};
  try {
    const raw = notes.includes("\n---\n") ? notes.split("\n---\n").slice(-1)[0] : notes;
    const j = JSON.parse(raw);
    if (j._sorb) return j._sorb as SorbFields;
  } catch {}
  const fields: Record<string, string> = {};
  notes.split("|").forEach((pair) => {
    const m = pair.trim().match(/^([^:]+):\s*(.+)$/);
    if (m) fields[m[1].trim().toLowerCase().replace(/\s+/g, "_")] = m[2].trim();
  });
  return {
    rank: fields["rank"],
    gt: fields["gt"] ? Number(fields["gt"]) || null : null,
    mos: fields["mos"],
    post: fields["post"],
    unit: fields["unit"],
    sorbCo: fields["sorb_co"] || fields["sorb co"],
    logAttempt: fields["log_attempt"] || fields["log attempt"],
    contacted: fields["contacted"] === "Y",
  };
}

export function getFreeNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  if (notes.includes("\n---\n")) return notes.split("\n---\n")[0];
  if (notes.startsWith("{")) return "";
  if (notes.includes("[SORB_IMPORT]")) return "";
  return notes;
}

// ── Pipeline config ─────────────────────────────────────────────────────────

export const PIPELINE_CONFIG: Record<string, { label: string; color: string; minGT?: number }> = {
  "18X":      { label: "18X — Special Forces",   color: "bg-green-700 text-white border-green-700",    minGT: 110 },
  "Option40": { label: "Option 40 — Ranger",      color: "bg-yellow-600 text-white border-yellow-600",  minGT: 105 },
  "CA":       { label: "Civil Affairs",           color: "bg-blue-600 text-white border-blue-600",      minGT: 105 },
  "PSYOP":    { label: "PSYOP",                   color: "bg-purple-600 text-white border-purple-600",  minGT: 110 },
  "160th":    { label: "160th SOAR",              color: "bg-red-700 text-white border-red-700",        minGT: 110 },
  "Ranger":   { label: "Ranger Regiment",         color: "bg-orange-600 text-white border-orange-600", minGT: 105 },
  "Unknown":  { label: "Undetermined",            color: "bg-gray-200 text-gray-700 border-gray-300" },
};

function PipelineBadge({ pipeline }: { pipeline?: string }) {
  const cfg = PIPELINE_CONFIG[pipeline ?? ""] ?? PIPELINE_CONFIG["Unknown"];
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${cfg.color}`}>
      {pipeline || "—"}
    </span>
  );
}

// ── Status config ───────────────────────────────────────────────────────────

export const SORB_STATUSES = [
  { value: "prospect",     label: "Prospect",     color: "bg-gray-100 text-gray-700 border-gray-300",       stage: 1 },
  { value: "screening",    label: "Screening",    color: "bg-yellow-100 text-yellow-800 border-yellow-300", stage: 2 },
  { value: "recommended",  label: "Recommended",  color: "bg-blue-100 text-blue-800 border-blue-300",       stage: 3 },
  { value: "preparing",    label: "Preparing",    color: "bg-purple-100 text-purple-800 border-purple-300", stage: 4 },
  { value: "contracting",  label: "Contracting",  color: "bg-orange-100 text-orange-800 border-orange-300", stage: 5 },
  { value: "contracted",   label: "Contracted",   color: "bg-green-100 text-green-800 border-green-300",    stage: 6 },
  { value: "declined",     label: "Declined",     color: "bg-red-100 text-red-800 border-red-300",          stage: 0 },
  // Legacy statuses
  { value: "pending",      label: "Pending",      color: "bg-gray-100 text-gray-600 border-gray-200",       stage: 1 },
  { value: "attempted",    label: "Attempted",    color: "bg-yellow-50 text-yellow-700 border-yellow-200",  stage: 1 },
  { value: "contacted",    label: "Contacted",    color: "bg-blue-50 text-blue-700 border-blue-200",        stage: 2 },
  { value: "interested",   label: "Interested",   color: "bg-purple-50 text-purple-700 border-purple-200",  stage: 2 },
  { value: "scheduled",    label: "Scheduled",    color: "bg-green-50 text-green-700 border-green-200",     stage: 3 },
  { value: "qualified",    label: "Qualified",    color: "bg-emerald-100 text-emerald-800 border-emerald-300", stage: 4 },
];

export function StatusBadge({ status }: { status: string }) {
  const cfg = SORB_STATUSES.find((s) => s.value === status) ?? SORB_STATUSES[0];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Readiness score ─────────────────────────────────────────────────────────

export function calcReadiness(sorb: SorbFields): number {
  let score = 0;
  const gt = sorb.gt ?? 0;
  if (gt >= 110) score += 25;
  else if (gt >= 105) score += 15;
  else if (gt >= 100) score += 8;

  if (sorb.contacted) score += 10;
  if (sorb.medicalEligible) score += 15;
  if (sorb.airborneQualified) score += 10;
  if (sorb.noMoralWaiver) score += 5;
  if (sorb.priorSOCOM) score += 15;
  if (sorb.pipeline && sorb.pipeline !== "Unknown") score += 5;

  const ptSc = sorb.ptScore;
  if (ptSc) score += Math.min(15, Math.round((ptSc / 300) * 15));

  return Math.min(100, score);
}

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-600" : score >= 45 ? "bg-yellow-500" : "bg-gray-300";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600">{score}</span>
    </div>
  );
}

// ── Quick status selector ───────────────────────────────────────────────────

function QuickStatus({ recruit }: { recruit: Recruit }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const PRIMARY_STATUSES = SORB_STATUSES.filter(s => s.stage > 0 || s.value === "declined").slice(0, 8);

  const mut = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/sorb/leads/${recruit.id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/recruits"] }),
    onError: () => toast({ variant: "destructive", title: "Failed to update status" }),
  });

  return (
    <Select value={recruit.status} onValueChange={(v) => mut.mutate(v)}>
      <SelectTrigger className="h-7 w-32 border-none shadow-none p-0 focus:ring-0 text-xs">
        <StatusBadge status={recruit.status} />
      </SelectTrigger>
      <SelectContent>
        {PRIMARY_STATUSES.map((s) => (
          <SelectItem key={s.value} value={s.value}><StatusBadge status={s.value} /></SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Edit drawer ─────────────────────────────────────────────────────────────

function EditDrawer({ recruit, onClose }: { recruit: Recruit & { _sorb: SorbFields }; onClose: () => void }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const s = recruit._sorb;
  const freeNotes = getFreeNotes(recruit.additionalNotes);

  const [form, setForm] = useState({
    firstName: recruit.firstName,
    lastName: recruit.lastName,
    phone: recruit.phone,
    status: recruit.status,
    rank: s.rank ?? "",
    gt: s.gt != null ? String(s.gt) : "",
    mos: s.mos ?? "",
    post: s.post ?? "",
    unit: s.unit ?? "",
    sorbCo: s.sorbCo ?? "",
    logAttempt: s.logAttempt ?? "None",
    contacted: s.contacted ?? false,
    pipeline: s.pipeline ?? "",
    runTime2mi: s.runTime2mi ?? "",
    ruckTime12mi: s.ruckTime12mi ?? "",
    pushups: s.pushups != null ? String(s.pushups) : "",
    situps: s.situps != null ? String(s.situps) : "",
    ptScore: s.ptScore != null ? String(s.ptScore) : "",
    medicalEligible: s.medicalEligible ?? false,
    airborneQualified: s.airborneQualified ?? false,
    noMoralWaiver: s.noMoralWaiver ?? false,
    priorSOCOM: s.priorSOCOM ?? false,
    notes: freeNotes,
  });

  const mut = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch(`/api/sorb/leads/${recruit.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          gt: data.gt ? Number(data.gt) : null,
          pushups: data.pushups ? Number(data.pushups) : null,
          situps: data.situps ? Number(data.situps) : null,
          ptScore: data.ptScore ? Number(data.ptScore) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recruits"] });
      qc.invalidateQueries({ queryKey: ["/api/sorb/pipeline-analytics"] });
      toast({ title: "Lead updated" });
      onClose();
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const setField = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));
  const inp = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  });
  const chk = (key: keyof typeof form) => ({
    checked: form[key] as boolean,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.checked })),
  });

  const RANKS = ["PFC","SPC","CPL","SGT","SSG","SFC","MSG","1SG","SGM","WO1","CW2","CW3","CW4","CW5"];
  const readiness = calcReadiness({
    gt: form.gt ? Number(form.gt) : null,
    contacted: form.contacted,
    medicalEligible: form.medicalEligible,
    airborneQualified: form.airborneQualified,
    noMoralWaiver: form.noMoralWaiver,
    priorSOCOM: form.priorSOCOM,
    pipeline: form.pipeline,
    ptScore: form.ptScore ? Number(form.ptScore) : undefined,
  });

  return (
    <div className="space-y-4 text-sm">
      {/* Readiness bar at top */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Readiness Score</span>
        <ReadinessBar score={readiness} />
      </div>

      {/* Identity */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Soldier Identity</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Rank</Label>
            <Select value={form.rank} onValueChange={setField("rank")}>
              <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Rank" /></SelectTrigger>
              <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Last Name</Label>
            <Input className="h-8 mt-1" {...inp("lastName")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">First Name</Label>
            <Input className="h-8 mt-1" {...inp("firstName")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Phone</Label>
            <Input className="h-8 mt-1" {...inp("phone")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">GT Score</Label>
            <Input className="h-8 mt-1 font-mono" type="number" {...inp("gt")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">MOS</Label>
            <Input className="h-8 mt-1 font-mono uppercase" {...inp("mos")} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-gray-500">Post / Base</Label>
            <Input className="h-8 mt-1" {...inp("post")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Unit</Label>
            <Input className="h-8 mt-1" {...inp("unit")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">SORB CO</Label>
            <Select value={form.sorbCo} onValueChange={setField("sorbCo")}>
              <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{["A Co","B Co","C Co","D Co"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pipeline & Status */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pipeline &amp; Status</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">Pipeline</Label>
            <Select value={form.pipeline} onValueChange={setField("pipeline")}>
              <SelectTrigger className="h-8 mt-1"><SelectValue placeholder="Select pipeline" /></SelectTrigger>
              <SelectContent>
                {Object.entries(PIPELINE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Stage</Label>
            <Select value={form.status} onValueChange={setField("status")}>
              <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORB_STATUSES.slice(0, 7).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Log Attempt</Label>
            <Select value={form.logAttempt} onValueChange={setField("logAttempt")}>
              <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["None","Email","Text","Phone Call","In Person"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" id="contacted_e" {...chk("contacted")} className="h-4 w-4 rounded" />
            <Label htmlFor="contacted_e" className="text-sm">Contacted</Label>
          </div>
        </div>
      </div>

      {/* Screening criteria */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Screening Criteria</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["medicalEligible",  "Medical Eligible"],
            ["airborneQualified","Airborne Qualified"],
            ["noMoralWaiver",    "No Moral Waiver Required"],
            ["priorSOCOM",       "Prior SOCOM Service"],
          ] as [keyof typeof form, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...chk(key)} className="h-4 w-4 rounded text-green-700" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* PT Metrics */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PT Metrics</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-500">2-Mile Run (mm:ss)</Label>
            <Input className="h-8 mt-1 font-mono" placeholder="13:45" {...inp("runTime2mi")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">12-Mile Ruck (h:mm)</Label>
            <Input className="h-8 mt-1 font-mono" placeholder="3:00" {...inp("ruckTime12mi")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Push-ups (2 min)</Label>
            <Input className="h-8 mt-1 font-mono" type="number" {...inp("pushups")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Sit-ups (2 min)</Label>
            <Input className="h-8 mt-1 font-mono" type="number" {...inp("situps")} />
          </div>
          <div>
            <Label className="text-xs text-gray-500">APFT / ACFT Score</Label>
            <Input className="h-8 mt-1 font-mono" type="number" placeholder="270" {...inp("ptScore")} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-xs text-gray-500 uppercase tracking-wide">Notes / Next Steps</Label>
        <textarea
          className="mt-1 w-full h-20 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          value={form.notes}
          onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Mentorship notes, prep guidance, next steps…"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="bg-green-700 hover:bg-green-800 flex-1" onClick={() => mut.mutate(form)} disabled={mut.isPending}>
          <Save className="w-4 h-4 mr-1" /> {mut.isPending ? "Saving…" : "Save Changes"}
        </Button>
        <Button size="sm" variant="outline" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>
    </div>
  );
}

// ── Main dashboard ──────────────────────────────────────────────────────────

function SORBDashboardContent() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPipeline, setFilterPipeline] = useState("all");
  const [filterPost, setFilterPost] = useState("all");
  const [editTarget, setEditTarget] = useState<(Recruit & { _sorb: SorbFields }) | null>(null);

  const { data: raw = [], isLoading } = useQuery<Recruit[]>({
    queryKey: ["/api/recruits"],
    queryFn: async () => {
      const res = await fetch("/api/recruits", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: qrData } = useQuery({
    queryKey: ["/qr-scans/analytics"],
    queryFn: () => qrScanAnalytics.getAnalytics(),
    refetchInterval: 30000,
  });

  const leads = useMemo(() =>
    raw.map(r => ({ ...r, _sorb: parseSorb(r.additionalNotes) })), [raw]);

  const posts = useMemo(() => [...new Set(leads.map(l => l._sorb.post).filter(Boolean))].sort() as string[], [leads]);

  const filtered = useMemo(() => leads.filter(l => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (filterPipeline !== "all" && (l._sorb.pipeline ?? "Unknown") !== filterPipeline) return false;
    if (filterPost !== "all" && l._sorb.post !== filterPost) return false;
    if (search) {
      const q = search.toLowerCase();
      const hit = `${l.firstName} ${l.lastName} ${l._sorb.rank ?? ""} ${l._sorb.mos ?? ""} ${l._sorb.post ?? ""} ${l._sorb.pipeline ?? ""}`.toLowerCase();
      if (!hit.includes(q)) return false;
    }
    return true;
  }), [leads, filterStatus, filterPipeline, filterPost, search]);

  const stats = useMemo(() => ({
    total:       leads.length,
    screened:    leads.filter(l => ["screening","recommended","preparing","contracting","contracted"].includes(l.status)).length,
    pipeline:    leads.filter(l => l._sorb.pipeline && l._sorb.pipeline !== "Unknown").length,
    contracted:  leads.filter(l => ["contracting","contracted"].includes(l.status)).length,
  }), [leads]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.rank ? `${user.rank} ` : ""}{user?.fullName} — SORB Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Special Operations Recruiting Battalion · My Leads</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800 self-start sm:self-auto" onClick={() => navigate("/sorb-intake")}>
          <Plus className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total QM",      value: stats.total,      icon: Users,      color: "text-gray-700" },
          { label: "Screened",      value: stats.screened,   icon: Shield,     color: "text-yellow-600" },
          { label: "Pipeline Set",  value: stats.pipeline,   icon: Activity,   color: "text-blue-600" },
          { label: "Contracting+",  value: stats.contracted, icon: Star,       color: "text-green-700" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <Icon className={`w-8 h-8 ${color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* QR Campaign stats */}
      <Card className="border shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-2 text-gray-500">
              <QrCode className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">QR Campaign</span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 flex-1">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900">{qrData?.totalScans ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Conversions</p>
                <p className="text-2xl font-bold text-green-700">{qrData?.totalConverted ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Conversion Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {qrData ? `${qrData.overallConversionRate.toFixed(1)}%` : "0%"}
                </p>
              </div>
              {(qrData?.locations?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Active QR Codes</p>
                  <p className="text-2xl font-bold text-purple-600">{qrData?.locations.length}</p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-gray-200 text-gray-600 hover:text-gray-900 text-xs"
              onClick={() => navigate("/my-qr")}
            >
              <ArrowUpRight className="w-3 h-3 mr-1" /> View QR Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <Input className="pl-8 h-8 text-sm" placeholder="Name, rank, MOS, post…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Stage</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {SORB_STATUSES.slice(0, 7).map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Pipeline</Label>
              <Select value={filterPipeline} onValueChange={setFilterPipeline}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pipelines</SelectItem>
                  {Object.entries(PIPELINE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[140px]">
              <Label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Post</Label>
              <Select value={filterPost} onValueChange={setFilterPost}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  {posts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {(filterStatus !== "all" || filterPipeline !== "all" || filterPost !== "all" || search) && (
              <Button variant="ghost" size="sm" className="h-8 text-gray-500" onClick={() => { setFilterStatus("all"); setFilterPipeline("all"); setFilterPost("all"); setSearch(""); }}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
            <span className="text-xs text-gray-400 self-end pb-1">{filtered.length} / {leads.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading pipeline…</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">{leads.length === 0 ? "No leads yet — add your first." : "No leads match your filters."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 text-[11px] uppercase tracking-wide">
                    <TableHead className="font-semibold text-gray-600">Soldier</TableHead>
                    <TableHead className="font-semibold text-gray-600 w-12 text-center">GT</TableHead>
                    <TableHead className="font-semibold text-gray-600 w-16">MOS</TableHead>
                    <TableHead className="font-semibold text-gray-600">Pipeline</TableHead>
                    <TableHead className="font-semibold text-gray-600 w-36">Stage</TableHead>
                    <TableHead className="font-semibold text-gray-600">Post</TableHead>
                    <TableHead className="font-semibold text-gray-600 w-20">Readiness</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => {
                    const s = lead._sorb;
                    const readiness = calcReadiness(s);
                    return (
                      <TableRow key={lead.id} className="hover:bg-gray-50 group">
                        <TableCell className="font-medium text-sm">
                          <div>
                            <span>{s.rank ? `${s.rank} ` : ""}{lead.lastName}</span>
                            {lead.firstName !== "SOLDIER" && (
                              <span className="text-xs text-gray-400 block">{lead.firstName}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {s.gt != null ? (
                            <span className={`font-mono font-bold text-xs ${s.gt >= 110 ? "text-green-700" : s.gt >= 105 ? "text-yellow-600" : "text-red-600"}`}>
                              {s.gt}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-gray-700">{s.mos || <span className="text-gray-300">—</span>}</TableCell>
                        <TableCell><PipelineBadge pipeline={s.pipeline} /></TableCell>
                        <TableCell><QuickStatus recruit={lead} /></TableCell>
                        <TableCell className="text-xs text-gray-600 max-w-[130px] truncate">{s.post || "—"}</TableCell>
                        <TableCell><ReadinessBar score={readiness} /></TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700"
                            onClick={() => setEditTarget(lead)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Lead — {editTarget ? `${editTarget._sorb.rank ?? ""} ${editTarget.lastName}` : ""}
            </DialogTitle>
          </DialogHeader>
          {editTarget && <EditDrawer recruit={editTarget} onClose={() => setEditTarget(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SORBDashboard() {
  return (
    <ProtectedRoute>
      <SORBDashboardContent />
    </ProtectedRoute>
  );
}
