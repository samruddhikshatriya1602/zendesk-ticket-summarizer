// App.tsx — URL routing: decides which page to show based on the address bar.
// Rendered by main.tsx after ThemeProvider / ToastProvider wrap the tree.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { TicketsWorkspace } from './components/workspace/TicketsWorkspace';

function App() {
  return (
    // BrowserRouter syncs the UI with the browser URL (back/forward work too).
    <BrowserRouter>
      <Routes>
        {/* Parent layout: top bar + <Outlet /> for child pages (see AppShell.tsx). */}
        <Route path="/" element={<AppShell />}>
          {/* "/" → send user to /tickets (replace avoids a useless back-button hop). */}
          <Route index element={<Navigate to="/tickets" replace />} />
          {/* /tickets — list on the left, empty "Select a ticket" on the right. */}
          <Route path="tickets" element={<TicketsWorkspace />} />
          {/* /tickets/42 — same workspace; :id is read by useParams() in detail hooks. */}
          <Route path="tickets/:id" element={<TicketsWorkspace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
