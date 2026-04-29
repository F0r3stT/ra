import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Main from './pages/Main';
import List from './pages/List';
import Item from './pages/Item';
import Create from './pages/Create';
import Change from './pages/Change';
import Remove from './pages/Remove';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/list" element={<List />} />
              <Route path="/item/:id" element={<Item />} />
              <Route path="/create" element={<Create />} />
              <Route path="/change/:id" element={<Change />} />
              <Route path="/remove/:id" element={<Remove />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;