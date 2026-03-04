import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/app', { replace: true });
  }, [user, loading, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitLoading(true);
    try {
      await register(name, email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
        <Link to="/" className="flex items-center gap-2 text-[#135bec] hover:opacity-90">
          <div className="size-8 flex items-center justify-center bg-[#135bec] text-white rounded-lg">
            <span className="material-symbols-outlined">edit_note</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">NoteFlow</h2>
        </Link>
      </header>

      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-black tracking-tight mb-2">Create account</h1>
              <p className="text-slate-500">Start your productivity journey with NoteFlow today.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 h-12 px-4 text-base focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 h-12 px-4 text-base focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] outline-none"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 h-12 px-4 text-base focus:border-[#135bec] focus:ring-1 focus:ring-[#135bec] outline-none"
                  placeholder="Create a password"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-[#135bec] hover:bg-[#114fce] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-[#135bec]/20 disabled:opacity-60"
              >
                {submitLoading ? 'Creating account...' : 'Sign Up'}
              </button>
              <div className="text-center mt-6">
                <p className="text-slate-600 text-sm">
                  Already have an account?
                  <Link to="/login" className="text-[#135bec] font-bold hover:underline ml-1">
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
