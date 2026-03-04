import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const displayNotes = searchResults !== null ? searchResults : notes;

  async function createNote() {
    setCreating(true);
    try {
      const note = await api.post('/api/notes', { title: 'Untitled', content: '' });
      navigate(`/note/${note._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-xl font-bold text-slate-800 font-sans">
            Note
          </Link>
          <div className="flex-1 max-w-md">
            <input
              type="search"
              placeholder="Search notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 hidden sm:inline">{user?.name}</span>
            <button
              onClick={createNote}
              disabled={creating}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              New note
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : displayNotes.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            {search.trim() ? 'No notes match your search.' : 'No notes yet. Create one to get started.'}
          </div>
        ) : (
          <ul className="space-y-2">
            {displayNotes.map((note) => (
              <li key={note._id}>
                <Link
                  to={`/note/${note._id}`}
                  className="block bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <h2 className="font-medium text-slate-800 truncate">
                    {note.title || 'Untitled'}
                  </h2>
                  <p
                    className="text-sm text-slate-500 mt-1 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: note.content?.replace(/<[^>]+>/g, ' ').slice(0, 120) || '',
                    }}
                  />
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>{note.owner?.name || 'You'}</span>
                    {note.collaborators?.length > 0 && (
                      <span>· {note.collaborators.length} collaborator(s)</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
