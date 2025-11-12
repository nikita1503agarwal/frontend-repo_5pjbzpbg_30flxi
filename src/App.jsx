import { useEffect, useMemo, useState } from 'react'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  )
}

export default function App() {
  const [role, setRole] = useState('admin')
  const [users, setUsers] = useState([])

  // Admin data
  const [houseCategories, setHouseCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [packages, setPackages] = useState([])
  const [quotations, setQuotations] = useState([])

  // Forms
  const [newHouseCat, setNewHouseCat] = useState({ name: '', description: '' })
  const [newSubcat, setNewSubcat] = useState({ name: '', house_category_id: '', description: '' })
  const [newPackage, setNewPackage] = useState({ name: '', subcategory_id: '', price: 0, features: '' })

  // Employee quote form
  const [employeeId, setEmployeeId] = useState('')
  const [client, setClient] = useState({ name: '', email: '' })
  const [quote, setQuote] = useState({ house_category_id: '', subcategory_id: '', items: [], discount_percent: 0, notes: '' })
  const [itemDraft, setItemDraft] = useState({ package_id: '', quantity: 1, unit_price: 0, note: '' })

  const fetchAll = async () => {
    const [u, hc, sc, pk, qt] = await Promise.all([
      fetch(`${API}/users`).then(r => r.json()),
      fetch(`${API}/house-categories`).then(r => r.json()),
      fetch(`${API}/subcategories`).then(r => r.json()),
      fetch(`${API}/packages`).then(r => r.json()),
      fetch(`${API}/quotations`).then(r => r.json()),
    ])
    setUsers(u)
    setHouseCategories(hc)
    setSubcategories(sc)
    setPackages(pk)
    setQuotations(qt)
  }

  useEffect(() => { fetchAll() }, [])

  const employeeList = useMemo(() => users.filter(u => u.role === 'employee'), [users])

  const createHouseCategory = async () => {
    if (!newHouseCat.name) return
    await fetch(`${API}/house-categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newHouseCat) })
    setNewHouseCat({ name: '', description: '' })
    fetchAll()
  }

  const createSubcategory = async () => {
    if (!newSubcat.name || !newSubcat.house_category_id) return
    await fetch(`${API}/subcategories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSubcat) })
    setNewSubcat({ name: '', house_category_id: '', description: '' })
    fetchAll()
  }

  const createPackage = async () => {
    if (!newPackage.name || !newPackage.subcategory_id) return
    const payload = { ...newPackage, price: Number(newPackage.price), features: newPackage.features ? newPackage.features.split(',').map(f => f.trim()) : [] }
    await fetch(`${API}/packages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setNewPackage({ name: '', subcategory_id: '', price: 0, features: '' })
    fetchAll()
  }

  const addItem = () => {
    if (!itemDraft.package_id || !itemDraft.quantity || !itemDraft.unit_price) return
    setQuote(q => ({ ...q, items: [...q.items, { package_id: itemDraft.package_id, quantity: Number(itemDraft.quantity), unit_price: Number(itemDraft.unit_price), note: itemDraft.note }] }))
    setItemDraft({ package_id: '', quantity: 1, unit_price: 0, note: '' })
  }

  const subtotal = quote.items.reduce((s, it) => s + it.quantity * it.unit_price, 0)
  const discountAmount = (Number(quote.discount_percent) / 100) * subtotal
  const total = subtotal - discountAmount

  const createQuotation = async () => {
    if (!employeeId || !client.name || !quote.house_category_id || !quote.subcategory_id || quote.items.length === 0) return
    const payload = {
      employee_id: employeeId,
      client_name: client.name,
      client_email: client.email || null,
      house_category_id: quote.house_category_id,
      subcategory_id: quote.subcategory_id,
      items: quote.items,
      discount_percent: Number(quote.discount_percent) || 0,
      notes: quote.notes || null,
    }
    await fetch(`${API}/quotations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setQuote({ house_category_id: '', subcategory_id: '', items: [], discount_percent: 0, notes: '' })
    setItemDraft({ package_id: '', quantity: 1, unit_price: 0, note: '' })
    setClient({ name: '', email: '' })
    fetchAll()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Interior Quotation System</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Viewing as</span>
            <select value={role} onChange={e => setRole(e.target.value)} className="px-3 py-2 border rounded-md">
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Panel */}
        {role === 'admin' && (
          <>
            <div className="lg:col-span-2 space-y-6">
              <Section title="House Categories">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Name">
                    <input className="input" value={newHouseCat.name} onChange={e => setNewHouseCat(v => ({ ...v, name: e.target.value }))} />
                  </Field>
                  <Field label="Description">
                    <input className="input" value={newHouseCat.description} onChange={e => setNewHouseCat(v => ({ ...v, description: e.target.value }))} />
                  </Field>
                  <div className="flex items-end">
                    <button onClick={createHouseCategory} className="btn-primary">Add</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {houseCategories.map(h => (
                    <div key={h.id} className="p-3 rounded border bg-slate-50">
                      <div className="font-medium">{h.name}</div>
                      <div className="text-xs text-slate-600">{h.description}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Subcategories">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Field label="Name">
                    <input className="input" value={newSubcat.name} onChange={e => setNewSubcat(v => ({ ...v, name: e.target.value }))} />
                  </Field>
                  <Field label="House Category">
                    <select className="input" value={newSubcat.house_category_id} onChange={e => setNewSubcat(v => ({ ...v, house_category_id: e.target.value }))}>
                      <option value="">Select</option>
                      {houseCategories.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Description">
                    <input className="input" value={newSubcat.description} onChange={e => setNewSubcat(v => ({ ...v, description: e.target.value }))} />
                  </Field>
                  <div className="flex items-end">
                    <button onClick={createSubcategory} className="btn-primary">Add</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subcategories.map(s => (
                    <div key={s.id} className="p-3 rounded border bg-slate-50">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-slate-600">HC: {houseCategories.find(h => h.id === s.house_category_id)?.name || '—'}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Packages">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <Field label="Name">
                    <input className="input" value={newPackage.name} onChange={e => setNewPackage(v => ({ ...v, name: e.target.value }))} />
                  </Field>
                  <Field label="Subcategory">
                    <select className="input" value={newPackage.subcategory_id} onChange={e => setNewPackage(v => ({ ...v, subcategory_id: e.target.value }))}>
                      <option value="">Select</option>
                      {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Price">
                    <input type="number" className="input" value={newPackage.price} onChange={e => setNewPackage(v => ({ ...v, price: e.target.value }))} />
                  </Field>
                  <Field label="Features (comma separated)">
                    <input className="input" value={newPackage.features} onChange={e => setNewPackage(v => ({ ...v, features: e.target.value }))} />
                  </Field>
                  <div className="flex items-end">
                    <button onClick={createPackage} className="btn-primary">Add</button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {packages.map(p => (
                    <div key={p.id} className="p-3 rounded border bg-slate-50">
                      <div className="font-medium">{p.name} • ${p.price}</div>
                      <div className="text-xs text-slate-600">{subcategories.find(s => s.id === p.subcategory_id)?.name || '—'}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="All Quotations">
                <div className="space-y-3">
                  {quotations.map(q => (
                    <div key={q.id} className="p-3 rounded border bg-slate-50">
                      <div className="font-medium">{q.client_name} • Total ${q.total?.toFixed(2)}</div>
                      <div className="text-xs text-slate-600">By {users.find(u => u.id === q.employee_id)?.name || '—'}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Create Users (quick setup)">
                <button className="btn-primary" onClick={async () => {
                  await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Admin', email: 'admin@example.com', role: 'admin' }) })
                  await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Emma Employee', email: 'emma@example.com', role: 'employee' }) })
                  fetchAll()
                }}>Seed one admin + one employee</button>
              </Section>

              <Section title="Profile">
                <div className="text-sm text-slate-600">This demo keeps profiles simple. You can extend with more fields later.</div>
              </Section>
            </div>
          </>
        )}

        {/* Employee Panel */}
        {role === 'employee' && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <Section title="Performance Snapshot">
                <div className="text-sm text-slate-700">Total quotations: {quotations.length}</div>
                <div className="text-sm text-slate-700">Your quotations: {/* This is a simple demo; select your user below */}</div>
              </Section>

              <Section title="Select Employee">
                <select className="input" value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
                  <option value="">Choose employee</option>
                  {employeeList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Section>

              <Section title="Client">
                <Field label="Name"><input className="input" value={client.name} onChange={e => setClient(v => ({ ...v, name: e.target.value }))} /></Field>
                <Field label="Email"><input className="input" value={client.email} onChange={e => setClient(v => ({ ...v, email: e.target.value }))} /></Field>
              </Section>
            </div>

            <div className="md:col-span-2 space-y-6">
              <Section title="Build Quotation">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="House Category">
                    <select className="input" value={quote.house_category_id} onChange={e => setQuote(v => ({ ...v, house_category_id: e.target.value }))}>
                      <option value="">Select</option>
                      {houseCategories.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Subcategory">
                    <select className="input" value={quote.subcategory_id} onChange={e => setQuote(v => ({ ...v, subcategory_id: e.target.value }))}>
                      <option value="">Select</option>
                      {subcategories.filter(s => !quote.house_category_id || s.house_category_id === quote.house_category_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Notes">
                    <input className="input" value={quote.notes} onChange={e => setQuote(v => ({ ...v, notes: e.target.value }))} />
                  </Field>
                </div>

                <div className="mt-4 p-3 rounded bg-slate-50 border">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <Field label="Package">
                      <select className="input" value={itemDraft.package_id} onChange={e => setItemDraft(v => ({ ...v, package_id: e.target.value, unit_price: packages.find(p => p.id === e.target.value)?.price || 0 }))}>
                        <option value="">Select</option>
                        {packages.filter(p => !quote.subcategory_id || p.subcategory_id === quote.subcategory_id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Qty">
                      <input type="number" min="1" className="input" value={itemDraft.quantity} onChange={e => setItemDraft(v => ({ ...v, quantity: e.target.value }))} />
                    </Field>
                    <Field label="Unit Price">
                      <input type="number" min="0" className="input" value={itemDraft.unit_price} onChange={e => setItemDraft(v => ({ ...v, unit_price: e.target.value }))} />
                    </Field>
                    <Field label="Note">
                      <input className="input" value={itemDraft.note} onChange={e => setItemDraft(v => ({ ...v, note: e.target.value }))} />
                    </Field>
                    <button className="btn-primary" onClick={addItem}>Add Item</button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {quote.items.map((it, idx) => {
                      const pkg = packages.find(p => p.id === it.package_id)
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded">
                          <div className="text-sm">{pkg?.name || 'Package'} × {it.quantity}</div>
                          <div className="text-sm">${(it.quantity * it.unit_price).toFixed(2)}</div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Field label="Discount %">
                      <input type="number" min="0" max="100" className="input" value={quote.discount_percent} onChange={e => setQuote(v => ({ ...v, discount_percent: e.target.value }))} />
                    </Field>
                    <div className="p-3 rounded bg-white border">
                      <div className="text-sm">Subtotal: ${subtotal.toFixed(2)}</div>
                      <div className="text-sm">Discount: ${discountAmount.toFixed(2)}</div>
                      <div className="text-sm font-semibold">Total: ${total.toFixed(2)}</div>
                    </div>
                    <div className="flex items-end">
                      <button className="btn-primary w-full" onClick={createQuotation}>Generate Quotation</button>
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Your Quotations">
                <div className="space-y-3">
                  {quotations.filter(q => !employeeId || q.employee_id === employeeId).map(q => (
                    <div key={q.id} className="p-3 rounded border bg-slate-50">
                      <div className="font-medium">{q.client_name} • Total ${q.total?.toFixed(2)}</div>
                      <div className="text-xs text-slate-600">Items: {q.items?.length || 0}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .input { @apply w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500; }
        .btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition; }
      `}</style>
    </div>
  )
}
