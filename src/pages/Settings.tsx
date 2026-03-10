import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { apiFetch } from '../utils/api.js';

export default function Settings() {
  const [settings, setSettings] = useState({
    store_name: '',
    address: '',
    phone: '',
    gstin: '',
    state_code: '',
    logo_url: ''
  });

  useEffect(() => {
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) setSettings(data);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-white">Store Settings</h1>
      </div>

      <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Store Name</label>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
              className="block w-full sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Address</label>
            <textarea
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              rows={3}
              className="block w-full sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Phone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="block w-full sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">GSTIN</label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                className="block w-full sm:text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">State Code</label>
              <input
                type="text"
                value={settings.state_code}
                onChange={(e) => setSettings({ ...settings, state_code: e.target.value })}
                className="block w-full sm:text-sm"
                placeholder="e.g. 19 (West Bengal)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Logo URL (Optional)</label>
              <input
                type="text"
                value={settings.logo_url || ''}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                className="block w-full sm:text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="pt-6 border-t-2 border-zinc-800">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-4 px-4 border-2 border-zinc-950 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-black text-zinc-950 bg-lime-400 hover:bg-lime-300 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider"
            >
              <Save className="-ml-1 mr-2 h-5 w-5" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
