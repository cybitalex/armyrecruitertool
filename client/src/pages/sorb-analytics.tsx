/**
 * SORB Analytics — Special Operations Recruiting Battalion
 * Quality-based filtering pipeline: Prospect → Screening → Recommended → Preparing → Contracting
 */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { sorb } from "@/lib/api";
import { ProtectedRoute } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip,
  PieChart, Pie, Legend,
} from "recharts";
import { Filter, Users, TrendingUp, Award, QrCode } from "lucide-react";

// ── Station display map ─────────────────────────────────────────────────────
const STATION_DISPLAY: Record<string, string> = {
  "FT BENNING": "TM Benning", "FT RUCKER": "TM Rucker", "EGLIN AFB DESTIN": "TM Eglin",
  "CP FRANK MERRILL": "TM Merrill", "FT BRAGG": "TM Bragg", "FT BLISS": "TM Bliss",
  "FT CAMPBELL": "TM Campbell", "FT CARSON": "TM Carson", "FT DRUM": "TM Drum",
  "FT HOOD": "TM Hood", "FT POLK": "TM Polk", "FT RILEY": "TM Riley",
  "FT STEWART": "TM Stewart", "JBER": "TM JBER", "JBLM": "TM JBLM",
  "MDW": "TM MDW", "GERMANY": "TM Germany", "HAWAII": "TM Hawaii",
  "ITALY": "TM Italy", "KOREA": "TM Korea",
};

// ── Pipeline colours ────────────────────────────────────────────────────────
const PIPELINE_COLORS: Record<string, string> = {
  "18X": "#15803d", "Option40": "#ca8a04", "CA": "#2563eb",
  "PSYOP": "#7c3aed", "160th": "#b91c1c", "Ranger": "#ea580c", "Unknown": "#9ca3af",
};

// ── Stage funnel colours ────────────────────────────────────────────────────
const STAGE_COLORS = ["#1e3a8a","#1d4ed8","#2563eb","#3b82f6","#60a5fa","#93c5fd","#dc2626"];

const STAGE_DESCRIPTIONS: Record<string, string> = {
  prospect:    "Initial identification — soldier flagged as potential SOCOM candidate",
  screening:   "Baseline criteria review — GT, physical, medical, moral waiver check",
  recommended: "Pipeline assigned — specific program (18X, Option 40, CA, PSYOP) selected",
  preparing:   "Active preparation — mentorship, PT improvement, readiness tracking",
  contracting: "Coordinating contract — ready to enlist on SOCOM-specific contract",
  contracted:  "Contracted & shipped — soldier enlisted with Special Operations contract",
  declined:    "Did not qualify or opted out of Special Operations pipeline",
};

const DEFAULT_SORB_COS = ["A Co", "B Co", "C Co", "D Co"];
const DEFAULT_LOG_ATTEMPTS = ["Email", "Text", "Phone Call", "In Person"];

// ── Main analytics ──────────────────────────────────────────────────────────

