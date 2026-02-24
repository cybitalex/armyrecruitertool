import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProtectedRoute } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ArrowLeft, UserPlus, Shield, Activity, Star } from "lucide-react";
import { PIPELINE_CONFIG, calcReadiness } from "./sorb-dashboard";

const RANKS = ["PFC","SPC","CPL","SGT","SSG","SFC","MSG","1SG","SGM","WO1","CW2","CW3","CW4","CW5","2LT","1LT","CPT","MAJ"];
const SORB_BASES = [
  "CP FRANK MERRILL","EGLIN AFB DESTIN","FT BENNING","FT BLISS","FT BRAGG","FT CAMPBELL",
  "FT CARSON","FT DRUM","FT HOOD","FT POLK","FT RILEY","FT RUCKER","FT STEWART",
  "JBER","JBLM","MDW","GERMANY","HAWAII","ITALY","KOREA",
];

// GT thresholds and pipeline recommendations
const PIPELINE_GT_REQS: Record<string, number> = {
  "18X": 110, "PSYOP": 110, "160th": 110,
  "Option40": 105, "CA": 105, "Ranger": 105,
};

function recommendPipeline(gt: number): string[] {
  return Object.entries(PIPELINE_GT_REQS)
    .filter(([, min]) => gt >= min)
    .map(([pipe]) => pipe);
}

const empty = {
  rank: "", firstName: "", lastName: "", phone: "", email: "",
  gt: "", mos: "", post: "", unit: "", sorbCo: "",
  pipeline: "",
  logAttempt: "None", contacted: false, status: "prospect",
  runTime2mi: "", ruckTime12mi: "", pushups: "", situps: "", ptScore: "",
  medicalEligible: false, airborneQualified: false, noMoralWaiver: false, priorSOCOM: false,
  notes: "",
};

