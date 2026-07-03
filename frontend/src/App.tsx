import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AppShell } from './components/layout/AppShell';
import { TicketsWorkspace } from './components/workspace/TicketsWorkspace';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/tickets" replace />} />
          <Route path="tickets" element={<TicketsWorkspace />} />
          <Route path="tickets/:id" element={<TicketsWorkspace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
