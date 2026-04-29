const API_URL = 'http://localhost:5000/api';

export async function getAll() {
    const response = await fetch(`${API_URL}/attacks`);
    const data = await response.json();
    return { data };
}

export async function getOne(id) {
    const response = await fetch(`${API_URL}/attacks/${id}`);
    const data = await response.json();
    return { data };
}

export async function create(data) {
    const response = await fetch(`${API_URL}/attacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    return { data: result };
}

export async function update(id, data) {
    const response = await fetch(`${API_URL}/attacks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    const result = await response.json();
    return { data: result };
}

export async function remove(id) {
    const response = await fetch(`${API_URL}/attacks/${id}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
    }
    return { data: { id } };
}