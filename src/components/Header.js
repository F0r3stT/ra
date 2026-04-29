import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <h1>Безопасность сетей</h1>
      <nav>
        <Link to="/">Главная</Link>
        <Link to="/list">Список</Link>
        <Link to="/create">Добавить</Link>
      </nav>
    </header>
  );
}

export default Header;