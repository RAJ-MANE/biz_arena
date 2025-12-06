import { useEffect } from 'react';

interface SecurityGuardProps {
  userType: 'judge' | 'admin';
  allowedPaths?: string[];
}

export function SecurityGuard({ userType, allowedPaths = [] }: SecurityGuardProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Define default allowed paths based on user type
    const defaultAllowedPaths = {
      judge: ['/scoreboard', '/judge'],
      admin: ['/scoreboard', '/admin', '/dashboard']
    };

    const combinedAllowedPaths = [
      ...defaultAllowedPaths[userType],
      ...allowedPaths,
      '/api/', // Always allow API calls
      '/_next/', // Always allow Next.js internals
    ];

    // Block direct navigation attempts
    const blockUnauthorizedNavigation = (e: BeforeUnloadEvent) => {
      const currentPath = window.location.pathname;
      if (!combinedAllowedPaths.some(path => currentPath.startsWith(path))) {
        e.preventDefault();
        window.location.href = '/scoreboard';
      }
    };

    // Block back/forward navigation
    const handlePopState = (e: PopStateEvent) => {
      const currentPath = window.location.pathname;
      if (!combinedAllowedPaths.some(path => currentPath.startsWith(path))) {
        e.preventDefault();
        window.history.pushState(null, '', '/scoreboard');
        window.location.href = '/scoreboard';
      }
    };

    // Prevent opening new tabs/windows to unauthorized URLs
    const blockWindowOpen = () => {
      const originalOpen = window.open;
      window.open = function(url?: string | URL, target?: string, features?: string) {
        if (url && typeof url === 'string') {
          const urlPath = new URL(url, window.location.origin).pathname;
          if (!combinedAllowedPaths.some(path => urlPath.startsWith(path))) {
            console.warn('Unauthorized navigation attempt blocked:', url);
            return null;
          }
        }
        return originalOpen.call(window, url, target, features);
      };
    };

    // Apply security measures
    window.addEventListener('beforeunload', blockUnauthorizedNavigation);
    window.addEventListener('popstate', handlePopState);
    blockWindowOpen();

    // Security cleanup
    return () => {
      window.removeEventListener('beforeunload', blockUnauthorizedNavigation);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [userType, allowedPaths]);

  return null; // This component doesn't render anything
}

// Anti-cheat measures
export function AntiCheatMeasures() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Disable right-click context menu
    const disableRightClick = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable common keyboard shortcuts for developer tools
    const disableDevTools = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection for sensitive content
    const disableSelection = () => {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    };

    // Apply anti-cheat measures
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', disableDevTools);
    disableSelection();

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', disableDevTools);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  return null;
}