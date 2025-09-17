import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LibraryPage from './pages/LibraryPage';
import ImportPage from './pages/ImportPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import AlbumView from './pages/AlbumView';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/album/:id" element={<AlbumView />} />
        <Route path="/show/:id" element={<AlbumView />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;