import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Favorites() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  async function fetchFavorites() {
    setLoading(true);
    try {
      const data = await api.get('/api/notes/favorites');
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function unfavorite(noteId) {
    setBusyId(noteId);
    try {
      await api.put(`/api/notes/${noteId}/favorite`, { isFavorite: false });
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f6f8] text-slate-900 flex">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <Link to="/" className="p-6 flex items-center gap-3 hover:opacity-90">
          <span className="relative size-9 rounded-xl bg-[#135bec] text-white overflow-hidden">
            <span className="material-symbols-outlined absolute left-1.5 top-1.5 text-[16px]">description</span>
            <span className="material-symbols-outlined absolute right-1 bottom-1 text-[14px]">edit</span>
          </span>
          <div>
            <h1 className="text-base font-bold">NoteSync</h1>
            <p className="text-xs text-slate-500">Syncing thoughts</p>
          </div>
        </Link>
        <nav className="flex-1 px-4 space-y-1">
          <Link to="/app" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <span className="material-symbols-outlined">description</span>
            <span className="text-sm font-medium">All Notes</span>
          </Link>
          <Link to="/favorites" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#135bec]/10 text-[#135bec]">
            <span className="material-symbols-outlined">star</span>
            <span className="text-sm font-medium">Favorites</span>
          </Link>
          <Link to="/trash" className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
            <span className="material-symbols-outlined">delete</span>
            <span className="text-sm font-medium">Trash</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500">star</span>
            <h2 className="text-lg font-bold">Favorites</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="text-sm text-[#135bec] font-medium hover:underline">Back to Notes</button>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Favorite Notes</h1>
            <p className="text-slate-500 mt-2">Your starred notes are collected here.</p>
          </div>

          {loading ? (
            <div className="animate-spin w-8 h-8 border-2 border-[#135bec] border-t-transparent rounded-full" />
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-slate-200">
              <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-amber-500">star</span>
              </div>
              <h3 className="text-xl font-bold">No favorites yet</h3>
              <p className="text-slate-500 max-w-xs mt-2">Click the star icon on any note to add it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((n) => (
                <article key={n._id} className="bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Favorite</span>
                    <button
                      onClick={() => unfavorite(n._id)}
                      disabled={busyId === n._id}
                      className="material-symbols-outlined text-amber-500 hover:text-amber-600 disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      star
                    </button>
                  </div>
                  <Link to={`/note/${n._id}`} state={{ from: location.pathname }} className="block">
                    <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{n.title || 'Untitled'}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                      {n.content?.replace(/<[^>]+>/g, ' ').trim() || 'No content'}
                    </p>
                  </Link>
                  <p className="text-xs text-slate-400">Updated {new Date(n.updatedAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
