import { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const prevPathnameRef = useRef(pathname);

  // Helper to scroll to section with fixed header offset (80px)
  const scrollToSection = (sectionId: string, smooth = true): boolean => {
    const el = document.getElementById(sectionId);
    if (el) {
      const navOffset = 80;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: smooth ? 'smooth' : 'auto'
      });
      return true;
    }
    return false;
  };

  // 1. Scroll Position Restoration & Route Transition Handling
  useEffect(() => {
    // Check if an explicit restore target was requested (e.g., from clicking "Back")
    const rawTarget = sessionStorage.getItem('espa_restore_target');
    let restoreTarget: { path?: string; section?: string; scrollY?: number } | null = null;
    if (rawTarget) {
      try {
        restoreTarget = JSON.parse(rawTarget);
      } catch (e) {
        // Ignore parse error
      }
    }

    const isBackNav = navigationType === 'POP' || Boolean(restoreTarget);

    if (hash) {
      // If there is an explicit hash in URL
      const cleanHash = hash.replace(/^#/, '');
      const scrollAttempt = () => {
        if (!scrollToSection(cleanHash, true)) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      };
      requestAnimationFrame(scrollAttempt);
      setTimeout(scrollAttempt, 60);
      setTimeout(scrollAttempt, 200);
      if (rawTarget) sessionStorage.removeItem('espa_restore_target');
      prevPathnameRef.current = pathname;
      return;
    }

    if (isBackNav) {
      // Check for explicit restore target section or saved scroll position
      const targetSection = restoreTarget?.section || sessionStorage.getItem(`espa_last_section_${pathname}`) || sessionStorage.getItem('espa_last_section');
      const savedYStr = sessionStorage.getItem(`espa_scroll_${pathname}`);
      const targetY = typeof restoreTarget?.scrollY === 'number' 
        ? restoreTarget.scrollY 
        : (savedYStr ? parseInt(savedYStr, 10) : undefined);

      if (rawTarget) {
        sessionStorage.removeItem('espa_restore_target');
      }

      const attemptRestore = () => {
        if (targetSection && scrollToSection(targetSection, false)) {
          return true;
        }
        if (typeof targetY === 'number' && !isNaN(targetY) && targetY > 0) {
          window.scrollTo({ top: targetY, behavior: 'auto' });
          return true;
        }
        return false;
      };

      // Attempt immediately and across rendering frames
      attemptRestore();
      requestAnimationFrame(attemptRestore);
      setTimeout(attemptRestore, 50);
      setTimeout(attemptRestore, 150);
      setTimeout(attemptRestore, 300);

      prevPathnameRef.current = pathname;
      return;
    }

    // Standard forward navigation -> scroll to top
    window.scrollTo(0, 0);
    prevPathnameRef.current = pathname;
  }, [pathname, hash, navigationType]);

  // 2. Track scroll position and visible section on the current page
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      // Toggle floating scroll-to-top button
      if (window.scrollY > window.innerHeight * 0.8) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          try {
            sessionStorage.setItem(`espa_scroll_${pathname}`, window.scrollY.toString());

            // If on home page, determine the section currently in view
            if (pathname === '/') {
              const knownSections = ['faq', 'get-involved', 'team', 'programs', 'about', 'join-mission'];
              for (const secId of knownSections) {
                const el = document.getElementById(secId);
                if (el) {
                  const rect = el.getBoundingClientRect();
                  if (rect.top <= window.innerHeight * 0.6 && rect.bottom >= 120) {
                    sessionStorage.setItem('espa_last_section', secId);
                    sessionStorage.setItem(`espa_last_section_${pathname}`, secId);
                    break;
                  }
                }
              }
            }
          } catch (e) {
            // Ignore sessionStorage errors
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[100] p-3 bg-[#003828]/60 backdrop-blur-md text-white rounded-full hover:bg-[#003828] transition-colors border border-white/10 shadow-lg flex items-center justify-center cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </>
  );
}
