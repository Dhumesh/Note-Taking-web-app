import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    api
      .get('/api/notes')
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    const t = setTimeout(() => {
      api
        .get(`/api/notes/search?q=${encodeURIComponent(search)}`)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const displayNotes = searchResults !== null ? searchResults : notes;

  async function createNote() {
    setCreating(true);
    setActionError('');
    try {
      const note = await api.post('/api/notes', { title: 'Untitled', content: '' });
      const noteId = note?._id || note?.id;
      if (!noteId) {
        await api.get('/api/notes').then(setNotes).catch(() => {});
        setActionError('Note created but could not open automatically. Please open it from the list.');
        return;
      }
      navigate(`/note/${noteId}`);
    } catch (err) {
      console.error(err);
      setActionError(err.message || 'Failed to create note');
    } finally {
      setCreating(false);
    }
  }

  async function moveToTrash(noteId) {
    if (!window.confirm('Delete this note? It will be moved to Trash.')) return;
    setDeletingId(noteId);
    try {
      await api.delete(`/api/notes/${noteId}`);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
      if (searchResults !== null) {
        setSearchResults((prev) => (prev || []).filter((n) => n._id !== noteId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId('');
    }
  }

  async function toggleFavorite(noteId, currentValue) {
    try {
      const updated = await api.put(`/api/notes/${noteId}/favorite`, { isFavorite: !currentValue });
      setNotes((prev) => prev.map((n) => (n._id === noteId ? updated : n)));
      if (searchResults !== null) {
        setSearchResults((prev) => (prev || []).map((n) => (n._id === noteId ? updated : n)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="h-screen bg-[#f6f6f8] text-slate-900 flex overflow-hidden">
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <Link to="/" className="p-6 flex items-center gap-3 hover:opacity-90">
          <span className="relative size-9 rounded-xl bg-[#135bec] text-white overflow-hidden">
            <span className="material-symbols-outlined absolute left-1.5 top-1.5 text-[16px]">description</span>
            <span className="material-symbols-outlined absolute right-1 bottom-1 text-[14px]">edit</span>
          </span>
          <h1 className="text-xl font-bold leading-none">NoteFlow</h1>
        </Link>
        <nav className="flex-1 px-4 space-y-1">
          <Link to="/app" className="flex items-center gap-3 px-3 py-2.5 bg-[#135bec]/10 text-[#135bec] rounded-lg font-medium">
            <span className="material-symbols-outlined">description</span>
            <span>All Notes</span>
          </Link>
          <Link to="/favorites" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined">star</span>
            <span>Favorites</span>
          </Link>
          <Link to="/trash" className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <span className="material-symbols-outlined">delete</span>
            <span>Trash</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <div className="flex-1 max-w-xl relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Search your notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm border-none focus:ring-2 focus:ring-[#135bec]/20 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
            >
              Logout
            </button>
            <button
              onClick={createNote}
              disabled={creating}
              className="bg-[#135bec] text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-[#135bec]/20 hover:bg-[#114fce] transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New Note
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">All Notes</h2>
              <p className="text-slate-500 mt-1">Manage and organize your thoughts effectively.</p>
            </div>
            {actionError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-[#135bec] border-t-transparent rounded-full" />
              </div>
            ) : displayNotes.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                {search.trim() ? 'No notes match your search.' : 'No notes yet. Create one to get started.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayNotes.map((note) => (
                  <article key={note._id} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-lg transition-all flex flex-col min-h-[220px]">
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Note</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFavorite(note._id, !!note.isFavorite)}
                          className={`material-symbols-outlined ${note.isFavorite ? 'text-amber-500' : 'text-slate-400'} hover:text-amber-500`}
                          title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {note.isFavorite ? 'star' : 'star_outline'}
                        </button>
                        <button
                          onClick={() => moveToTrash(note._id)}
                          disabled={deletingId === note._id}
                          className="material-symbols-outlined text-slate-400 hover:text-red-600 disabled:opacity-50"
                          title="Move to trash"
                        >
                          delete
                        </button>
                      </div>
                    </div>
                    <Link to={`/note/${note._id}`} state={{ from: location.pathname }} className="block flex-1">
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{note.title || 'Untitled'}</h3>
                      <p className="text-slate-500 text-sm line-clamp-4 leading-relaxed">
                        {note.content?.replace(/<[^>]+>/g, ' ').trim() || 'No content yet.'}
                      </p>
                    </Link>
                    <div className="mt-auto pt-4 text-xs text-slate-400 flex items-center justify-between">
                      <span>{new Date(note.updatedAt).toLocaleString()}</span>
                      {note.collaborators?.length > 0 ? <span>{note.collaborators.length} collaborators</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
