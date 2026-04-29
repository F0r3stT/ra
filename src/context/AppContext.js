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
      setErr('Ошибка загрузки данных');
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
      setErr('Не удалось добавить');
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
      setErr('Не удалось обновить');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

const deleteItem = useCallback(async (id) => {
    setLoading(true);
    setErr('');
    try {
        await api.remove(id);
        const numId = Number(id);
        setItems(prev => prev.filter(x => Number(x.id) !== numId));
        return true;
    } catch (e) {
        const errorMessage = e.message || 'Не удалось удалить';
        setErr(errorMessage);
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