import React, { useState, useEffect } from 'react';
import { Plus, FileText, Pin, Archive, Search, Tag, MoreVertical, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { token, user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    is_pinned: false,
    is_archived: false
  });

  const fetchNotes = () => {
    fetch('/api/notes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(err => console.error('Failed to fetch notes:', err));
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const handleOpenModal = (note: any = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        category: note.category,
        is_pinned: note.is_pinned === 1,
        is_archived: note.is_archived === 1
      });
    } else {
      setEditingNote(null);
      setFormData({ title: '', content: '', category: 'General', is_pinned: false, is_archived: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingNote ? `/api/notes/${editingNote.id}` : '/api/notes';
    const method = editingNote ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    }).then(() => {
      fetchNotes();
      setIsModalOpen(false);
      setFormData({ title: '', content: '', category: 'General', is_pinned: false, is_archived: false });
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => fetchNotes());
  };

  const togglePin = (note: any) => {
    fetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...note, is_pinned: note.is_pinned === 1 ? 0 : 1 })
    }).then(() => fetchNotes());
  };

  const toggleArchive = (note: any) => {
    fetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...note, is_archived: note.is_archived === 1 ? 0 : 1 })
    }).then(() => fetchNotes());
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Secure Notes</h1>
          <p className="text-slate-500 dark:text-slate-400">Internal documentation and sensitive information.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus size={20} />
          New Note
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search notes..." 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {filteredNotes.map((note) => (
          <div key={note.id} className="break-inside-avoid bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {note.is_pinned === 1 && <Pin size={14} className="text-indigo-500 fill-indigo-500" />}
                  <h3 className="font-bold text-lg leading-tight">{note.title}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 uppercase">
                    {note.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium">{formatDate(note.created_at)}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => togglePin(note)}
                    className={cn("p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors", note.is_pinned === 1 ? "text-indigo-600" : "text-slate-400")}
                    title={note.is_pinned === 1 ? "Unpin" : "Pin"}
                  >
                    <Pin size={14} className={note.is_pinned === 1 ? "fill-indigo-600" : ""} />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(note)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Plus size={14} className="rotate-45" />
                  </button>
                  <button 
                    onClick={() => toggleArchive(note)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-amber-600 transition-colors"
                    title="Archive"
                  >
                    <Archive size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-bold">{editingNote ? 'Edit Secure Note' : 'Create Secure Note'}</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Title</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase text-slate-500">Category</label>
                  <select 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option>General</option>
                    <option>Network</option>
                    <option>Security</option>
                    <option>Procedures</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input 
                    type="checkbox" 
                    id="is_pinned"
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.is_pinned}
                    onChange={e => setFormData({...formData, is_pinned: e.target.checked})}
                  />
                  <label htmlFor="is_pinned" className="text-sm font-medium">Pin to top</label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-500">Content</label>
                <textarea 
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[200px]"
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {editingNote ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
