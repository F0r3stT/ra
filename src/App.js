import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { setUnauthorizedHandler } from './services/requests';
import PrivateRoute from './components/PrivateRoute';
import Toast from './components/Toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import Main from './pages/Main';
import List from './pages/List';
import Item from './pages/Item';
import Create from './pages/Create';
import Change from './pages/Change';
import Remove from './pages/Remove';
import Audit from './pages/Audit';
import Functions from './pages/Functions';
import VulnerabilitiesList from './pages/vulnerabilities/VulnerabilitiesList';
import VulnerabilityForm from './pages/vulnerabilities/VulnerabilityForm';
import EmployeesList from './pages/employees/EmployeesList';
import EmployeeForm from './pages/employees/EmployeeForm';
import MeasuresList from './pages/measures/MeasuresList';
import MeasureForm from './pages/measures/MeasureForm';
import SourcesList from './pages/sources/SourcesList';
import SourceForm from './pages/sources/SourceForm';
import axios from 'axios';
import './App.css';


axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


axios.interceptors.response.use(
    (response) => response,
    (error) => {

        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login'; 
            }
        }
        return Promise.reject(error);
    }
);



function App() {
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    
    const showToast = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000);
    };
    
    setUnauthorizedHandler(() => {
        localStorage.removeItem('token');
        showToast('Сессия истекла, войдите снова', 'warning');
        setTimeout(() => {
            window.location.href = '/login';
        }, 2000);
    });
    
    return (
        <AuthProvider>
            <AppProvider>
                <BrowserRouter>
                    <div className="app">
                        <Header />
                        <main>
                            <Routes>
                                <Route path="/login" element={<Login showToast={showToast} />} />
                                <Route path="/register" element={<Register showToast={showToast} />} />
                                <Route path="/" element={<PrivateRoute><Main showToast={showToast} /></PrivateRoute>} />
                                <Route path="/list" element={<PrivateRoute><List showToast={showToast} /></PrivateRoute>} />
                                <Route path="/item/:id" element={<PrivateRoute><Item showToast={showToast} /></PrivateRoute>} />
                                <Route path="/create" element={<PrivateRoute><Create showToast={showToast} /></PrivateRoute>} />
                                <Route path="/change/:id" element={<PrivateRoute><Change showToast={showToast} /></PrivateRoute>} />
                                <Route path="/remove/:id" element={<PrivateRoute><Remove showToast={showToast} /></PrivateRoute>} />
                                <Route path="/audit" element={<PrivateRoute><Audit showToast={showToast} /></PrivateRoute>} />
                                <Route path="/functions" element={<PrivateRoute><Functions showToast={showToast} /></PrivateRoute>} />
                                <Route path="/employees" element={<PrivateRoute><EmployeesList showToast={showToast} /></PrivateRoute>} />
                                <Route path="/employees/create" element={<PrivateRoute><EmployeeForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/employees/edit/:id" element={<PrivateRoute><EmployeeForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/sources" element={<PrivateRoute><SourcesList showToast={showToast} /></PrivateRoute>} />
                                <Route path="/sources/create" element={<PrivateRoute><SourceForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/sources/edit/:id" element={<PrivateRoute><SourceForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/measures" element={<PrivateRoute><MeasuresList showToast={showToast} /></PrivateRoute>} />
                                <Route path="/measures/create" element={<PrivateRoute><MeasureForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/measures/edit/:id" element={<PrivateRoute><MeasureForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/vulnerabilities" element={<PrivateRoute><VulnerabilitiesList showToast={showToast} /></PrivateRoute>} />
                                <Route path="/vulnerabilities/create" element={<PrivateRoute><VulnerabilityForm showToast={showToast} /></PrivateRoute>} />
                                <Route path="/vulnerabilities/edit/:id" element={<PrivateRoute><VulnerabilityForm showToast={showToast} /></PrivateRoute>} />
                            </Routes>
                        </main>
                        <Footer />
                        <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'error' })} />
                    </div>
                </BrowserRouter>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;