import React, { useState } from 'react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const credentials = btoa(`${username}:${password}`);
      const res = await fetch('/api/health', {
        headers: {
          'Authorization': `Basic ${credentials}`
        }
      });

      if (res.ok) {
        localStorage.setItem('auth_credentials', credentials);
        onLogin();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred while signing in');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-lime-400 mb-2">Bill Express</h1>
          <p className="text-zinc-400 font-bold uppercase tracking-wider text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border-2 border-rose-500 rounded-xl p-4 text-rose-500 font-bold text-center text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-0 focus:border-lime-400 transition-colors font-bold"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full bg-zinc-950 border-2 border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-0 focus:border-lime-400 transition-colors font-bold"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border-2 border-zinc-950 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-lg font-black text-zinc-950 bg-lime-400 hover:bg-lime-300 hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider mt-8"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
