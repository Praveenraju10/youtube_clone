import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import Home from './pages/Home';
import WatchVideo from './pages/WatchVideo';
import Search from './pages/Search';
import Channel from './pages/Channel';
import Upload from './pages/Upload';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import History from './pages/History';
import LikedVideos from './pages/LikedVideos';
import Subscriptions from './pages/Subscriptions';

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Navbar onToggleSidebar={() => setSidebarCollapsed(c => !c)} />
      <div className="main-content">
        <Sidebar collapsed={sidebarCollapsed} />
        <main className={`page-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:id" element={<WatchVideo />} />
            <Route path="/search" element={<Search />} />
            <Route path="/channel/:id" element={<Channel />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/history" element={<History />} />
            <Route path="/liked" element={<LikedVideos />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/trending" element={<Home />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}
