const API_URL = '/api';

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

async function checkResponse(response) {

    if (response.status === 401) {
        if (unauthorizedHandler) unauthorizedHandler();
        throw new Error('Сессия истекла');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Произошла ошибка при запросе');
    }
    
    return response;
}

export async function getPaginated(page = 1, limit = 10, typeFilter = 'Все', statusFilter = 'Все') {
    let url = `${API_URL}/attacks/paginated?page=${page}&limit=${limit}`;
    
    if (typeFilter && typeFilter !== 'Все') {
        url += `&type=${encodeURIComponent(typeFilter)}`;
    }
    if (statusFilter && statusFilter !== 'Все') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
    }

    const response = await fetch(url, { headers: getHeaders() });
    await checkResponse(response);
    return response.json();
}

export async function getAll() {
    const response = await fetch(`${API_URL}/attacks`, { headers: getHeaders() });
    await checkResponse(response);
    const data = await response.json();
    return { data };
}

export async function getOne(id) {
    const response = await fetch(`${API_URL}/attacks/${id}`, { headers: getHeaders() });
    await checkResponse(response);
    const data = await response.json();
    return { data };
}

export async function create(data) {
    const response = await fetch(`${API_URL}/attacks`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    await checkResponse(response);
    const result = await response.json();
    return { data: result };
}

export async function update(id, data) {
    const response = await fetch(`${API_URL}/attacks/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    await checkResponse(response);
    const result = await response.json();
    return { data: result };
}

export async function remove(id) {
    const response = await fetch(`${API_URL}/attacks/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    await checkResponse(response);
    return { data: { id } };
}