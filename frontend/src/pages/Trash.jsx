import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Trash() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  async function fetchTrash() {
    setLoading(true);
    try {
      const data = await api.get('/api/notes/trash');
      setNotes(data);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrash();
  }, []);

  async function restoreNote(noteId) {
    setBusyId(noteId);
    try {
      await api.post(`/api/notes/${noteId}/restore`, {});
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId('');
    }
  }

  async function permanentlyDelete(noteId) {
    if (!window.confirm('Delete this note permanently? This cannot be undone.')) return;
    if (!window.confirm('Please confirm again: permanently delete this note?')) return;
    setBusyId(noteId);
    try {
      await api.delete(`/api/notes/${noteId}/permanent`);
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
          <Link to="/trash" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#135bec]/10 text-[#135bec]">
            <span className="material-symbols-outlined">delete</span>
            <span className="text-sm font-medium">Trash</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">delete</span>
            <h2 className="text-lg font-bold">Trash</h2>
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
            <h1 className="text-3xl font-bold">Trash</h1>
            <p className="text-slate-500 mt-2">Notes deleted from dashboard go here.</p>
          </div>

          {loading ? (
            <div className="animate-spin w-8 h-8 border-2 border-[#135bec] border-t-transparent rounded-full" />
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-slate-200">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-400">auto_delete</span>
              </div>
              <h3 className="text-xl font-bold">Trash is empty</h3>
              <p className="text-slate-500 max-w-xs mt-2">When you delete notes, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((n) => (
                <div key={n._id} className="group bg-white border border-slate-200 p-5 rounded-xl hover:shadow-md transition-all relative">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Deleted {n.trashedAt ? new Date(n.trashedAt).toLocaleString() : 'recently'}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => restoreNote(n._id)}
                        disabled={busyId === n._id}
                        className="p-1.5 rounded-md text-[#135bec] bg-[#135bec]/5 hover:bg-[#135bec]/10 transition-colors disabled:opacity-50"
                        title="Restore"
                      >
                        <span className="material-symbols-outlined text-lg">restore</span>
                      </button>
                      <button
                        onClick={() => permanentlyDelete(n._id)}
                        disabled={busyId === n._id}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete permanently"
                      >
                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{n.title || 'Untitled'}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {n.content?.replace(/<[^>]+>/g, ' ').trim() || 'No content'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
