import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'Администратор';

  return (
    <header className="header">
      <h1>Безопасность сетей</h1>
      <nav>
        {isAuthenticated ? (
          <>
            <Link to="/">Главная</Link>
            <Link to="/list">Инциденты</Link>
            {isAdmin && (
              <>
                <Link to="/employees">Сотрудники</Link>
                <Link to="/sources">Источники</Link>
                <Link to="/measures">Меры</Link>
                <Link to="/vulnerabilities">Уязвимости</Link>
                <Link to="/audit">Журнал</Link>
                <Link to="/functions">Функции</Link>
                <Link to="/create">Добавить</Link>
              </>
            )}
            <button onClick={handleLogout} className="btn" style={{ background: '#f85149' }}>
              Выйти ({user?.username})
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Вход</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;