function SORBAnalyticsContent() {
  const [stationFilter, setStationFilter]     = useState<string[]>([]);
  const [sorbCoFilter, setSorbCoFilter]       = useState<string[]>([]);
  const [logAttemptFilter, setLogAttemptFilter] = useState<string[]>([]);
  const [gtMin, setGtMin] = useState("");
  const [gtMax, setGtMax] = useState("");

  const excelFilters = useMemo(() => {
    const f: { station?: string[]; sorbCo?: string[]; logAttempt?: string[]; gtMin?: number; gtMax?: number } = {};
    if (stationFilter.length) f.station = stationFilter;
    if (sorbCoFilter.length) f.sorbCo = sorbCoFilter;
    if (logAttemptFilter.length) f.logAttempt = logAttemptFilter;
    const gMin = parseInt(gtMin, 10); const gMax = parseInt(gtMax, 10);
    if (!isNaN(gMin)) f.gtMin = gMin;
    if (!isNaN(gMax)) f.gtMax = gMax;
    return Object.keys(f).length ? f : undefined;
  }, [stationFilter, sorbCoFilter, logAttemptFilter, gtMin, gtMax]);

  // Filtered QM analytics (DB-backed)
  const { data: excelData, isLoading: excelLoading } = useQuery({
    queryKey: ["/api/sorb/analytics", excelFilters],
    queryFn: () => sorb.getAnalytics(excelFilters),
    // Keep prior filter metadata visible while refetching, so checkboxes don't disappear.
    placeholderData: (previousData) => previousData,
  });

  // DB-based pipeline analytics (live recruiter activity)
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ["/api/sorb/pipeline-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/sorb/pipeline-analytics", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{
        total: number; avgGT: number; gtQualified: number; gtHighQual: number;
        stageFunnel: { stage: string; label: string; count: number; percent: number }[];
        pipelineBreakdown: { pipeline: string; count: number }[];
        topPosts: { post: string; count: number }[];
      }>;
    },
  });

  const toggle = (arr: string[], set: (v: string[]) => void) => (val: string) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const excelChart = useMemo(() => excelData?.funnel?.map((s) => ({
    name: s.label, count: s.count, percent: s.percent,
  })) ?? [], [excelData]);

  const pipelineChart = useMemo(() =>
    (pipelineData?.pipelineBreakdown ?? []).map(p => ({
      name: p.pipeline, value: p.count,
      color: PIPELINE_COLORS[p.pipeline] ?? "#9ca3af",
    })),
  [pipelineData]);

  const stageChart = useMemo(() =>
    (pipelineData?.stageFunnel ?? []).filter(s => s.stage !== "declined"),
  [pipelineData]);

  const stationOptions = useMemo(
    () => (excelData?.stations?.length ? excelData.stations : Object.keys(STATION_DISPLAY).sort()),
    [excelData]
  );
  const sorbCoOptions = useMemo(
    () => (excelData?.sorbCompanies?.length ? excelData.sorbCompanies : DEFAULT_SORB_COS),
    [excelData]
  );
  const logAttemptOptions = useMemo(
    () => (excelData?.logAttemptTypes?.length ? excelData.logAttemptTypes : DEFAULT_LOG_ATTEMPTS),
    [excelData]
  );

  const formatNum = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">SORB Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            U.S. Army Special Operations Recruiting Battalion — Quality-based pipeline tracking
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Top KPIs from DB ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total QM (DB)",
              value: pipelineLoading ? "…" : (pipelineData?.total ?? 0),
              icon: Users,
              sub: "Soldiers in pipeline",
              color: "text-gray-700",
            },
            {
              label: "Avg GT Score",
              value: pipelineLoading ? "…" : (pipelineData?.avgGT ?? "—"),
              icon: Award,
              sub: "Among tracked leads",
              color: "text-blue-700",
            },
            {
              label: "GT ≥ 105",
              value: pipelineLoading ? "…" : (pipelineData?.gtQualified ?? 0),
              icon: TrendingUp,
              sub: "Pipeline-qualified",
              color: "text-green-700",
            },
            {
              label: "GT ≥ 110",
              value: pipelineLoading ? "…" : (pipelineData?.gtHighQual ?? 0),
              icon: Award,
              sub: "High-tier (18X / PSYOP / 160th)",
              color: "text-emerald-700",
            },
          ].map(({ label, value, icon: Icon, sub, color }) => (
            <Card key={label} className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                  </div>
                  <Icon className={`w-7 h-7 ${color} opacity-70 mt-1`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── DB Pipeline Stage Funnel ──────────────────────────────── */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">SORB Pipeline Stages</CardTitle>
            <p className="text-xs text-gray-500">
              Prospect → Screening → Recommended → Preparing → Contracting → Contracted
            </p>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <div className="h-56 flex items-center justify-center text-gray-400">Loading pipeline data…</div>
            ) : stageChart.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400">No pipeline data — add leads to track stages.</div>
            ) : (
              <div className="space-y-3">
                {stageChart.map((s, i) => (
                  <div key={s.stage} className="flex items-center gap-3">
                    <div className="w-28 text-right">
                      <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center pl-2 text-white text-[10px] font-bold transition-all"
                        style={{
                          width: `${Math.max(s.percent, s.count > 0 ? 5 : 0)}%`,
                          backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length],
                          minWidth: s.count > 0 ? "2rem" : 0,
                        }}
                      >
                        {s.count > 0 ? s.count : ""}
                      </div>
                    </div>
                    <span className="w-10 text-xs text-gray-500 font-mono">{s.percent}%</span>
                  </div>
                ))}
                <div className="mt-4 space-y-1">
                  {stageChart.filter(s => s.count > 0).map(s => (
                    <p key={s.stage} className="text-xs text-gray-400">
                      <span className="font-semibold text-gray-600">{s.label}:</span>{" "}
                      {STAGE_DESCRIPTIONS[s.stage] ?? ""}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Pipeline Breakdown (Pie) ──────────────────────────── */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Pipeline Distribution</CardTitle>
              <p className="text-xs text-gray-500">Candidates by Special Operations program</p>
            </CardHeader>
            <CardContent>
              {pipelineChart.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-gray-400 text-sm">
                  Assign pipeline programs to leads to see distribution.
                </div>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Pie
                        data={pipelineChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={78}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {pipelineChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {pipelineChart.map(p => (
                  <span key={p.name} className="flex items-center gap-1 text-xs text-gray-600">
                    <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.name} ({p.value})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Top Posts ─────────────────────────────────────────── */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Top Recruiting Posts</CardTitle>
              <p className="text-xs text-gray-500">Most leads by installation</p>
            </CardHeader>
            <CardContent>
              {(pipelineData?.topPosts ?? []).length === 0 ? (
                <div className="h-44 flex items-center justify-center text-gray-400 text-sm">No post data yet.</div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pipelineData?.topPosts?.slice(0, 8) ?? []}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
                    >
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="post"
                        width={115}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: string) =>
                          STATION_DISPLAY[v.toUpperCase()] ?? (v.length > 14 ? v.slice(0, 14) + "…" : v)
                        }
                      />
                      <Tooltip />
                      <Bar dataKey="count" fill="#15803d" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Excel Raw Data Funnel + Filters ─────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Filters sidebar */}
          <div className="lg:w-56 flex-shrink-0 space-y-3">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Excel Data Filters
                </CardTitle>
                <p className="text-xs text-gray-400">Filters QM data from uploaded spreadsheet</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-600">SORB CO</Label>
                  <div className="mt-2 space-y-1.5">
                    {sorbCoOptions.map((c) => (
                      <label key={c} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={sorbCoFilter.includes(c)} onCheckedChange={() => toggle(sorbCoFilter, setSorbCoFilter)(c)} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Station</Label>
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {stationOptions.map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={stationFilter.includes(s)} onCheckedChange={() => toggle(stationFilter, setStationFilter)(s)} />
                        {STATION_DISPLAY[s.toUpperCase()] ?? s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">Log Attempt</Label>
                  <div className="mt-2 space-y-1.5">
                    {logAttemptOptions.map((a) => (
                      <label key={a} className="flex items-center gap-2 cursor-pointer text-sm">
                        <Checkbox checked={logAttemptFilter.includes(a)} onCheckedChange={() => toggle(logAttemptFilter, setLogAttemptFilter)(a)} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-600">GT Score Range</Label>
                  <div className="mt-2 flex gap-2">
                    <input type="number" placeholder="Min" value={gtMin} onChange={(e) => setGtMin(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border rounded" min={40} max={170} />
                    <input type="number" placeholder="Max" value={gtMax} onChange={(e) => setGtMax(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border rounded" min={40} max={170} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Excel funnel chart */}
          <div className="flex-1 space-y-4">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">QM Data Overview (Excel Import)</CardTitle>
                <p className="text-xs text-gray-500">Total QM pool from uploaded spreadsheet data</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-700">{excelLoading ? "…" : excelData?.totalQM ?? 0}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Total QM</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{excelLoading ? "…" : formatNum(excelData?.totalLeadsAttempted ?? 0)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Leads Attempted</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-2xl font-bold text-blue-600">{excelLoading ? "…" : formatNum(excelData?.totalContacts ?? 0)}</p>
                    <p className="text-xs text-gray-600 mt-0.5">Contacted</p>
                  </div>
                </div>
                {excelLoading ? (
                  <div className="h-56 flex items-center justify-center text-gray-400">Loading…</div>
                ) : excelChart.length === 0 ? (
                  <div className="h-56 flex items-center justify-center text-gray-400">No data</div>
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={excelChart} layout="vertical" margin={{ top: 5, right: 30, left: 160, bottom: 5 }}>
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={155} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [v, "Count"]} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                          {excelChart.map((_, i) => (
                            <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">% Attempted</p>
                      <p className="text-2xl font-bold text-blue-700">{(excelData?.percentAttempted ?? 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">% Contacted</p>
                      <p className="text-2xl font-bold text-blue-600">{(excelData?.percentContacted ?? 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Appts Made</p>
                      <p className="text-2xl font-bold text-green-700">{excelData?.appointmentsMade ?? 0}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <QrCode className="w-5 h-5 mx-auto mb-1 opacity-40" />
                    QR scans tracked<br />in My QR Codes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SORBAnalyticsPage() {
  return (
    <ProtectedRoute>
      <SORBAnalyticsContent />
    </ProtectedRoute>
  );
}
