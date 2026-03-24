import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import DashboardPage from './components/Dashboard/DashboardPage';
import ChatPage from './components/Chat/ChatPage';
import AlertsPage from './components/Alerts/AlertsPage';
import ScannerPage from './components/Scanner/ScannerPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/scanner" element={<ScannerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
