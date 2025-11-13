import React, { useEffect, useMemo, useState } from 'react'
import {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from './api'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'drivers', label: 'Drivers' },
  { id: 'vehicles', label: 'Vehicles' }
]

const emptyDriverForm = () => ({
    fullName: '', 
    contactNumber: '', 
    licenseNumber: '', 
    address: '' 
  })

const emptyVehicleForm = () => ({
    registrationNumber: '', 
    owner: '', 
    vehicleType: 'Car', 
    make: '', 
    model: '', 
    year: '',
  registrationDate: new Date().toISOString().split('T')[0],
  registrationExpiry: '',
  status: 'active'
})

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [drivers, setDrivers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [driverSearch, setDriverSearch] = useState('')
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all')
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('all')

  const [driverForm, setDriverForm] = useState(() => emptyDriverForm())
  const [vehicleForm, setVehicleForm] = useState(() => emptyVehicleForm())
  const [editingDriver, setEditingDriver] = useState(null)
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [showDriverModal, setShowDriverModal] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [details, setDetails] = useState(null)

  useEffect(() => {
    refreshData()
  }, [])

  async function refreshData() {
    setLoading(true)
    setError('')
    try {
      const [driverData, vehicleData] = await Promise.all([getDrivers(), getVehicles()])
      setDrivers(driverData)
      setVehicles(vehicleData)
    } catch (err) {
      console.error(err)
      setError('Unable to load data. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const expiringVehicles = useMemo(() => {
    const now = new Date()
    const within30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return vehicles.filter((vehicle) => {
      if (!vehicle.registrationExpiry) return false
      const expiry = new Date(vehicle.registrationExpiry)
      return expiry >= now && expiry <= within30Days
    })
  }, [vehicles])

  const filteredDrivers = useMemo(() => {
    const query = driverSearch.trim().toLowerCase()
    if (!query) return drivers
    return drivers.filter((driver) => {
      return [driver.fullName, driver.licenseNumber, driver.contactNumber]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [drivers, driverSearch])

  const filteredVehicles = useMemo(() => {
    const query = vehicleSearch.trim().toLowerCase()
    return vehicles.filter((vehicle) => {
      const matchesSearch = query
        ? [vehicle.registrationNumber, vehicle.make, vehicle.model]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true

      const matchesStatus = vehicleStatusFilter === 'all' || vehicle.status === vehicleStatusFilter
      const matchesType = vehicleTypeFilter === 'all' || vehicle.vehicleType === vehicleTypeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [vehicles, vehicleSearch, vehicleStatusFilter, vehicleTypeFilter])

  function openDriverModal(driver) {
    if (driver) {
      setEditingDriver(driver)
      setDriverForm({
        fullName: driver.fullName || '',
        contactNumber: driver.contactNumber || '',
        licenseNumber: driver.licenseNumber || '',
        address: driver.address || ''
      })
    } else {
      setEditingDriver(null)
      setDriverForm(emptyDriverForm())
    }
    setShowDriverModal(true)
  }

  function openVehicleModal(vehicle) {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setVehicleForm({
        registrationNumber: vehicle.registrationNumber || '',
        owner: typeof vehicle.owner === 'object' ? vehicle.owner?._id ?? '' : vehicle.owner ?? '',
        vehicleType: vehicle.vehicleType || 'Car',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year ? String(vehicle.year) : '',
        registrationDate: vehicle.registrationDate
          ? new Date(vehicle.registrationDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        registrationExpiry: vehicle.registrationExpiry
          ? new Date(vehicle.registrationExpiry).toISOString().split('T')[0]
          : '',
        status: vehicle.status || 'active'
      })
    } else {
      setEditingVehicle(null)
      setVehicleForm(emptyVehicleForm())
    }
    setShowVehicleModal(true)
  }

  function closeModals() {
    setShowDriverModal(false)
    setShowVehicleModal(false)
    setEditingDriver(null)
    setEditingVehicle(null)
    setDriverForm(emptyDriverForm())
    setVehicleForm(emptyVehicleForm())
  }

  async function handleDriverSubmit(event) {
    event.preventDefault()
    const payload = sanitizePayload(driverForm)
    try {
      if (editingDriver) {
        await updateDriver(editingDriver._id, payload)
      } else {
        await createDriver(payload)
      }
      closeModals()
      refreshData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleVehicleSubmit(event) {
    event.preventDefault()
    const payload = sanitizeVehiclePayload(vehicleForm)
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle._id, payload)
      } else {
        await createVehicle(payload)
      }
      closeModals()
      refreshData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteDriver(id) {
    if (!window.confirm('Delete this driver? All associated vehicles will also be removed.')) return
    try {
      await deleteDriver(id)
      refreshData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteVehicle(id) {
    if (!window.confirm('Delete this vehicle?')) return
    try {
      await deleteVehicle(id)
      refreshData()
    } catch (err) {
      alert(err.message)
    }
  }

  async function showDriverDetails(id) {
    try {
      const driver = await getDriver(id)
      setDetails({ type: 'driver', data: driver })
    } catch (err) {
      alert(err.message)
    }
  }

  async function showVehicleDetails(id) {
    try {
      const vehicle = await getVehicle(id)
      setDetails({ type: 'vehicle', data: vehicle })
    } catch (err) {
      alert(err.message)
    }
  }

  function exportToCSV(rows, filename) {
    if (!rows.length) {
      alert('No data to export')
      return
    }
    const fields = Object.keys(rows[0]).filter((key) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(key))
    const csv = [fields.join(',')]
    rows.forEach((row) => {
      const line = fields
        .map((key) => {
          const value = row[key]
          if (value == null) return ''
          if (typeof value === 'object') {
            return '"' + JSON.stringify(value).replace(/"/g, "''") + '"'
          }
          const stringValue = String(value)
          return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
        })
        .join(',')
      csv.push(line)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <header className="relative overflow-hidden bg-slate-950 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),transparent_55%)]"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-800/40">
              <span className="text-lg font-semibold leading-none">VR</span>
              </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.6em] text-indigo-200/80">Vehicle Registration</p>
              <h1 className="text-3xl font-semibold tracking-tight">VRMS Dashboard</h1>
              <p className="text-sm text-slate-200/80">Monitor drivers, vehicles, and renewals in one place.</p>
            </div>
            </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="rounded-full border border-indigo-500/60 bg-indigo-500/10 px-6 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20 hover:text-white"
            >
              {loading ? 'Refreshing…' : 'Refresh Data'}
            </button>
          </div>
        </div>
        <nav className="relative border-t border-white/5 bg-slate-900/80 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto">
            {NAV_ITEMS.map((item) => (
            <button 
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`relative mx-1 my-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-indigo-500 text-white shadow shadow-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
            </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 space-y-12">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
        </div>
        )}

        {currentPage === 'dashboard' && (
          <Dashboard
            drivers={drivers}
            vehicles={vehicles}
            expiringVehicles={expiringVehicles}
            onAddDriver={() => openDriverModal(null)}
            onAddVehicle={() => openVehicleModal(null)}
          />
        )}

        {currentPage === 'drivers' && (
          <DriversSection
            loading={loading}
            drivers={filteredDrivers}
            totalDrivers={drivers.length}
            search={driverSearch}
            onSearchChange={setDriverSearch}
            onAdd={() => openDriverModal(null)}
            onEdit={openDriverModal}
            onDelete={handleDeleteDriver}
            onExport={() => exportToCSV(filteredDrivers, 'drivers.csv')}
            onView={showDriverDetails}
          />
        )}

        {currentPage === 'vehicles' && (
          <VehiclesSection
            loading={loading}
            vehicles={filteredVehicles}
            totalVehicles={vehicles.length}
            search={vehicleSearch}
            onSearchChange={setVehicleSearch}
            statusFilter={vehicleStatusFilter}
            onStatusChange={setVehicleStatusFilter}
            typeFilter={vehicleTypeFilter}
            onTypeChange={setVehicleTypeFilter}
            onAdd={() => openVehicleModal(null)}
            onEdit={openVehicleModal}
            onDelete={handleDeleteVehicle}
            onExport={() => exportToCSV(filteredVehicles, 'vehicles.csv')}
            onView={showVehicleDetails}
          />
        )}
      </main>

      <SiteFooter />

      {showDriverModal && (
        <Modal title={editingDriver ? 'Edit Driver' : 'Add Driver'} onClose={closeModals}>
          <form onSubmit={handleDriverSubmit} className="space-y-4">
            <TextField
              label="Full Name"
              value={driverForm.fullName}
              onChange={(value) => setDriverForm((prev) => ({ ...prev, fullName: value }))}
              required
            />
            <TextField
              label="Contact Number"
              value={driverForm.contactNumber}
              onChange={(value) => setDriverForm((prev) => ({ ...prev, contactNumber: value }))}
              required
            />
            <TextField
              label="License Number"
              value={driverForm.licenseNumber}
              onChange={(value) => setDriverForm((prev) => ({ ...prev, licenseNumber: value }))}
              required
            />
            <TextArea
              label="Address"
              value={driverForm.address}
              onChange={(value) => setDriverForm((prev) => ({ ...prev, address: value }))}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModals} className="rounded-md border px-4 py-2 text-sm">
                Cancel
              </button>
            <button 
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
                {editingDriver ? 'Update Driver' : 'Create Driver'}
            </button>
          </div>
          </form>
        </Modal>
      )}

      {showVehicleModal && (
        <Modal title={editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'} onClose={closeModals}>
          <form onSubmit={handleVehicleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <TextField
                  label="Registration Number"
                  value={vehicleForm.registrationNumber}
                  onChange={(value) => setVehicleForm((prev) => ({ ...prev, registrationNumber: value }))}
                  required
                />
                        </div>
              <div className="md:col-span-2">
                <SelectField
                  label="Owner"
                  value={vehicleForm.owner}
                  onChange={(value) => setVehicleForm((prev) => ({ ...prev, owner: value }))}
                  options={[{ value: '', label: 'Select owner' }, ...drivers.map((driver) => ({
                    value: driver._id,
                    label: `${driver.fullName} (${driver.licenseNumber})`
                  }))]}
                  required
                />
                      </div>
              <SelectField
                label="Vehicle Type"
                value={vehicleForm.vehicleType}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, vehicleType: value }))}
                options={[
                  { value: 'Car', label: 'Car' },
                  { value: 'Bike', label: 'Bike' },
                  { value: 'Other', label: 'Other' }
                ]}
                required
              />
              <TextField
                label="Make"
                value={vehicleForm.make}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, make: value }))}
              />
              <TextField
                label="Model"
                value={vehicleForm.model}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, model: value }))}
                required
              />
              <TextField
                label="Year"
                type="number"
                value={vehicleForm.year}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, year: value }))}
              />
              <TextField
                label="Registration Date"
                type="date"
                value={vehicleForm.registrationDate}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, registrationDate: value }))}
                required
              />
              <TextField
                label="Registration Expiry"
                type="date"
                value={vehicleForm.registrationExpiry}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, registrationExpiry: value }))}
              />
              <SelectField
                label="Status"
                value={vehicleForm.status}
                onChange={(value) => setVehicleForm((prev) => ({ ...prev, status: value }))}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
                required
              />
                      </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={closeModals} className="rounded-md border px-4 py-2 text-sm">
                Cancel
                    </button>
                    <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                {editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
                    </button>
        </div>
          </form>
        </Modal>
      )}

      {details && (
        <Modal title={details.type === 'driver' ? 'Driver Details' : 'Vehicle Details'} onClose={() => setDetails(null)}>
          {details.type === 'driver' ? (
            <div className="space-y-2 text-sm">
              <DetailRow label="Full Name" value={details.data.fullName} />
              <DetailRow label="License Number" value={details.data.licenseNumber} />
              <DetailRow label="Contact" value={details.data.contactNumber} />
              <DetailRow label="Address" value={details.data.address} />
              <DetailRow label="Issued Date" value={formatDate(details.data.issuedDate)} />
              <DetailRow label="Expiry Date" value={formatDate(details.data.expiryDate)} />
          </div>
          ) : (
            <div className="space-y-2 text-sm">
              <DetailRow label="Registration" value={details.data.registrationNumber} />
              <DetailRow label="Type" value={details.data.vehicleType} />
              <DetailRow label="Make" value={details.data.make || '—'} />
              <DetailRow label="Model" value={details.data.model} />
              <DetailRow label="Year" value={details.data.year || '—'} />
              <DetailRow label="Owner" value={(details.data.owner && details.data.owner.fullName) || '—'} />
              <DetailRow label="Registered" value={formatDate(details.data.registrationDate)} />
              <DetailRow label="Expiry" value={formatDate(details.data.registrationExpiry)} />
              <DetailRow label="Status" value={<StatusBadge status={details.data.status} />} />
          </div>
          )}
        </Modal>
      )}
        </div>
  )
}

function Dashboard({ drivers, vehicles, expiringVehicles, onAddDriver, onAddVehicle }) {
  return (
    <section id="dashboard" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
                  <div>
          <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">Monitor key metrics across drivers and vehicles.</p>
          </div>
        <div className="flex gap-3">
          <button onClick={onAddDriver} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    Add Driver
                  </button>
          <button onClick={onAddVehicle} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Register Vehicle
            </button>
          </div>
          </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Drivers" value={drivers.length} accent="bg-indigo-100 text-indigo-700" />
        <StatCard label="Vehicles" value={vehicles.length} accent="bg-sky-100 text-sky-700" />
        <StatCard label="Expiring (30 days)" value={expiringVehicles.length} accent="bg-amber-100 text-amber-700" />
      </div>

      <div className="rounded-2xl border border-indigo-100/60 bg-white p-6 shadow-sm shadow-indigo-200/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Upcoming Renewals</h3>
            <p className="text-sm text-slate-500">Vehicles with registration expiry within the next 30 days.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            {expiringVehicles.length} scheduled
          </span>
          </div>
        <div className="mt-5 space-y-3 text-sm">
          {expiringVehicles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
                <span className="text-lg">🎯</span>
          </div>
          <div>
                <p className="text-slate-600 font-medium">Nothing to show.</p>
                <p className="text-xs text-slate-400">Keep registrations refreshed to maintain this streak.</p>
          </div>
        </div>
          ) : (
            expiringVehicles.slice(0, 5).map((vehicle) => (
              <div key={vehicle._id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-amber-800">{vehicle.registrationNumber}</p>
                  <p className="text-xs text-amber-700">{vehicle.make} {vehicle.model}</p>
      </div>
                <span className="text-xs font-medium text-amber-700">{formatDate(vehicle.registrationExpiry)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Feature Spotlight</h3>
            <span className="text-xs uppercase tracking-[0.35em] text-indigo-400">Core Modules</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[{
              title: 'Operations Console',
              body: 'Unified workspace for clerks with role-based access and guided workflows.'
            }, {
              title: 'Compliance Monitoring',
              body: 'Automatic reminders and status badges keep critical records from lapsing.'
            }, {
              title: 'Data Synchronization',
              body: 'Exports and APIs ensure legacy systems stay aligned with registry updates.'
            }].map((card) => (
              <div key={card.title} className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">★</div>
                <p className="text-base font-semibold text-slate-900">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.body}</p>
          </div>
            ))}
        </div>
      </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Operational Highlights</h3>
            <span className="text-xs uppercase tracking-[0.35em] text-emerald-400">Today&apos;s toolkit</span>
        </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[{
              title: 'Driver Registry',
              accent: 'bg-indigo-500',
              copy: 'Create, update, and archive licenses with granular auditing.'
            }, {
              title: 'Vehicle Tracking',
              accent: 'bg-sky-500',
              copy: 'Ownership links, make/model catalogs, and lifecycle statuses.'
            }, {
              title: 'Renewal Insights',
              accent: 'bg-emerald-500',
              copy: 'Proactive views that surface upcoming expirations and risk.'
            }, {
              title: 'Data Export',
              accent: 'bg-amber-500',
              copy: 'CSV pipelines ready for BI dashboards and compliance systems.'
            }].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <span className={`mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full ${item.accent}`}></span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.copy}</p>
          </div>
          </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Future Enhancements</h3>
            <span className="text-xs uppercase tracking-[0.35em] text-pink-400">Coming soon</span>
        </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[{
              label: 'AI Renewal Predictions',
              description: 'Machine learning forecasts to prioritize outreach.'
            }, {
              label: 'Digital Wallet IDs',
              description: 'Mobile-ready credentials with QR verification.'
            }, {
              label: 'Revenue Dashboard',
              description: 'Track licensing fees and settlement pipelines.'
            }, {
              label: 'Workflow Automations',
              description: 'Trigger emails, tasks, and SLA alerts automatically.'
            }].map((future) => (
              <div key={future.label} className="rounded-xl border border-transparent bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-[1px] shadow-md">
                <div className="h-full rounded-[11px] bg-slate-950/90 p-5 text-slate-50">
                  <p className="text-sm font-semibold">{future.label}</p>
                  <p className="mt-2 text-xs text-slate-300">{future.description}</p>
          </div>
          </div>
            ))}
        </div>
      </div>
    </div>
    </section>
  )
}

function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 shadow shadow-indigo-800/30">
              <span className="text-sm font-semibold text-white">VR</span>
                  </div>
                  <div>
              <h3 className="text-lg font-semibold text-white">VRMS Platform</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Vehicle Compliance Suite</p>
                  </div>
                </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            A modern workspace for managing driver licensing, vehicle registrations, and renewal workflows.
            Track compliance, keep records tidy, and export insights whenever you need them.
                  </p>
                </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/90">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-indigo-300 transition" href="#dashboard">Dashboard Overview</a></li>
            <li><a className="hover:text-indigo-300 transition" href="#drivers">Drivers Directory</a></li>
            <li><a className="hover:text-indigo-300 transition" href="#vehicles">Vehicle Registry</a></li>
            <li><a className="hover:text-indigo-300 transition" href="mailto:support@vrms.local">Contact Support</a></li>
          </ul>
                </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/90">Contact</h4>
          <p className="text-sm text-slate-400">
            Need help onboarding your team? Reach out any time.
          </p>
          <div className="space-y-1 text-sm">
            <p>Email: <a className="text-indigo-300 hover:text-indigo-200" href="mailto:sachinsankole6@gmail.com">sachinsankole6@gmail.com</a></p>
            <p>Phone: <span className="text-slate-200">9071504142</span></p>
                  </div>
                </div>
              </div>
      <div className="border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-3 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {year} VRMS Platform. All rights reserved.</p>
          <div className="flex flex-wrap gap-3 text-slate-500/80">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Status</span>
            </div>
              </div>
                </div>
    </footer>
  )
}

function DriversSection({
  loading,
  drivers,
  totalDrivers,
  search,
  onSearchChange,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onView
}) {
  return (
    <section id="drivers" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Drivers</h2>
          <p className="text-sm text-slate-500">Manage driver records and their license information.</p>
        </div>
                <div className="flex gap-3">
          <button onClick={onExport} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
                    Export CSV
                  </button>
          <button onClick={onAdd} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    Add Driver
                  </button>
                </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, license or contact"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="text-sm text-slate-500">{drivers.length} of {totalDrivers} shown</div>
              </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
                    {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading drivers…
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No drivers found.
                </td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver._id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{driver.fullName}</td>
                  <td className="px-4 py-3 text-slate-700">{driver.licenseNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{driver.contactNumber}</td>
                  <td className="px-4 py-3 text-slate-500">{driver.address}</td>
                  <td className="px-4 py-3 text-right">
                    <ActionButton onClick={() => onView(driver._id)}>View</ActionButton>
                    <ActionButton onClick={() => onEdit(driver)} variant="primary">
                      Edit
                    </ActionButton>
                    <ActionButton onClick={() => onDelete(driver._id)} variant="danger">
                      Delete
                    </ActionButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
  )
}

function VehiclesSection({
  loading,
  vehicles,
  totalVehicles,
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onAdd,
  onEdit,
  onDelete,
  onExport,
  onView
}) {
  return (
    <section id="vehicles" className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Vehicles</h2>
          <p className="text-sm text-slate-500">Register vehicles and track their renewal status.</p>
        </div>
                <div className="flex gap-3">
          <button onClick={onExport} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            Export CSV
          </button>
          <button onClick={onAdd} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Register Vehicle
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by registration, make or model"
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
        <select
          value={typeFilter}
          onChange={(event) => onTypeChange(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="all">All Types</option>
          <option value="Car">Car</option>
          <option value="Bike">Bike</option>
          <option value="Other">Other</option>
        </select>
        <span className="ml-auto text-sm text-slate-500">{vehicles.length} of {totalVehicles} shown</span>
              </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
                    {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Loading vehicles…
                          </td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No vehicles found.
                          </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle._id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{vehicle.registrationNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.owner && vehicle.owner.fullName ? vehicle.owner.fullName : '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</td>
                  <td className="px-4 py-3"><StatusBadge status={vehicle.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(vehicle.registrationDate)}</td>
                  <td className="px-4 py-3 text-right">
                    <ActionButton onClick={() => onView(vehicle._id)}>View</ActionButton>
                    <ActionButton onClick={() => onEdit(vehicle)} variant="primary">
                      Edit
                    </ActionButton>
                    <ActionButton onClick={() => onDelete(vehicle._id)} variant="danger">
                      Delete
                    </ActionButton>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-10" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <span className="sr-only">Close</span>
            ×
                </button>
        </header>
        <div className="px-6 py-5">{children}</div>
              </div>
                      </div>
  )
}

function TextField({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </label>
  )
}

function TextArea({ label, value, onChange, required }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
            </select>
    </label>
  )
}

function StatusBadge({ status }) {
  const classes = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    suspended: 'bg-amber-100 text-amber-700'
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes[status] || 'bg-slate-100 text-slate-600'}`}>
      {status || 'unknown'}
    </span>
  )
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm`}> 
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value}</p>
        </div>
  )
}

function ActionButton({ children = 'Action', onClick, variant = 'default' }) {
  const base = 'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors ml-2 first:ml-0'
  const styles = {
    default: `${base} text-slate-600 hover:bg-slate-100`,
    primary: `${base} text-indigo-600 hover:bg-indigo-50`,
    danger: `${base} text-rose-600 hover:bg-rose-50`
  }
  return (
    <button type="button" onClick={onClick} className={styles[variant] || styles.default}>
          {children}
    </button>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2 text-slate-700">
      <span className="font-medium text-slate-600">{label}</span>
      <span className="text-right text-slate-800">{value || '—'}</span>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

function sanitizePayload(form) {
  const payload = { ...form }
  Object.keys(payload).forEach((key) => {
    if (payload[key] === '') {
      delete payload[key]
    }
  })
  return payload
}

function sanitizeVehiclePayload(form) {
  const payload = sanitizePayload(form)
  if (payload.year) payload.year = Number(payload.year)
  if (!payload.year) delete payload.year
  return payload
}
