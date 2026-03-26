import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { recruiter as recruiterApi } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { User as UserIcon, Globe } from "lucide-react";
import type { User } from "@shared/schema";
import { ARMY_RANKS } from "@shared/constants";

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
    benefit1Desc: "Over $300,000 in education value through the Post-9/11 GI Bill® — covers 100% tuition, housing allowance, and book stipend.",
    benefit2Title: "Healthcare Coverage",
    benefit2Desc: "Comprehensive medical, dental, and vision coverage through TRICARE for you and your family.",
    benefit3Title: "Career Training & Skills",
    benefit3Desc: "Over 150+ career fields with fully paid training and industry-recognized certifications.",
    benefit4Title: "Pay & Financial Benefits",
    benefit4Desc: "Competitive base pay, housing/food allowances, 30 days paid vacation, enlistment bonuses up to $50,000, and a federal pension after 20 years.",
    privacyNote: "No personally identifiable information (PII) is collected through this form.",
  },
  es: {
    langToggle: "English",
    pageTitle: "Formulario de Interés — Ejército de EE.UU.",
    pageSubLinked: "🎯 Este formulario está vinculado a su reclutador",
    pageSubDefault: "Complete este formulario para conectarse con un reclutador",
    sentTo: "Su información será enviada a:",
    whyTitle: "Descubra lo que el Ejército de EE.UU. tiene para ofrecer",
    benefit1Title: "Beneficios Educativos",
    benefit1Desc: "Más de $300,000 en valor educativo a través del GI Bill® — cubre el 100% de la matrícula, vivienda y libros.",
    benefit2Title: "Cobertura de Salud",
    benefit2Desc: "Cobertura médica, dental y de visión completa a través de TRICARE para usted y su familia.",
    benefit3Title: "Capacitación Profesional",
    benefit3Desc: "Más de 150 campos de carrera con capacitación pagada y certificaciones reconocidas por la industria.",
    benefit4Title: "Pago y Beneficios Financieros",
    benefit4Desc: "Salario base competitivo, subsidios de vivienda y comida, 30 días de vacaciones pagadas, bonos de alistamiento de hasta $50,000.",
    privacyNote: "No se recopila información de identificación personal (PII) a través de este formulario.",
  },
} as const;

type Lang = "en" | "es";

export default function ApplyPage() {
  const [location] = useLocation();
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
          </CardContent>
        </Card>

        {/* Privacy note */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded text-center">
          <strong>UNCLASSIFIED</strong> — {t.privacyNote}
        </div>
      </div>
    </div>
  );
}
