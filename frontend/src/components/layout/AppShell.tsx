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
      <SkipLink />

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

      <main id="main-content" className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
