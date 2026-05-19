const API_URL = '/api/auth';

export async function sendCode(email) {
    const response = await fetch(`${API_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка отправки кода');
    }
    
    return response.json();
}

export async function verifyCode(email, code) {
    const response = await fetch(`${API_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Неверный код');
    }
    
    return response.json();
}

export async function register(username, email, password, verified) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, verified })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка регистрации');
    }
    
    return response.json();
}

export async function login(username, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка входа');
    }
    
    return response.json();
}

export async function verify(token) {
    const response = await fetch(`${API_URL}/verify`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Сессия истекла, войдите снова');
        }
        if (response.status === 403) {
            throw new Error('Недействительный токен');
        }
        throw new Error('Ошибка проверки токена');
    }
    
    return response.json();
}