import React, { useState, useEffect } from 'react';
import { Plus, FileText, Pin, Archive, Search, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { cn, formatDate } from '../lib/utils';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { apiFetch } = useAuth();
  const { canCreate, canEdit, canDelete } = usePermissions();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    is_pinned: false,
    is_archived: false
  });

  const fetchNotes = () => {
    apiFetch('/api/notes')
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(err => console.error('Failed to fetch notes:', err));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

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

    apiFetch(url, {
      method,
      body: JSON.stringify(formData)
    }).then(() => {
      fetchNotes();
      setIsModalOpen(false);
      setFormData({ title: '', content: '', category: 'General', is_pinned: false, is_archived: false });
    });
  };

  const handleDelete = (id: number) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    apiFetch(`/api/notes/${id}`, { method: 'DELETE' }).then(() => fetchNotes());
  };

  const togglePin = (note: any) => {
    apiFetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...note, is_pinned: note.is_pinned === 1 ? 0 : 1 })
    }).then(() => fetchNotes());
  };

  const toggleArchive = (note: any) => {
    apiFetch(`/api/notes/${note.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...note, is_archived: note.is_archived === 1 ? 0 : 1 })
    }).then(() => fetchNotes());
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase()) ||
    n.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-theme min-h-full animate-in fade-in duration-700">
      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-theme tracking-tight">Secure Notes</h1>
          <p className="text-theme-2 font-medium text-sm">Internal documentation and sensitive information.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className={cn("bg-command-blue hover:bg-command-blue/90 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-command-blue/20 font-bold text-sm w-full sm:w-auto justify-center", !canCreate && "hidden")}
        >
          <Plus size={20} />
          New Note
        </button>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-3 group-focus-within:text-command-blue transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Search notes..." 
          className="w-full pl-12 pr-4 py-4 bg-surface border border-theme rounded-2xl focus:ring-2 focus:ring-command-blue outline-none transition-all shadow-sm text-theme"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredNotes.map((note) => (
          <div key={note.id} className="bg-surface rounded-[2rem] md:rounded-[2.5rem] border border-theme shadow-sm hover:shadow-xl hover:border-command-blue/20 transition-all duration-300 group">
            <div className="p-5 md:p-8 space-y-4 md:space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {note.is_pinned === 1 && <Pin size={16} className="text-command-blue fill-command-blue" />}
                  <h3 className="font-bold text-xl text-theme leading-tight">{note.title}</h3>
                </div>
                <span className="text-[10px] font-black px-3 py-1 bg-surface-2 rounded-full text-theme-3 uppercase tracking-widest border border-theme">
                  {note.category}
                </span>
              </div>
              <p className="text-sm text-theme-2 font-medium whitespace-pre-wrap leading-relaxed">
                {note.content}
              </p>
              <div className="pt-4 md:pt-6 border-t border-theme flex justify-between items-center">
                <span className="text-[10px] text-theme-3 uppercase font-black tracking-widest">{formatDate(note.created_at)}</span>
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                  {canEdit && (
                    <button onClick={() => togglePin(note)}
                      className={cn("p-2 hover:bg-surface-2 rounded-xl transition-all", note.is_pinned === 1 ? "text-command-blue" : "text-theme-3")}
                      title={note.is_pinned === 1 ? "Unpin" : "Pin"}>
                      <Pin size={16} className={note.is_pinned === 1 ? "fill-command-blue" : ""} />
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => handleOpenModal(note)}
                      className="p-2 hover:bg-surface-2 rounded-xl text-theme-3 hover:text-command-blue transition-all"
                      title="Edit">
                      <Edit2 size={16} />
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => toggleArchive(note)}
                      className="p-2 hover:bg-surface-2 rounded-xl text-theme-3 hover:text-amber-600 transition-all"
                      title="Archive">
                      <Archive size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(note.id)}
                      className="p-2 hover:bg-rose-50 rounded-xl text-theme-3 hover:text-rose-600 transition-all"
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
          <div className="bg-surface rounded-[2.5rem] border border-theme w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-6 md:p-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-command-blue/5  text-command-blue rounded-2xl">
                  <FileText size={24} />
                </div>
                <h2 className="text-2xl font-bold text-theme tracking-tight">{editingNote ? 'Edit Secure Note' : 'Create Secure Note'}</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Title</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Enter note title"
                    className="w-full p-4 bg-surface-2/50 rounded-2xl border border-transparent focus:border-command-blue/20  focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-theme"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Category</label>
                    <select 
                      className="w-full p-4 bg-surface-2/50 rounded-2xl border border-transparent focus:border-command-blue/20  focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-theme appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option className="">General</option>
                      <option className="">Network</option>
                      <option className="">Security</option>
                      <option className="">Procedures</option>
                      <option className="">Other</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <div 
                      onClick={() => setFormData({...formData, is_pinned: !formData.is_pinned})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all cursor-pointer relative",
                        formData.is_pinned ? "bg-command-blue" : "bg-slate-200 "
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        formData.is_pinned ? "left-7" : "left-1"
                      )} />
                    </div>
                    <label className="text-sm font-bold text-theme-2">Pin to top</label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-theme-3 tracking-widest ml-1">Content</label>
                  <textarea 
                    required
                    placeholder="Enter note content..."
                    className="w-full p-4 bg-surface-2/50 rounded-2xl border border-transparent focus:border-command-blue/20  focus:ring-4 focus:ring-command-blue/5 outline-none transition-all font-medium text-theme min-h-[200px] resize-none"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  ></textarea>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-theme text-theme-2 font-bold hover:bg-surface-2 transition-all"
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

