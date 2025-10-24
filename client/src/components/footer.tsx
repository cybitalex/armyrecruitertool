import { Shield } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-army-black border-t border-army-field01 py-4 md:py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Classification Banner */}
          <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-md border border-green-700">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-mono text-xs md:text-sm font-bold">
              UNCLASSIFIED
            </span>
          </div>

          {/* Developer Attribution */}
          <div className="text-center">
            <p className="text-army-tan text-xs md:text-sm">
              Developed by{" "}
              <span className="font-bold text-army-gold">
                SGT Alex Moran
              </span>
            </p>
            <p className="text-army-tan/70 text-xs">
              CEO, <span className="font-semibold">CyBit Devs</span>
            </p>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-army-tan/80 text-xs">
              © {currentYear} CyBit Devs
            </p>
            <p className="text-army-tan/60 text-xs">
              All Rights Reserved
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 pt-4 border-t border-army-field01/30">
          <p className="text-center text-army-tan/50 text-xs">
            <Shield className="w-3 h-3 inline mr-1" />
            For Official Use Only - NIPR Compliant Security Standards
          </p>
          <p className="text-center text-army-tan/40 text-xs mt-1">
            This system is for authorized US Army recruiting personnel only
          </p>
        </div>
      </div>
    </footer>
  );
}

