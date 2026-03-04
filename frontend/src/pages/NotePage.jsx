import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function NotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
      if (err.message?.includes('404')) navigate('/app');
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
    }, 700);
    return () => clearTimeout(t);
  }, [id, title, content, note]);

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
    if (!window.confirm('Delete this note? It will be moved to Trash.')) return;
    try {
      await api.delete(`/api/notes/${id}`);
      navigate('/trash');
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f8]">
        <div className="animate-spin w-8 h-8 border-2 border-[#135bec] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f6f8]">
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
    <div className="min-h-screen bg-[#f6f6f8] text-slate-900 flex flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/app" className="text-[#135bec] text-sm font-semibold hover:underline">Back</Link>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Collaborative note</p>
            <p className="text-sm font-semibold truncate">{note.owner?.name || 'Owner'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{saving ? 'Saving...' : 'Saved'}</span>
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100"
          >
            Logout
          </button>
          {isOwner && (
            <button onClick={deleteNote} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100">
              Delete
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 lg:px-16">
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 pt-6">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                hasUserEdited.current = true;
                setTitle(e.target.value);
              }}
              placeholder="Untitled note"
              className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-0 focus:ring-0 outline-none placeholder:text-slate-300"
            />
            <p className="text-xs text-slate-400 mt-2">Last updated {new Date(note.updatedAt).toLocaleString()}</p>
          </div>

          <div className="mt-4 border-t border-slate-200">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={(v) => {
                hasUserEdited.current = true;
                setContent(v);
              }}
              modules={quillModules}
              className="min-h-[320px]"
            />
          </div>

          <section className="border-t border-slate-200 p-6 bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-3">Collaborators</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-700 rounded text-sm">
                {note.owner?.name} (owner)
              </span>
              {note.collaborators?.map((c) => (
                <span key={c._id} className="inline-flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {c.name}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => removeCollaborator(c._id)}
                      className="text-blue-700 hover:text-red-600"
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
                  onChange={(e) => {
                    setCollabEmail(e.target.value);
                    setCollabError('');
                  }}
                  placeholder="Add collaborator by email"
                  className="flex-1 min-w-[220px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] outline-none"
                />
                <button
                  type="submit"
                  disabled={collabLoading || !collabEmail.trim()}
                  className="px-4 py-2 bg-[#135bec] text-white text-sm font-medium rounded-lg hover:bg-[#114fce] disabled:opacity-50"
                >
                  Add
                </button>
                {collabError && <p className="w-full text-sm text-red-600 mt-1">{collabError}</p>}
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
