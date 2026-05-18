"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia("(display-mode: standalone)").matches || 
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. Detect if user is on iOS device (iPhone/iPad/iPod)
    const checkIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
        (navigator.maxTouchPoints > 0 && /macintosh/.test(userAgent)); // iPadOS 13+
      setIsIos(isIosDevice);
    };

    checkIos();

    // 3. Listen for the beforeinstallprompt event (Android / Desktop Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Listen for the appinstalled event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      // Trigger the gorgeous iOS instruction bottom-sheet
      setShowIosInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    // Show the browser's install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // Show the install button if the app is not already running standalone, AND
  // either the browser prompt is available or the user is on an iOS device.
  const shouldShowButton = !isStandalone && (isInstallable || isIos);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/5 h-14">
        <div className="mx-auto flex h-full max-w-[480px] items-center justify-between px-4">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
              {/* Micro-volleyball neon logo */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-5 w-5 text-primary">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" />
                <path d="M 15 35 C 35 45, 65 45, 85 35" fill="none" stroke="#f97316" strokeWidth="6" />
                <path d="M 15 65 C 35 55, 65 55, 85 65" fill="none" stroke="#f97316" strokeWidth="6" />
                <path d="M 50 5 C 55 35, 55 65, 50 95" fill="none" stroke="currentColor" strokeWidth="6" />
              </svg>
              {/* Pulse animation dot */}
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-secondary animate-pulse" />
            </div>
            <span className="text-sm font-black tracking-wider uppercase text-white">
              Penalty <span className="text-primary">App</span>
            </span>
          </Link>

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Live Scoreboard Link */}
            <Link
              href="/score"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-white/80 hover:text-white hover:bg-white/[0.08] active:scale-90 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              title="Live Scoreboard"
            >
              <span className="text-sm">🏐</span>
            </Link>

            {/* Download Button */}
            {shouldShowButton ? (
              <button
                onClick={handleInstallClick}
                className="relative flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/25 px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.1)] active:scale-95 transition-all duration-300 hover:from-primary/20 hover:to-secondary/20 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] animate-[bounce-subtle_2s_infinite]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary animate-pulse">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                <span>Download</span>
              </button>
            ) : (
              /* Subtle decorative badge indicating PWA is running locally */
              <div className="flex items-center gap-1 border border-green-500/20 bg-green-500/10 px-2 py-1 rounded-xl text-[9px] font-bold text-green-400 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>PWA</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* iOS Safari Custom Instructions Modal */}
      {showIosInstructions && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-xs px-4 transition-opacity duration-300"
          onClick={() => setShowIosInstructions(false)}
        >
          <div 
            className="w-full max-w-[480px] rounded-t-3xl border-t border-white/10 bg-[#161b22]/95 px-6 pb-10 pt-6 shadow-2xl backdrop-blur-md animate-[slide-up_0.3s_cubic-bezier(0.16,1,0.3,1)] flex flex-col space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle/Indicator */}
            <div className="mx-auto h-1.5 w-12 rounded-full bg-white/10" />

            {/* Header */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-white">Install Penalty Tracker</h3>
              <p className="text-xs text-muted">Add this app to your home screen for rapid loading, offline access, and a native app experience.</p>
            </div>

            {/* Steps Container */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-3.5 border border-white/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <span className="text-base font-extrabold">1</span>
                </div>
                <div className="text-sm font-semibold text-white/90 flex-grow leading-relaxed">
                  Tap the <span className="inline-flex items-center justify-center px-1.5 py-1 mx-1 rounded-lg bg-white/5 border border-white/10 align-middle"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg></span> (Share) button in the browser bar.
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-3.5 border border-white/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 border border-secondary/20 text-secondary">
                  <span className="text-base font-extrabold">2</span>
                </div>
                <div className="text-sm font-semibold text-white/90 flex-grow leading-relaxed">
                  Scroll down the share menu and select <span className="text-secondary font-extrabold">"Add to Home Screen"</span>.
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-center gap-4 rounded-2xl bg-white/[0.02] p-3.5 border border-white/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">
                  <span className="text-base font-extrabold">3</span>
                </div>
                <div className="text-sm font-semibold text-white/90 flex-grow leading-relaxed">
                  Tap <span className="text-green-400 font-extrabold">"Add"</span> in the top-right corner to complete installation.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowIosInstructions(false)}
                className="w-full rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-3 text-sm font-bold text-white transition-all active:scale-95 cursor-pointer text-center"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
