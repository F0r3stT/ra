import React, { createContext, useContext, useState, useCallback } from 'react';
import * as api from '../services/requests';

const AppContext = createContext();

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp должен использоваться внутри AppProvider');
  }
  return context;
}

export function AppProvider({ children }) {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const clearErr = useCallback(() => setErr(''), []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.getAll();
      setItems(res.data);
    } catch (e) {
      setErr('Ошибка БД: ' + e.message); 
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOne = useCallback(async (id) => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.getOne(id);
      setCurrent(res.data);
    } catch (e) {
      if (e.response && e.response.status === 404) {
        setErr('Запись не найдена');
      } else {
        setErr('Ошибка загрузки');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (data) => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.create(data);
      setItems(prev => [...prev, res.data]);
      return true;
    } catch (e) {
      setErr(e.message || 'Не удалось добавить');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeItem = useCallback(async (id, data) => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.update(id, data);
      const numId = Number(id);
      setItems(prev => prev.map(x => Number(x.id) === numId ? res.data : x));
      setCurrent(res.data);
      return true;
    } catch (e) {
      console.error('Update error:', e);
      setErr(e.message || 'Не удалось обновить');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setErr('');
    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            setErr('Сессия истекла, войдите снова');
            return false;
        }
        
        const response = await fetch(`/api/attacks/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 401) {
            localStorage.removeItem('token');
            setErr('Сессия истекла, войдите снова');
            return false;
        }
        
        if (response.status === 403) {
            setErr('Нет прав для удаления');
            return false;
        }
        
        if (response.status === 400) {
            const error = await response.json();
            setErr(error.error || 'Нельзя удалить активный инцидент');
            return false;
        }
        
        if (response.status === 404) {
            setErr('Запись не найдена');
            return false;
        }
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Ошибка сервера' }));
            setErr(error.error || 'Не удалось удалить');
            return false;
        }
        
        const numId = Number(id);
        setItems(prev => prev.filter(x => Number(x.id) !== numId));
        return true;
    } catch (e) {
        setErr(e.message || 'Не удалось удалить');
        return false;
    } finally {
        setLoading(false);
    }
  }, []);

  const value = {
    items,
    current,
    loading,
    err,
    loadAll,
    loadOne,
    addItem,
    changeItem,
    deleteItem,
    clearErr,
    setCurrent
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}