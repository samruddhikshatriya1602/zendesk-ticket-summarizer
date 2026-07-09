// AppShell.tsx — outer layout frame for every page (mounted by App.tsx parent route).
// Keeps the top bar fixed; child routes (e.g. TicketsWorkspace) render inside <Outlet />.

import { Outlet } from 'react-router-dom';
import { SkipLink } from '../shared/SkipLink';
import {
  TopbarAsideName,
  TopbarEyebrow,
  TopbarSubtitle,
  TopbarTitle,
} from './AppTopbarTypography';

export function AppShell() {
  return (
    <div className="app-shell">
      {/* Keyboard users: Tab to reveal, Enter jumps past header to main content. */}
      <SkipLink />

      {/* Top bar — branding (left) + workspace label (right). Stays visible on all routes. */}
      <header className="app-topbar" role="banner">
        <div className="app-topbar-inner">
          <div className="app-brand">
            <div className="app-brand-mark" aria-hidden="true">
              <span className="app-brand-mark__letters">TS</span>
            </div>
            <div className="app-brand-copy">
              <TopbarTitle role="heading" aria-level={1}>
                Ticket Summarizer
              </TopbarTitle>
              <TopbarSubtitle>
                Zendesk tickets with AI-powered summaries
              </TopbarSubtitle>
            </div>
          </div>

          <aside className="app-topbar-aside" aria-label="Current workspace">
            <TopbarEyebrow>Workspace</TopbarEyebrow>
            <TopbarAsideName isRegular>Agent</TopbarAsideName>
          </aside>
        </div>
      </header>

      {/* Main content slot — React Router injects the matched child route here. */}
      <main id="main-content" className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
