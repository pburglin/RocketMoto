import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Home } from './pages/Home';
import { SearchResults } from './pages/SearchResults';
import { RouteDetails } from './pages/RouteDetails';
import { CreateRoute } from './pages/CreateRoute';
import { EditRoute } from './pages/EditRoute';
import { Profile } from './pages/Profile';
import { FAQ } from './pages/FAQ';
import { Bookmarks } from './pages/Bookmarks';
import { Footer } from './components/Footer';
import { TermsOfService } from './pages/TermsOfService';
import { Leaderboards } from './pages/Leaderboards';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/routes/:id" element={<RouteDetails />} />
            <Route path="/create" element={<CreateRoute />} />
            <Route path="/routes/:id/edit" element={<EditRoute />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;