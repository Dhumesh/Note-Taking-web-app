import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true });
  }, [user, loading, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
        <Link to="/" className="flex items-center gap-2 text-[#135bec] hover:opacity-90">
          <div className="size-8 flex items-center justify-center bg-[#135bec] text-white rounded-lg">
            <span className="material-symbols-outlined">sync_alt</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">NoteSync</h2>
        </Link>
        <span className="text-sm text-slate-500 hidden md:block">Secure Cloud Synchronization</span>
      </header>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
            <p className="text-slate-500">Keep your thoughts in sync across all devices.</p>
          </div>

          <div className="flex border-b border-slate-200 px-2 gap-8">
            <span className="flex-1 text-center pb-3 pt-2 border-b-[3px] border-[#135bec] text-[#135bec] text-sm font-bold">Login</span>
            <Link to="/register" className="flex-1 text-center pb-3 pt-2 border-b-[3px] border-transparent text-slate-500 hover:text-[#135bec] text-sm font-bold">Sign Up</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white h-12 pl-11 pr-4 focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] outline-none"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white h-12 pl-11 pr-4 focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitLoading}
              className="w-full bg-[#135bec] hover:bg-[#114fce] text-white font-bold py-3.5 px-4 rounded-lg shadow-md transition-all disabled:opacity-60"
            >
              {submitLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
