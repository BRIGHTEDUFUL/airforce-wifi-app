import React, { useState, useEffect } from 'react';
import { Plus, FileText, Pin, Archive, Search, Tag, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn, formatDate } from '../lib/utils';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { token } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();

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
    <div className="p-8 space-y-8 bg-slate-50 dark:bg-command-dark-bg min-h-full animate-in fade-in duration-700">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Secure Notes</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Internal documentation and sensitive information.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className={cn("bg-command-blue hover:bg-command-blue/90 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-command-blue/20 font-bold text-sm", !canCreate && "hidden")}
        >
          <Plus size={20} />
          New Note
        </button>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-command-blue transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search notes..." 
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-command-dark-card border border-slate-200 dark:border-command-dark-border rounded-2xl focus:ring-2 focus:ring-command-blue outline-none transition-all shadow-sm text-slate-900 dark:text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {filteredNotes.map((note) => (
          <div key={note.id} className="break-inside-avoid bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border shadow-sm hover:shadow-xl hover:border-command-blue/20 dark:hover:border-command-blue/40 transition-all duration-300 group">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {note.is_pinned === 1 && <Pin size={16} className="text-command-blue fill-command-blue" />}
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white leading-tight">{note.title}</h3>
                </div>
                <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-900/50 rounded-full text-slate-400 dark:text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-command-dark-border">
                  {note.category}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <div className="pt-6 border-t border-slate-50 dark:border-command-dark-border flex justify-between items-center">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{formatDate(note.created_at)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  {canEdit && (
                    <button onClick={() => togglePin(note)}
                      className={cn("p-2 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all", note.is_pinned === 1 ? "text-command-blue" : "text-slate-400 dark:text-slate-500")}
                      title={note.is_pinned === 1 ? "Unpin" : "Pin"}>
                      <Pin size={16} className={note.is_pinned === 1 ? "fill-command-blue" : ""} />
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => handleOpenModal(note)}
                      className="p-2 hover:bg-white dark:hover:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-command-blue transition-all"
                      title="Edit">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => toggleArchive(note)}
                      className="p-2 hover:bg-white dark:hover:bg-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-amber-600 transition-all"
                      title="Archive">
                      <Archive size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(note.id)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-slate-400 dark:text-slate-500 hover:text-rose-600 transition-all"
                      title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-command-dark-card rounded-[2.5rem] border border-slate-100 dark:border-command-dark-border w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-command-blue/5 dark:bg-command-blue/20 text-command-blue rounded-2xl">
                  <FileText size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{editingNote ? 'Edit Secure Note' : 'Create Secure Note'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Enter note title"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option className="dark:bg-slate-900">General</option>
                      <option className="dark:bg-slate-900">Network</option>
                      <option className="dark:bg-slate-900">Security</option>
                      <option className="dark:bg-slate-900">Procedures</option>
                      <option className="dark:bg-slate-900">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <div 
                      onClick={() => setFormData({...formData, is_pinned: !formData.is_pinned})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all cursor-pointer relative",
                        formData.is_pinned ? "bg-command-blue" : "bg-slate-200 dark:bg-slate-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.is_pinned ? "left-7" : "left-1"
                      )} />
                    </div>
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Pin to top</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest ml-1">Content</label>
                  <textarea 
                    required
                    placeholder="Enter note content..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent focus:border-command-blue/20 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-slate-700 dark:text-slate-200 min-h-[200px] resize-none"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 dark:border-command-dark-border text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-4 rounded-2xl bg-command-blue hover:bg-command-blue/90 text-white font-bold transition-all shadow-lg shadow-command-blue/20"
                  >
                    {editingNote ? 'Update Note' : 'Save Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