function SORBIntakeContent() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [submitted, setSubmitted] = useState(false);
  const [customBase, setCustomBase] = useState("");

  const gtNum = form.gt ? Number(form.gt) : 0;
  const recommended = gtNum >= 100 ? recommendPipeline(gtNum) : [];
  const readiness = calcReadiness({
    gt: gtNum || null,
    contacted: form.contacted,
    medicalEligible: form.medicalEligible,
    airborneQualified: form.airborneQualified,
    noMoralWaiver: form.noMoralWaiver,
    priorSOCOM: form.priorSOCOM,
    pipeline: form.pipeline,
    ptScore: form.ptScore ? Number(form.ptScore) : undefined,
  });

  const mut = useMutation({
    mutationFn: async (data: typeof form) => {
      const post = data.post === "_other" ? customBase : data.post;
      const res = await fetch("/api/sorb/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          post,
          gt: data.gt ? Number(data.gt) : null,
          pushups: data.pushups ? Number(data.pushups) : null,
          situps: data.situps ? Number(data.situps) : null,
          ptScore: data.ptScore ? Number(data.ptScore) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/recruits"] });
      qc.invalidateQueries({ queryKey: ["/api/sorb/pipeline-analytics"] });
      setSubmitted(true);
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  const set = (key: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [key]: val }));
  const inp = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });
  const chk = (key: keyof typeof form) => ({
    checked: form[key] as boolean,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.checked })),
  });

  const validate = () => {
    if (!form.lastName.trim()) return "Last name is required.";
    if (form.gt && (Number(form.gt) < 50 || Number(form.gt) > 160)) return "GT score must be between 50–160.";
    return null;
  };

  if (submitted) {
    const displayName = `${form.rank ? form.rank + " " : ""}${form.lastName || "Soldier"}`;
    const pipe = form.pipeline ? PIPELINE_CONFIG[form.pipeline]?.label ?? form.pipeline : null;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-sm border">
          <CardContent className="pt-10 pb-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Lead Added</h2>
            <p className="text-gray-600 text-sm">
              {displayName} has been added to your SORB pipeline.
            </p>
            {pipe && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                <Shield className="w-4 h-4" /> {pipe}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button className="bg-green-700 hover:bg-green-800" onClick={() => { setForm({ ...empty }); setSubmitted(false); }}>
                Add Another
              </Button>
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Add SORB Lead</h1>
            <p className="text-sm text-gray-500">Track a soldier's interest in Special Operations</p>
          </div>
          {/* Live readiness indicator */}
          {readiness > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-500">Readiness</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${readiness >= 70 ? "bg-green-600" : readiness >= 45 ? "bg-yellow-500" : "bg-gray-400"}`}
                    style={{ width: `${readiness}%` }}
                  />
                </div>
                <span className="text-xs font-bold font-mono text-gray-700">{readiness}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Soldier Identity ───────────────────────────────────────── */}
        <form onSubmit={(e) => {
          e.preventDefault();
          const err = validate();
          if (err) { toast({ variant: "destructive", title: "Validation", description: err }); return; }
          mut.mutate(form);
        }}>
          <Card className="border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-green-700" /> Soldier Identity
              </CardTitle>
              <CardDescription>Name, contact, and service info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Rank</Label>
                  <Select value={form.rank} onValueChange={set("rank")}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{RANKS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Last Name <span className="text-red-500">*</span></Label>
                  <Input className="mt-1 h-9" {...inp("lastName")} placeholder="SMITH" required />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">First Name</Label>
                  <Input className="mt-1 h-9" {...inp("firstName")} placeholder="JOHN" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Phone</Label>
                  <Input className="mt-1 h-9" type="tel" {...inp("phone")} placeholder="(555) 000-0000" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Email</Label>
                  <Input className="mt-1 h-9" type="email" {...inp("email")} placeholder="soldier@mail.mil" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Post / Base</Label>
                  <Select value={form.post} onValueChange={set("post")}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select base" /></SelectTrigger>
                    <SelectContent>
                      {SORB_BASES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      <SelectItem value="_other">Other / Enter Manually</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.post === "_other" && (
                    <Input className="mt-1 h-9" placeholder="Enter base name" value={customBase} onChange={(e) => setCustomBase(e.target.value)} />
                  )}
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Unit</Label>
                  <Input className="mt-1 h-9" {...inp("unit")} placeholder="e.g. 1-75 RGR" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Current MOS</Label>
                  <Input className="mt-1 h-9 font-mono uppercase" {...inp("mos")} placeholder="11B" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">SORB Company</Label>
                  <Select value={form.sorbCo} onValueChange={set("sorbCo")}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{["A Co","B Co","C Co","D Co"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Screening Criteria ─────────────────────────────────────── */}
          <Card className="border shadow-sm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-700" /> Screening Criteria
              </CardTitle>
              <CardDescription>Baseline qualifications for Special Operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">GT Score (ASVAB)</Label>
                  <Input className="mt-1 h-9 font-mono" type="number" min={50} max={160} {...inp("gt")} placeholder="105" />
                  {gtNum >= 100 && (
                    <p className={`text-xs mt-1 font-medium ${gtNum >= 110 ? "text-green-700" : "text-yellow-600"}`}>
                      {gtNum >= 110 ? "✓ Qualifies for all pipelines" : "✓ Qualifies for select pipelines"}
                    </p>
                  )}
                  {gtNum > 0 && gtNum < 100 && (
                    <p className="text-xs mt-1 text-red-600">⚠ Below minimum GT threshold (100)</p>
                  )}
                </div>
                <div className="space-y-2 pt-1">
                  {([
                    ["medicalEligible",  "Medical Eligible"],
                    ["airborneQualified","Airborne Qualified"],
                    ["noMoralWaiver",    "No Moral Waiver Needed"],
                    ["priorSOCOM",       "Prior SOCOM Service"],
                  ] as [keyof typeof form, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" {...chk(key)} className="h-4 w-4 rounded text-green-700" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Pipeline recommendation */}
              {recommended.length > 0 && (
                <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs font-semibold text-green-800 mb-2">Recommended Pipelines (GT {gtNum}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recommended.map(pipe => (
                      <button
                        type="button"
                        key={pipe}
                        onClick={() => set("pipeline")(pipe)}
                        className={`px-2 py-0.5 rounded text-xs font-bold border transition-all ${
                          form.pipeline === pipe
                            ? PIPELINE_CONFIG[pipe]?.color ?? "bg-gray-200 text-gray-700 border-gray-300"
                            : "bg-white text-gray-700 border-gray-300 hover:border-green-600"
                        }`}
                      >
                        {pipe}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs uppercase tracking-wide text-gray-500">Selected Pipeline</Label>
                <Select value={form.pipeline} onValueChange={set("pipeline")}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select pipeline" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PIPELINE_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v.label}{v.minGT ? ` (GT ≥ ${v.minGT})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* ── PT Metrics ─────────────────────────────────────────────── */}
          <Card className="border shadow-sm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-700" /> Physical Readiness
              </CardTitle>
              <CardDescription>Run, ruck, and strength metrics for pipeline prep tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">2-Mile Run (mm:ss)</Label>
                  <Input className="mt-1 h-9 font-mono" placeholder="13:45" {...inp("runTime2mi")} />
                  <p className="text-xs text-gray-400 mt-0.5">SFAS target: ≤ 15:12</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">12-Mile Ruck (h:mm)</Label>
                  <Input className="mt-1 h-9 font-mono" placeholder="3:00" {...inp("ruckTime12mi")} />
                  <p className="text-xs text-gray-400 mt-0.5">SFAS target: ≤ 3 hrs w/ 45 lbs</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Push-ups (2 min)</Label>
                  <Input className="mt-1 h-9 font-mono" type="number" {...inp("pushups")} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Sit-ups (2 min)</Label>
                  <Input className="mt-1 h-9 font-mono" type="number" {...inp("situps")} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">APFT / ACFT Score</Label>
                  <Input className="mt-1 h-9 font-mono" type="number" placeholder="270" {...inp("ptScore")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Contact & Status ───────────────────────────────────────── */}
          <Card className="border shadow-sm mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4 text-green-700" /> Contact &amp; Initial Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Log Attempt</Label>
                  <Select value={form.logAttempt} onValueChange={set("logAttempt")}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["None","Email","Text","Phone Call","In Person"].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-gray-500">Pipeline Stage</Label>
                  <Select value={form.status} onValueChange={set("status")}>
                    <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect — Identified</SelectItem>
                      <SelectItem value="screening">Screening — Reviewing criteria</SelectItem>
                      <SelectItem value="recommended">Recommended — Pipeline assigned</SelectItem>
                      <SelectItem value="preparing">Preparing — Active prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...chk("contacted")} className="h-4 w-4 rounded text-green-700" />
                Confirmed successful contact with soldier
              </label>
              <div>
                <Label className="text-xs uppercase tracking-wide text-gray-500">Notes / Next Steps</Label>
                <textarea
                  className="mt-1 w-full h-20 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
                  {...inp("notes")}
                  placeholder="Mentorship notes, prep guidance, PULHES notes, next action…"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-4">
            <Button type="submit" className="bg-green-700 hover:bg-green-800 flex-1" disabled={mut.isPending}>
              {mut.isPending ? "Saving…" : "Add to Pipeline"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SORBIntakePage() {
  return (
    <ProtectedRoute>
      <SORBIntakeContent />
    </ProtectedRoute>
  );
}
