import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export const FontStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
    :root {
      --font-main: 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { font-family: var(--font-main) !important; scrollbar-width: none; -ms-overflow-style: none; }
    ::-webkit-scrollbar { display: none; }
  `}} />
);

const Portal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { LibraryLogo } from '../components/LibraryLogo';
import SettingsView from '../components/SettingsView';
import { getBooks, saveBook, deleteBook, extractDriveId, Book, CATEGORIES } from '../lib/library';
import BookReader from '../components/BookReader';
import { Search, Menu, LogOut, Layers, Star, Clock, Library, Settings, Grid, List, BookOpen, Plus, X, Edit, Trash2, AlertCircle, Bookmark, Download, FileText } from 'lucide-react';

export default function LibraryDashboard() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isLibraryAdmin = user?.role === 'libraryAdmin' || user?.role === 'admin' || user?.role === 'Admin';
  
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'collections' | 'featured' | 'recent' | 'my-library' | 'settings'>('catalog');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Bookmarks logic
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  useEffect(() => {
    if (user?.bookmarks) {
      setBookmarks(user.bookmarks);
    }
  }, [user]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newBookmarks = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id];
    setBookmarks(newBookmarks);
    
    // update user in localStorage
    const usersStr = window.localStorage.getItem("espa_users") || window.localStorage.getItem("ain_users");
    if (usersStr) {
      try {
        const users = JSON.parse(usersStr);
        const userIndex = users.findIndex((u: any) => u.id === user?.id);
        if (userIndex >= 0) {
          users[userIndex].bookmarks = newBookmarks;
          window.localStorage.setItem("espa_users", JSON.stringify(users));
          window.localStorage.removeItem("ain_users");
          
          const updatedUser = { ...user, bookmarks: newBookmarks };
          window.localStorage.setItem("espa_currentUser", JSON.stringify(updatedUser));
          window.localStorage.removeItem("ain_currentUser");
          window.dispatchEvent(new Event('espa_user_changed'));
        }
      } catch (e) {}
    }
  };

  // Resources Mock
  const mockResources = [
    { id: '1', title: 'Curriculum Guide 2024', type: 'PDF', size: '2.4 MB' },
    { id: '2', title: 'Student Evaluation Template', type: 'Template', size: '150 KB' },
    { id: '3', title: 'Classroom Activities Packet', type: 'PDF', size: '5.1 MB' },
  ];

  // Admin form state
  const [editingBook, setEditingBook] = useState<Partial<Book> | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);

  useEffect(() => {
    if (showAdminForm && !editingBook?.id) {
      const draft = window.localStorage.getItem('espa_draft_library_book') || window.localStorage.getItem('ain_draft_library_book');
      if (draft) {
        try {
          setEditingBook(JSON.parse(draft));
        } catch(e) {}
      }
    }
  }, [showAdminForm]);

  useEffect(() => {
    if (showAdminForm && !editingBook?.id && editingBook && Object.keys(editingBook).length > 0) {
      window.localStorage.setItem('espa_draft_library_book', JSON.stringify(editingBook));
    }
  }, [editingBook, showAdminForm]);

  const handleSaveBookDraft = () => {
    window.localStorage.setItem('espa_draft_library_book', JSON.stringify(editingBook || {}));
    toast.success("Book draft saved!");
  };


  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'libraryAdmin' && user?.role !== 'libraryReader' && user?.role !== 'admin' && user?.role !== 'Admin')) {
      navigate('/library/login');
    } else {
      setBooks(getBooks());
    }
  }, [isAuthenticated, user, navigate]);

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' ? true : (selectedCategory === 'Bookmarks' ? bookmarks.includes(b.id) : b.category === selectedCategory);
    return matchesSearch && matchesCat;
  });
  
  const filteredResources = mockResources.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook?.title || !editingBook?.author) return;
    
    
    
    const newBook: Book = {
      id: editingBook.id || Math.random().toString(36).substr(2, 9),
      title: editingBook.title,
      author: editingBook.author,
      category: editingBook.category || CATEGORIES[0],
      coverUrl: editingBook.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800&auto=format&fit=crop',
      content: editingBook.content || undefined,
      driveLink: editingBook.driveLink || undefined,
      uploadDate: editingBook.uploadDate || new Date().toISOString().split('T')[0]
    };
    
    saveBook(newBook);
    setBooks(getBooks());
    window.localStorage.removeItem('espa_draft_library_book');
    window.localStorage.removeItem('ain_draft_library_book');
    setShowAdminForm(false);
    setEditingBook(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this book?')) {
      deleteBook(id);
      setBooks(getBooks());
    }
  };

  const openEdit = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBook(book);
    setShowAdminForm(true);
  };

  return (
    <div className="flex h-[calc(100dvh-80px)] bg-[#FDFCFB] overflow-hidden text-stone-800 selection:bg-[#003828] selection:text-white">
      <FontStyles />
      <Helmet>
        <title>Library Dashboard | ESPA Foundation</title>
        <meta name="description" content="LibraryDashboard for ESPA Foundation." />
      </Helmet>
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200 z-50 flex items-center justify-between px-4 shadow-sm">
        <LibraryLogo className="text-[#003828] h-[32px] w-auto" />
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-stone-600 hover:bg-stone-100 rounded-full">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} w-64 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.05)]`}>
        <div className="py-8 pl-8 pr-4 flex items-center border-b border-stone-100 hidden lg:flex shrink-0 w-full h-[120px]">
            <LibraryLogo className="text-[#003828] h-[32px] w-auto" />
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar pt-20 lg:pt-6">
          <div className="space-y-1">
            <button onClick={() => setActiveTab('catalog')} className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 group ${activeTab === 'catalog' ? 'bg-[#003828] text-[#FDFCFB] shadow-md font-semibold' : 'text-stone-600 hover:bg-stone-100 font-medium'}`}>
              <BookOpen size={20} strokeWidth={activeTab === 'catalog' ? 2.5 : 2} className={`shrink-0 ${activeTab === 'catalog' ? 'text-[#FDFCFB]' : 'text-stone-500 group-hover:text-stone-800'}`} />
              <span className="ml-3 text-sm">Catalog</span>
            </button>
            <button onClick={() => setActiveTab('collections')} className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 group ${activeTab === 'collections' ? 'bg-[#003828] text-[#FDFCFB] shadow-md font-semibold' : 'text-stone-600 hover:bg-stone-100 font-medium'}`}>
              <Layers size={20} strokeWidth={activeTab === 'collections' ? 2.5 : 2} className={`shrink-0 ${activeTab === 'collections' ? 'text-[#FDFCFB]' : 'text-stone-500 group-hover:text-stone-800'}`} />
              <span className="ml-3 text-sm">Collections</span>
            </button>
            <button onClick={() => setActiveTab('featured')} className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 group ${activeTab === 'featured' ? 'bg-[#003828] text-[#FDFCFB] shadow-md font-semibold' : 'text-stone-600 hover:bg-stone-100 font-medium'}`}>
              <Star size={20} strokeWidth={activeTab === 'featured' ? 2.5 : 2} className={`shrink-0 ${activeTab === 'featured' ? 'text-[#FDFCFB]' : 'text-stone-500 group-hover:text-stone-800'}`} />
              <span className="ml-3 text-sm">Featured</span>
            </button>
            <button onClick={() => setActiveTab('recent')} className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 group ${activeTab === 'recent' ? 'bg-[#003828] text-[#FDFCFB] shadow-md font-semibold' : 'text-stone-600 hover:bg-stone-100 font-medium'}`}>
              <Clock size={20} strokeWidth={activeTab === 'recent' ? 2.5 : 2} className={`shrink-0 ${activeTab === 'recent' ? 'text-[#FDFCFB]' : 'text-stone-500 group-hover:text-stone-800'}`} />
              <span className="ml-3 text-sm">Recently Added</span>
            </button>
            <button onClick={() => setActiveTab('my-library')} className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 group ${activeTab === 'my-library' ? 'bg-[#003828] text-[#FDFCFB] shadow-md font-semibold' : 'text-stone-600 hover:bg-stone-100 font-medium'}`}>
              <Library size={20} strokeWidth={activeTab === 'my-library' ? 2.5 : 2} className={`shrink-0 ${activeTab === 'my-library' ? 'text-[#FDFCFB]' : 'text-stone-500 group-hover:text-stone-800'}`} />
              <span className="ml-3 text-sm">My Library</span>
            </button>
          </div>
          <div className="space-y-1 mt-6">
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-4 py-3 rounded-full transition-all duration-200 group ${activeTab === 'settings' ? 'bg-[#003828] text-[#FDFCFB] shadow-md font-semibold' : 'text-stone-600 hover:bg-stone-100 font-medium'}`}>
              <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} className={`shrink-0 ${activeTab === 'settings' ? 'text-[#FDFCFB]' : 'text-stone-500 group-hover:text-stone-800'}`} />
              <span className="ml-3 text-sm">Settings</span>
            </button>
          </div>
        </div>
        
        <div className="p-4 border-t border-stone-100 shrink-0 bg-stone-50">
          <button onClick={() => setShowLogoutConfirm(true)} className={`w-full flex items-center justify-center px-4 gap-3 py-3 text-rose-600 hover:bg-rose-50 rounded-full transition-colors font-semibold shadow-sm border border-rose-100 bg-white`}>
            <LogOut size={18} />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      </div>

        {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-30 lg:hidden backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50/50 pt-16 lg:pt-0 relative z-10">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar scroll-smooth">
          <div className="max-w-[1400px] mx-auto h-full flex flex-col">
        {activeTab === 'settings' ? (
          <SettingsView 
            currentUser={user || {}} 
            setCurrentUser={() => {}} 
            globalUsers={[user]} 
            setUsers={() => {}} 
            showToast={() => {}} 
            addLog={() => {}} 
            twoFactorConfig={null} 
            setTwoFactorConfig={() => {}} 
            setActiveTab={setActiveTab} 
            onNavigate={() => {}}
            funds={[]} 
            setFunds={() => {}} 
            logs={[]}
            setLogs={() => {}}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h1 className="text-3xl font-semibold text-stone-900 flex items-center gap-2">
                  {activeTab === 'catalog' ? 'Digital Library' : 
                   activeTab === 'collections' ? 'Collections' : 
                   activeTab === 'featured' ? 'Featured Books' : 
                   activeTab === 'recent' ? 'Recently Added' : 
                   activeTab === 'my-library' ? 'My Library' : 'Digital Library'}
                </h1>
                <p className="text-stone-500 text-base mt-2 font-medium">Browse and read our collection of educational resources.</p>
              </div>
              
              {isLibraryAdmin && activeTab === 'catalog' && (
                <button 
                  onClick={() => { setEditingBook({}); setShowAdminForm(true); }}
                  className="bg-[#003828] text-[#FDFCFB] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#00261B] transition-colors shadow-sm flex items-center gap-2"
                >
                  <Plus size={18} /> Add Book
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder="Search by title or author..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] transition-all text-sm font-medium shadow-sm placeholder-stone-400"
                />
              </div>
              
              {activeTab === 'catalog' && (
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3.5 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#003828] focus:ring-1 focus:ring-[#003828] cursor-pointer text-sm font-medium shadow-sm"
                >
                  <option value="All">All Categories</option>
                  <option value="Bookmarks">My Bookmarks</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <div className="flex bg-white border border-stone-200/80 rounded-xl p-1 shrink-0 shadow-sm items-center">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-[#003828]/5 text-[#003828] ' : 'text-stone-400 hover:text-[#003828] '}`}
                >
                  <Grid size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-full transition-colors ${viewMode === 'list' ? 'bg-[#003828]/5 text-[#003828] ' : 'text-stone-400 hover:text-[#003828] '}`}
                >
                  <List size={20} />
                </button>
              </div>
            </div>

            {/* Catalog View */}
            {filteredBooks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-stone-200/60 shadow-sm">
                <BookOpen size={48} className="mx-auto text-[#003828]/40 mb-4" />
                <h3 className="text-xl font-bold mb-2">No books found</h3>
                <p className="text-[#003828]/60">Try adjusting your search or category filter.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id}
                    className="group relative cursor-pointer"
                    onClick={() => setSelectedBook(book)}
                  >
                    <div className="aspect-[2/3] w-full bg-neutral-200 rounded-xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-300 border border-[#003828]/10 relative">
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-[#003828]/0 group-hover:bg-[#003828]/20 transition-colors" />
                    </div>
                    <div className="mt-4">
                      <h3 className="font-bold text-sm leading-tight mb-1 group-hover:text-[#003828] transition-colors">{book.title}</h3>
                      <p className="text-xs text-[#003828]/60">{book.author}</p>
                    </div>
                    {isLibraryAdmin && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={(e) => openEdit(book, e)} className="p-2 bg-white/90 text-[#003828] rounded-full hover:bg-white shadow-sm backdrop-blur-sm"><Edit size={14} /></button>
                        <button onClick={(e) => handleDelete(book.id, e)} className="p-2 bg-white/90 text-red-600 rounded-full hover:bg-white shadow-sm backdrop-blur-sm"><Trash2 size={14} /></button>
                      </div>
                    )}
                       
                    <button 
                      onClick={(e) => toggleBookmark(book.id, e)} 
                      className={`absolute top-2 ${isLibraryAdmin ? 'left-2' : 'right-2'} p-2 rounded-full backdrop-blur-sm shadow-sm transition-all z-10 ${bookmarks.includes(book.id) ? 'bg-[#003828] text-white opacity-100' : 'bg-white/90 text-stone-400 hover:text-[#003828] opacity-0 group-hover:opacity-100'}`}
                    >
                      <Bookmark size={16} fill={bookmarks.includes(book.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredBooks.map((book) => (
                  <div 
                    key={book.id}
                    onClick={() => setSelectedBook(book)}
                    className="flex items-center gap-6 bg-white p-4 rounded-2xl border border-stone-200/80 cursor-pointer hover:border-[#003828]/50 transition-colors shadow-sm group"
                  >
                    <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-200 ">
                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-[#003828] transition-colors">{book.title}</h3>
                      <p className="text-[#003828]/60 text-sm mb-2">{book.author}</p>
                      <span className="text-xs font-bold bg-[#003828]/5 px-2 py-1 rounded-md">{book.category}</span>
                    </div>
                    <div className="text-right hidden sm:block px-4">
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Added</p>
                      <p className="text-sm font-medium">{book.uploadDate}</p>
                    </div>
                       
                    {isLibraryAdmin && (
                      <div className="flex gap-2 px-2 shrink-0">
                        <button onClick={(e) => openEdit(book, e)} className="p-2 text-stone-400 hover:text-[#003828] transition-colors"><Edit size={18} /></button>
                        <button onClick={(e) => handleDelete(book.id, e)} className="p-2 text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    )}
                       
                    <button 
                      onClick={(e) => toggleBookmark(book.id, e)} 
                      className={`p-2 rounded-full transition-colors shrink-0 ${bookmarks.includes(book.id) ? 'text-[#003828]' : 'text-stone-300 hover:text-[#003828]'}`}
                    >
                      <Bookmark size={20} fill={bookmarks.includes(book.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-stone-900 mb-2">Log Out</h3>
            <p className="text-stone-500 mb-6 text-sm">Are you sure you want to log out of the digital library?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-full text-sm">Cancel</button>
              <button onClick={() => { setShowLogoutConfirm(false); window.localStorage.removeItem('espa_currentUser'); window.localStorage.removeItem('ain_currentUser'); window.dispatchEvent(new Event('espa_user_changed')); navigate('/library/login'); }} className="px-4 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-full text-sm">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
