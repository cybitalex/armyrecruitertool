import { Shield } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-army-black border-t border-army-field01 mt-auto">
      {/* Content Section */}
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Developer Attribution */}
          <div className="text-center md:text-left">
            <p className="text-army-tan text-xs md:text-sm">
              Developed by{" "}
              <span className="font-bold text-army-gold">SGT Alex Moran</span>
            </p>
            <p className="text-army-tan/70 text-xs">
              CEO, <span className="font-semibold">CyBit Devs</span>
            </p>
          </div>

          {/* Security Notice */}
          <div className="text-center">
            <p className="text-army-tan/70 text-xs">
              <Shield className="w-3 h-3 inline mr-1" />
              For Official Use Only - NIPR Compliant
            </p>
            <p className="text-army-tan/60 text-xs mt-1">
              Authorized US Army Personnel Only
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-army-tan/80 text-xs">
              © {currentYear} CyBit Devs
            </p>
            <p className="text-army-tan/60 text-xs">All Rights Reserved</p>
          </div>
        </div>
      </div>

      {/* DoD-Style Classification Banner */}
      <div className="bg-[#006400] w-full">
        <div className="w-full px-3 md:px-6 py-1.5 flex items-center justify-between">
          <div className="flex-1 text-left">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              Army Recruiting Tool | CyBit Devs
            </span>
          </div>
          <div className="flex-1 text-center">
            <span className="font-mono font-bold text-sm md:text-base text-white uppercase tracking-wider">
              UNCLASSIFIED
            </span>
          </div>
          <div className="flex-1 text-right">
            <span className="font-mono text-[10px] md:text-xs text-white/90 uppercase tracking-wide">
              FPCON NORMAL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
