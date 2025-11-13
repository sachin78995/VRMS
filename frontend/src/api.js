const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function safeFetch(path, opts) {
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(txt || res.statusText)
  }
  return res.json()
}

// Drivers
export const getDrivers = () => safeFetch('/api/drivers')
export const getDriver = (id) => safeFetch(`/api/drivers/${id}`)
export const createDriver = (payload) => safeFetch('/api/drivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const updateDriver = (id, payload) => safeFetch(`/api/drivers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const deleteDriver = (id) => safeFetch(`/api/drivers/${id}`, { method: 'DELETE' })

// Vehicles
export const getVehicles = () => safeFetch('/api/vehicles')
export const getVehicle = (id) => safeFetch(`/api/vehicles/${id}`)
export const createVehicle = (payload) => safeFetch('/api/vehicles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const updateVehicle = (id, payload) => safeFetch(`/api/vehicles/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
export const deleteVehicle = (id) => safeFetch(`/api/vehicles/${id}`, { method: 'DELETE' })
