import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { recruits, recruiter as recruiterApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, AlertCircle, User as UserIcon, Globe } from "lucide-react";
import type { User } from "@shared/schema";

// ──────────────────────────────────────────────
// Job category → AI description mapping
// ──────────────────────────────────────────────
const JOB_CATEGORIES = [
  { value: "combat_infantry",     en: "Combat / Infantry",            es: "Combate / Infantería",           ai: "combat infantry frontline soldier field operations" },
  { value: "medical_healthcare",  en: "Medical / Healthcare",         es: "Medicina / Salud",               ai: "military medical healthcare nursing medic 68W" },
  { value: "technology_computers",en: "Technology / Computers / IT",  es: "Tecnología / Computadoras",      ai: "information technology cybersecurity computer networks signals 25 series" },
  { value: "intelligence_cyber",  en: "Intelligence / Cyber",         es: "Inteligencia / Ciber",           ai: "military intelligence cyber operations signals intelligence 35 series" },
  { value: "aviation",            en: "Aviation",                     es: "Aviación",                       ai: "Army aviation helicopter pilot crew 15 series" },
  { value: "engineering",         en: "Engineering / Construction",   es: "Ingeniería / Construcción",      ai: "combat engineer construction sapper bridge 12 series" },
  { value: "mechanics_maintenance",en:"Mechanics / Vehicle Maintenance",es:"Mecánica / Mantenimiento",      ai: "vehicle mechanic maintenance wheeled tracked 91 series" },
  { value: "admin_finance",       en: "Administration / Finance",     es: "Administración / Finanzas",      ai: "Army administration finance HR human resources 42 series" },
  { value: "special_operations",  en: "Special Operations",           es: "Operaciones Especiales",         ai: "special forces ranger airborne 18X Option 40 special operations" },
  { value: "not_sure",            en: "Not sure yet",                 es: "No estoy seguro/a todavía",      ai: "general Army interest exploring options" },
] as const;

// ──────────────────────────────────────────────
// Translations
// ──────────────────────────────────────────────
const T = {
  en: {
    langToggle: "Español",
    pageTitle: "U.S. Army Interest Form",
    pageSubLinked: "🎯 This form is linked to your recruiter",
    pageSubDefault: "Complete this form to learn more about opportunities in the Army",
    sentTo: "Your application will be sent to:",
    whyTitle: "Discover What the U.S. Army Has to Offer",
    benefit1Title: "Education Benefits",
    benefit1Desc: "Over $250,000 in education value through the Post-9/11 GI Bill® — covers 100% tuition, housing allowance, and book stipend.",
    benefit2Title: "Healthcare Coverage",
    benefit2Desc: "Comprehensive medical, dental, and vision coverage through TRICARE for you and your family.",
    benefit3Title: "Career Training & Skills",
    benefit3Desc: "Over 150+ career fields with fully paid training and industry-recognized certifications.",
    benefit4Title: "Pay & Financial Benefits",
    benefit4Desc: "Competitive base pay, housing/food allowances, 30 days paid vacation, enlistment bonuses up to $50,000, and a federal pension after 20 years.",
    ctaText: "⬇️ Fill out the quick form below — no commitment required",
    sectionPersonal: "Quick Contact",
    firstName: "First Name",
    phone: "Phone Number",
    phonePlaceholder: "555-123-4567",
    disclaimer: "Submitting this form does not constitute enlistment or any commitment. A recruiter will reach out to learn more about you.",
    privacyNote: "UNCLASSIFIED — Handled per Army regulations and the Privacy Act of 1974.",
    submitBtn: "Connect With a Recruiter",
    submitting: "Submitting...",
    successTitle: "We'll Be in Touch! 🎖️",
    successDesc: "Thank you for your interest in the U.S. Army",
    successBody: "A recruiter will reach out to you shortly.",
    successLinked: "✅ Your info has been linked to your recruiter",
    required: "*",
  },
  es: {
    langToggle: "English",
    pageTitle: "Formulario de Interés — Ejército de EE.UU.",
    pageSubLinked: "🎯 Este formulario está vinculado a su reclutador",
    pageSubDefault: "Complete este formulario para conectarse con un reclutador",
    sentTo: "Su información será enviada a:",
    whyTitle: "Descubra lo que el Ejército de EE.UU. tiene para ofrecer",
    benefit1Title: "Beneficios Educativos",
    benefit1Desc: "Más de $250,000 en valor educativo a través del GI Bill® — cubre el 100% de la matrícula, vivienda y libros.",
    benefit2Title: "Cobertura de Salud",
    benefit2Desc: "Cobertura médica, dental y de visión completa a través de TRICARE para usted y su familia.",
    benefit3Title: "Capacitación Profesional",
    benefit3Desc: "Más de 150 campos de carrera con capacitación pagada y certificaciones reconocidas por la industria.",
    benefit4Title: "Pago y Beneficios Financieros",
    benefit4Desc: "Salario base competitivo, subsidios de vivienda y comida, 30 días de vacaciones pagadas, bonos de alistamiento de hasta $50,000.",
    ctaText: "⬇️ Complete el formulario rápido — sin compromiso",
    sectionPersonal: "Contacto Rápido",
    firstName: "Nombre",
    phone: "Número de Teléfono",
    phonePlaceholder: "555-123-4567",
    disclaimer: "Enviar este formulario no constituye alistamiento. Un reclutador se comunicará con usted para conocerle mejor.",
    privacyNote: "NO CLASIFICADO — Manejado según las regulaciones del Ejército y la Ley de Privacidad de 1974.",
    submitBtn: "Conectar Con un Reclutador",
    submitting: "Enviando...",
    successTitle: "¡Nos pondremos en contacto! 🎖️",
    successDesc: "Gracias por su interés en el Ejército de EE.UU.",
    successBody: "Un reclutador se comunicará con usted en breve.",
    successLinked: "✅ Su información ha sido vinculada a su reclutador",
    required: "*",
  },
} as const;

