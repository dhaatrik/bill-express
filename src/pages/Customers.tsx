import { useState, useEffect } from 'react';
import { Search, Edit2, Save, X, Download } from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    apiFetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data));
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    setEditForm(customer);
  };

  const handleSave = async () => {
    try {
      await apiFetch(`/api/customers/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to update customer');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Mobile', 'Address', 'GSTIN', 'State', 'Lifetime Value'];
    const csvContent = [
      headers.join(','),
      ...customers.map(c => [
        `"${c.name}"`,
        `"${c.mobile || ''}"`,
        `"${c.address || ''}"`,
        `"${c.gstin || ''}"`,
        `"${c.state || ''}"`,
        c.lifetime_value
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'customers.csv';
    link.click();
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile && c.mobile.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-white">Customers</h1>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 border-2 border-zinc-950 text-sm font-bold rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-zinc-950 bg-cyan-400 hover:bg-cyan-300 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <Download className="-ml-1 mr-2 h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center mb-6">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 sm:text-sm"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="bg-zinc-900 border-2 border-zinc-800 overflow-hidden rounded-2xl">
                <table className="min-w-full divide-y divide-zinc-800">
                  <thead className="bg-zinc-950/50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Mobile</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Address/State</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">GSTIN</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Lifetime Value</th>
                      <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                    {filteredCustomers.map((customer: any) => (
                      <tr key={customer.id} className="hover:bg-zinc-800/50 transition-colors">
                        {editingId === customer.id ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full sm:text-sm" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input type="text" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} className="w-full sm:text-sm" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full sm:text-sm mb-1" placeholder="Address" />
                              <input type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})} className="w-full sm:text-sm" placeholder="State" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input type="text" value={editForm.gstin} onChange={e => setEditForm({...editForm, gstin: e.target.value})} className="w-full sm:text-sm" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-lime-400 text-right font-bold">₹{customer.lifetime_value.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={handleSave} className="text-lime-400 hover:text-lime-300 mr-3"><Save className="h-5 w-5" /></button>
                              <button onClick={() => setEditingId(null)} className="text-zinc-400 hover:text-zinc-300"><X className="h-5 w-5" /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">{customer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-400">{customer.mobile || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-400">
                              {customer.address || '-'}
                              {customer.state && <span className="block text-xs text-zinc-500 mt-1">{customer.state}</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-400">{customer.gstin || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-lime-400 text-right font-bold">₹{customer.lifetime_value.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button onClick={() => handleEdit(customer)} className="text-cyan-400 hover:text-cyan-300 inline-flex items-center transition-colors">
                                <Edit2 className="h-5 w-5" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
