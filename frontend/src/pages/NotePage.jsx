import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function NotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collabEmail, setCollabEmail] = useState('');
  const [collabError, setCollabError] = useState('');
  const [collabLoading, setCollabLoading] = useState(false);
  const hasUserEdited = useRef(false);

  const isOwner = note?.owner?._id === user?._id;

  const fetchNote = useCallback(async () => {
    try {
      const data = await api.get(`/api/notes/${id}`);
      setNote(data);
      setTitle(data.title);
      setContent(data.content || '');
    } catch (err) {
      if (err.message?.includes('404')) navigate('/');
      else setNote(null);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  useEffect(() => {
    if (!note || !hasUserEdited.current) return;
    const t = setTimeout(() => {
      setSaving(true);
      api
        .put(`/api/notes/${id}`, { title, content })
        .then((updated) => setNote(updated))
        .catch(console.error)
        .finally(() => setSaving(false));
    }, 800);
    return () => clearTimeout(t);
  }, [id, title, content]);

  async function addCollaborator(e) {
    e.preventDefault();
    setCollabError('');
    setCollabLoading(true);
    try {
      await api.post(`/api/notes/${id}/collaborators`, { email: collabEmail.trim() });
      setCollabEmail('');
      fetchNote();
    } catch (err) {
      setCollabError(err.message || 'Failed to add');
    } finally {
      setCollabLoading(false);
    }
  }

  async function removeCollaborator(userId) {
    try {
      await api.delete(`/api/notes/${id}/collaborators/${userId}`);
      fetchNote();
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNote() {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/api/notes/${id}`);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600">Note not found.</p>
      </div>
    );
  }

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean'],
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            ← Back
          </Link>
          <span className="text-sm text-slate-500">
            {saving ? 'Saving…' : 'Saved'}
          </span>
          {isOwner && (
            <button
              onClick={deleteNote}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Delete note
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <input
          type="text"
          value={title}
          onChange={(e) => { hasUserEdited.current = true; setTitle(e.target.value); }}
          placeholder="Title"
          className="w-full text-2xl font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-slate-400 mb-2"
        />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={(v) => { hasUserEdited.current = true; setContent(v); }}
            modules={quillModules}
            className="min-h-[280px]"
          />
        </div>

        {/* Collaborators */}
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-medium text-slate-800 mb-2">Collaborators</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 rounded text-sm">
              {note.owner?.name} (owner)
            </span>
            {note.collaborators?.map((c) => (
              <span
                key={c._id}
                className="inline-flex items-center gap-2 px-2 py-1 bg-indigo-50 text-indigo-800 rounded text-sm"
              >
                {c.name}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => removeCollaborator(c._id)}
                    className="text-indigo-600 hover:text-red-600"
                    aria-label={`Remove ${c.name}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {isOwner && (
            <form onSubmit={addCollaborator} className="flex gap-2 flex-wrap">
              <input
                type="email"
                value={collabEmail}
                onChange={(e) => { setCollabEmail(e.target.value); setCollabError(''); }}
                placeholder="Add by email"
                className="flex-1 min-w-[180px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={collabLoading || !collabEmail.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add
              </button>
              {collabError && (
                <p className="w-full text-sm text-red-600 mt-1">{collabError}</p>
              )}
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