type Lang = "en" | "es";

export default function ApplyPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<Lang>("en");
  const t = T[lang];

  const [recruiterCode, setRecruiterCode] = useState<string | null>(null);
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setRecruiterCode(params.get("r"));
    } catch {
      setRecruiterCode(null);
    }
  }, [location]);

  const [recruiterInfo, setRecruiterInfo] = useState<Partial<User> | null>(null);
  const scanTracked = useRef(false);

  useEffect(() => {
    if (recruiterCode && !scanTracked.current) {
      scanTracked.current = true;
      fetch("/api/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: recruiterCode, scanType: "application" }),
      }).catch(() => {});
      recruiterApi.getByQRCode(recruiterCode)
        .then((d) => setRecruiterInfo(d.recruiter))
        .catch(() => setRecruiterInfo(null));
    }
  }, [recruiterCode]);

  const [formData, setFormData] = useState({
    firstName: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: "—",          // placeholder — not collected at this stage
        phone: formData.phone.trim(),
        recruiterCode: recruiterCode || undefined,
      };

      await recruits.create(payload as any);
      queryClient.invalidateQueries({ queryKey: ["/recruiter/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recruits"] });
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">{t.successTitle}</CardTitle>
            <CardDescription>{t.successDesc}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">{t.successBody}</p>
            {recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-left">
                <p className="text-sm font-semibold text-green-800 mb-2">✅ {t.sentTo}</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p className="font-medium">{recruiterInfo.fullName}</p>
                  {recruiterInfo.rank && <p className="text-xs">{recruiterInfo.rank}</p>}
                  {recruiterInfo.phoneNumber && (
                    <p className="text-xs mt-2">📞 {recruiterInfo.phoneNumber}</p>
                  )}
                </div>
              </div>
            )}
            {recruiterCode && !recruiterInfo && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">{t.successLinked}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">

        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
          >
            <Globe className="w-4 h-4" />
            {t.langToggle}
          </Button>
        </div>

        {/* Recruiter card */}
        {recruiterInfo && (
          <Card className="mb-5 bg-green-50 border border-green-200">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-green-900 mb-3 text-center">{t.sentTo}</p>
              <div className="flex items-center gap-4">
                {recruiterInfo.profilePicture ? (
                  <img
                    src={recruiterInfo.profilePicture}
                    alt={recruiterInfo.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-green-600 shadow flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-600 shadow flex-shrink-0">
                    <UserIcon className="w-8 h-8 text-green-600" />
                  </div>
                )}
                <div className="flex-1 space-y-0.5">
                  {recruiterInfo.rank && (
                    <p className="text-xs font-bold text-green-900">
                      {ARMY_RANKS.find((r) => r.value === recruiterInfo.rank)?.label ?? recruiterInfo.rank}
                    </p>
                  )}
                  {recruiterInfo.fullName && (
                    <p className="text-base font-bold text-green-900">
                      {recruiterInfo.fullName.split(" ").pop()}
                    </p>
                  )}
                  {recruiterInfo.phoneNumber && (
                    <a href={`tel:${recruiterInfo.phoneNumber}`} className="text-sm text-green-700 hover:underline">
                      📞 {recruiterInfo.phoneNumber}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits card */}
        <Card className="mb-5 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-green-900 text-center flex items-center justify-center gap-2">
              <span className="text-xl">🇺🇸</span>
              {t.whyTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: "🎓", title: t.benefit1Title, desc: t.benefit1Desc },
                { icon: "🏥", title: t.benefit2Title, desc: t.benefit2Desc },
                { icon: "💼", title: t.benefit3Title, desc: t.benefit3Desc },
                { icon: "💰", title: t.benefit4Title, desc: t.benefit4Desc },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white rounded-lg p-3 shadow-sm border border-green-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <div>
                      <h4 className="font-bold text-green-900 text-sm mb-0.5">{title}</h4>
                      <p className="text-xs text-gray-700">{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-green-900 text-center mt-3">{t.ctaText}</p>
          </CardContent>
        </Card>

        {/* Main form */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800">{t.pageTitle}</CardTitle>
            <CardDescription>
              {recruiterCode ? t.pageSubLinked : t.pageSubDefault}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                {t.sectionPersonal}
              </h3>

              {/* First Name */}
              <div className="space-y-1">
                <Label htmlFor="firstName">
                  {t.firstName} <span className="text-red-500">{t.required}</span>
                </Label>
                <Input
                  id="firstName"
                  required
                  autoComplete="given-name"
                  className="text-base py-5"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <Label htmlFor="phone">
                  {t.phone} <span className="text-red-500">{t.required}</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={t.phonePlaceholder}
                  className="text-base py-5"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>UNCLASSIFIED</strong> — {t.privacyNote}
              </div>
            </CardContent>

            <div className="px-6 pb-6">
              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 py-6 text-base font-semibold"
                disabled={loading}
              >
                {loading ? t.submitting : t.submitBtn}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
