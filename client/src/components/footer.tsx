import { Shield, FlaskConical } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-army-black border-t border-army-field01 mt-auto">
      {/* Pilot / Evaluation Notice Bar */}
      <div className="bg-amber-700/90 w-full">
        <div className="container mx-auto px-4 py-1.5 text-center">
          <p className="text-white text-[11px] font-semibold tracking-wide flex items-center justify-center gap-1.5">
            <FlaskConical className="w-3 h-3 flex-shrink-0" />
            PILOT EVALUATION PLATFORM — For testing &amp; evaluation purposes only. Not an official U.S. Army or USAREC system.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Developer Attribution */}
          <div className="text-center md:text-left">
            <p className="text-army-tan text-xs md:text-sm font-semibold">
              Developed by{" "}
              <span className="font-bold text-army-gold">CyBit Devs</span>
            </p>
            <p className="text-army-tan/60 text-[10px] mt-0.5">
              Privately owned &amp; operated — not government property
            </p>
          </div>

          {/* Security + Eval Notice */}
          <div className="text-center">
            <p className="text-army-tan/70 text-xs">
              <Shield className="w-3 h-3 inline mr-1" />
              UNCLASSIFIED — Security Best Practices Implemented
            </p>
            <p className="text-amber-400/80 text-xs mt-1 font-medium">
              Pilot use only · Feedback welcome
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-army-tan/80 text-xs font-semibold">
              © {currentYear} CyBit Devs
            </p>
            <p className="text-army-tan/60 text-xs">All Rights Reserved</p>
            <p className="text-army-tan/50 text-[10px] mt-0.5">
              Proprietary &amp; Confidential
            </p>
          </div>
        </div>
      </div>

      {/* DoD-Style Classification Banner */}
      <div className="bg-[#006400] w-full">
        <div className="w-full px-3 md:px-6 py-1.5 flex items-center justify-between">
          <div className="flex-1 text-left">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              CyBit Devs | Pilot Platform
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="font-mono font-bold text-sm md:text-base text-white uppercase tracking-wider">
              UNCLASSIFIED
            </span>
          </div>
          <div className="flex-1 text-right">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              EVAL USE ONLY
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
