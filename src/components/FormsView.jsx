import React, { useState } from 'react';
import { Plus, ClipboardList, ArrowLeft, Check, FileText, CheckSquare, AlignLeft, Type, Users, Save, MoreVertical, Edit, X, Search, Trash2 } from 'lucide-react';
import { ActionMenu } from './SharedComponents';
import DraggableModal from './DraggableModal';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => {
  return typeof document !== 'undefined' ? createPortal(children, document.body) : children;
};

export default function FormsView({ forms, setForms, currentUser, globalUsers, addLog, showToast, onUserClick, archivedForms, setArchivedForms }) {

  const [selectedIds, setSelectedIds] = useState([]);
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredForms.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleMassArchive = () => {
    if (selectedIds.length === 0) return;
    const itemsToArchive = forms.filter(f => selectedIds.includes(f.id)).map(f => ({ ...f, archivedAt: new Date().toISOString() }));
    if (setArchivedForms) setArchivedForms([...(archivedForms || []), ...itemsToArchive]);
    setForms(forms.filter(f => !selectedIds.includes(f.id)));
    addLog(`Archived ${selectedIds.length} forms`);
    showToast(`Archived ${selectedIds.length} forms successfully`, 'success');
    setSelectedIds([]);
  };

  const filteredForms = (forms || []).filter(form => form.title.toLowerCase().includes(searchTerm.toLowerCase()) || (form.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [isResponsesModalOpen, setIsResponsesModalOpen] = useState(false);

  const [currentForm, setCurrentForm] = useState(null);
  const [newForm, setNewForm] = useState({ title: '', description: '', fields: [] });
  const [responses, setResponses] = useState({});

  const canCreate = ['Admin', 'In-Country Coordinator', 'Deputy Lead Coordinator', 'Lead Coordinator'].includes(currentUser.role);

  const handleCreateForm = () => {
    if (!newForm.title) {
      showToast('Form title is required', 'error');
      return;
    }
    const formId = `FORM-${Date.now()}`;
    const newF = {
      id: formId,
      title: newForm.title,
      description: newForm.description,
      fields: newForm.fields,
      responses: [],
      createdBy: currentUser.id, hostId: currentUser?.role === 'Host' ? currentUser.id : currentUser?.hostId || null,
      dateCreated: new Date().toISOString()
    };
    setForms([newF, ...forms]);
    showToast('Form created successfully', 'success');
    addLog(`Created new form: ${newForm.title}`);
    setIsCreateModalOpen(false);
    setNewForm({ title: '', description: '', fields: [] });
  };

  const addField = (type) => {
    setNewForm({
      ...newForm,
      fields: [...newForm.fields, { id: `field-${Date.now()}`, type, label: 'New Field', required: false, options: type === 'select' ? 'Option 1, Option 2' : '' }]
    });
  };

  const updateField = (id, key, val) => {
    setNewForm({
      ...newForm,
      fields: (newForm.fields || []).map(f => f.id === id ? { ...f, [key]: val } : f)
    });
  };

  const removeField = (id) => {
    setNewForm({
      ...newForm,
      fields: newForm.fields.filter(f => f.id !== id)
    });
  };

  const handleSubmitResponse = () => {
    const unfilledRequired = (currentForm.fields || []).filter(f => f.required && !responses[f.id]);
    if (unfilledRequired.length > 0) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    const responseObj = {
      userId: currentUser.id,
      date: new Date().toISOString(),
      answers: responses
    };
    
    const updatedForms = (forms || []).map(f => {
      if (f.id === currentForm.id) {
        return { ...f, responses: [...(f.responses || []), responseObj] };
      }
      return f;
    });
    
    setForms(updatedForms);
    showToast('Response submitted successfully', 'success');
    addLog(`Submitted response to form: ${currentForm.title}`);
    setIsRespondModalOpen(false);
    setResponses({});
  };

  return (
    <div className="space-y-8 tracking-tight h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-semibold text-black">Forms</h1>
          <p className="text-stone-500 text-sm mt-2 font-medium">Manage Customizable Forms, Collect Information, and Monitor Responses.</p>
        </div>
        {selectedIds.length > 0 ? (
          <button onClick={handleMassArchive} className="px-5 py-2.5 bg-rose-600 text-white rounded-full font-semibold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm">
            <Trash2 size={18} /> Archive Selected ({selectedIds.length})
          </button>
        ) : (
          canCreate && (
            <button onClick={() => { setNewForm({ title: '', description: '', fields: [] }); setIsCreateModalOpen(true); }} className="bg-[#004B36] text-[#FDFCFB] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#003828] transition-colors shadow-sm flex items-center gap-2">
              <Plus size={16} className="text-[#FDFCFB]" /> Create Form
            </button>
          )
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} strokeWidth={1.5} />
        <input type="text" placeholder="Search forms by title or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200/80 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm shadow-sm" />
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-stone-200/60 shadow-sm flex flex-col overflow-hidden">
        <div className="w-full overflow-x-auto pb-16">
          {filteredForms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl">
              <h3 className="text-xl font-bold text-stone-900 mb-2">No Forms Found</h3>
              <p className="text-stone-500 font-medium">There are currently no items to display in this section.</p>
            </div>
          ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-xs tracking-wider bg-stone-50/50 rounded-t-2xl">
                <th className="pl-12 pr-6 py-5 font-medium uppercase w-[30%]">Title</th>
                <th className="px-6 py-5 font-medium uppercase w-[50%]">Responses</th>
                <th className="px-6 py-5 font-medium uppercase text-center w-[20%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredForms.map(form => {
                const hasResponded = (form.responses || []).some(r => r.userId === currentUser.id);
                return (
                  <tr key={form.id} className="hover:bg-[#FDFCFB] transition-colors">
                    <td className="pl-12 pr-6 py-4 text-sm font-medium text-stone-900">
                      <button onClick={() => { setCurrentForm(form); setResponses({}); setIsRespondModalOpen(true); }} className="text-stone-900 hover:text-[#004B36] font-medium focus:outline-none text-left">
                        {form.title}
                      </button>
                    </td>
                    <td className="px-6 py-4 align-middle text-sm font-medium text-stone-900">
                      <button onClick={() => { if(canCreate) { setCurrentForm(form); setIsResponsesModalOpen(true); } }} className="text-stone-900 hover:text-[#004B36] font-medium focus:outline-none">
                        {(form.responses || []).length}
                      </button>
                    </td>
                    <td className="px-6 py-4 align-middle text-center">
                      <ActionMenu id={form.id} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}>
                        <button 
                          onClick={() => { setActiveDropdown(null); setCurrentForm(form); setResponses({}); setIsRespondModalOpen(true); }}
                          disabled={hasResponded && !canCreate}
                          className="w-full text-left px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit size={16} className="text-[#004B36]"/> {hasResponded ? 'View Form' : 'Fill Form'}
                        </button>
                        {canCreate && (
                          <button onClick={() => { setActiveDropdown(null); setCurrentForm(form); setIsResponsesModalOpen(true); }} className="w-full text-left px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 font-medium flex items-center gap-2">
                            <Users size={16} className="text-[#004B36]" /> View Responses
                          </button>
                        )}
                      </ActionMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {isCreateModalOpen && (
        <Portal>
          <>
            <div className="fixed inset-0 z-[200] animate-in fade-in bg-stone-900/60 backdrop-blur-sm" />
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
              <DraggableModal className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 w-full max-w-4xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-stone-100 bg-[#FDFCFB] flex-shrink-0 drag-handle cursor-grab active:cursor-grabbing touch-none flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-stone-900 tracking-tight pointer-events-none flex items-center gap-2">
                    <ClipboardList size={20} className="text-[#004B36]" /> Create New Form
                  </h3>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors pointer-events-auto">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">
                  <div className="md:w-1/3 lg:w-1/4 bg-stone-50 border-r border-stone-200/60 p-5 flex flex-col gap-3 shrink-0">
                    <h3 className="block text-xs font-bold text-stone-500 tracking-wider uppercase mb-2">Add Fields</h3>
                    <button onClick={() => addField('text')} className="flex items-center gap-3 w-full text-left p-3 rounded-full bg-white border border-stone-200 hover:border-[#004B36] hover:text-[#004B36] transition-all font-medium text-sm text-stone-600 shadow-sm">
                      <Type size={18} /> Short Text
                    </button>
                    <button onClick={() => addField('textarea')} className="flex items-center gap-3 w-full text-left p-3 rounded-full bg-white border border-stone-200 hover:border-[#004B36] hover:text-[#004B36] transition-all font-medium text-sm text-stone-600 shadow-sm">
                      <AlignLeft size={18} /> Long Text
                    </button>
                    <button onClick={() => addField('checkbox')} className="flex items-center gap-3 w-full text-left p-3 rounded-full bg-white border border-stone-200 hover:border-[#004B36] hover:text-[#004B36] transition-all font-medium text-sm text-stone-600 shadow-sm">
                      <CheckSquare size={18} /> Checkbox
                    </button>
                    <button onClick={() => addField('select')} className="flex items-center gap-3 w-full text-left p-3 rounded-full bg-white border border-stone-200 hover:border-[#004B36] hover:text-[#004B36] transition-all font-medium text-sm text-stone-600 shadow-sm">
                      <ClipboardList size={18} /> Dropdown
                    </button>
                    <button onClick={() => addField('date')} className="flex items-center gap-3 w-full text-left p-3 rounded-full bg-white border border-stone-200 hover:border-[#004B36] hover:text-[#004B36] transition-all font-medium text-sm text-stone-600 shadow-sm">
                      <FileText size={18} /> Date
                    </button>
                  </div>
                  
                  <div className="md:w-2/3 lg:w-3/4 p-6 sm:p-8 space-y-6">
                    <div className="space-y-4 border-b border-stone-100 pb-6">
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1 tracking-wider uppercase">Form Title<span className="text-red-500 font-medium">*</span></label>
                        <input type="text" value={newForm.title} onChange={e => setNewForm({...newForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm font-medium text-stone-800" placeholder="e.g. Activity Waiver" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1 tracking-wider uppercase">Description</label>
                        <textarea value={newForm.description} onChange={e => setNewForm({...newForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm font-medium text-stone-800 min-h-[80px]" placeholder="Instructions for the form..."></textarea>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="block text-xs font-bold text-stone-500 tracking-wider uppercase">Form Fields</h3>
                      {newForm.fields.length === 0 ? (
                        <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-stone-200/80 text-stone-400 text-sm font-medium">
                          <ClipboardList size={40} className="mx-auto mb-3 text-stone-300" />
                          No fields added yet.
                        </div>
                      ) : (
                        (newForm.fields || []).map((f, i) => (
                          <div key={f.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex gap-4 items-start relative group">
                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between">
                                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider bg-white px-2 py-0.5 rounded shadow-sm border border-stone-100">{f.type}</span>
                                <button onClick={() => removeField(f.id)} className="text-rose-500 text-xs font-medium hover:underline">Remove</button>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1 uppercase">Field Label</label>
                                <input type="text" value={f.label} onChange={e => updateField(f.id, 'label', e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#004B36] text-sm font-medium" />
                              </div>
                              {(f.type === 'select' || f.type === 'checkbox') && (
                                <div>
                                  <label className="block text-xs font-medium text-stone-500 mb-1 uppercase">Options (comma-separated)</label>
                                  <input type="text" value={f.options || ''} onChange={e => updateField(f.id, 'options', e.target.value)} className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#004B36] text-sm font-medium" placeholder={f.type === 'checkbox' ? "Leave empty for a single yes/no checkbox" : "Option 1, Option 2, Option 3"} />
                                </div>
                              )}
                              {f.type === 'checkbox' && f.options && (
                                <label className="flex items-center gap-2 text-sm font-medium text-stone-600 cursor-pointer w-max">
                                  <input type="checkbox" checked={f.multiSelect !== false} onChange={e => updateField(f.id, 'multiSelect', e.target.checked)} className="rounded accent-[#004B36] text-[#004B36] focus:ring-[#004B36]" />
                                  Allow multiple selections
                                </label>
                              )}
                              <label className="flex items-center gap-2 text-sm font-medium text-stone-600 cursor-pointer w-max">
                                <input type="checkbox" checked={f.required} onChange={e => updateField(f.id, 'required', e.target.checked)} className="rounded accent-[#004B36] text-[#004B36] focus:ring-[#004B36]" />
                                Required Field
                              </label>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FDFCFB] flex-shrink-0 flex justify-end gap-3 pointer-events-auto">
                  <button onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-[#004B36] border border-[#004B36] hover:bg-stone-50 rounded-full transition-colors">Cancel</button>
                  <button onClick={handleCreateForm} className="bg-[#004B36] text-[#FDFCFB] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#003828] transition-colors shadow-sm flex items-center gap-2">
                    <Check size={16} /> Save Form
                  </button>
                </div>
              </DraggableModal>
            </div>
          </>
        </Portal>
      )}

      {isRespondModalOpen && currentForm && (
        <Portal>
          <>
            <div className="fixed inset-0 z-[200] animate-in fade-in bg-stone-900/60 backdrop-blur-sm" />
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
              <DraggableModal className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-stone-100 bg-[#FDFCFB] flex-shrink-0 drag-handle cursor-grab active:cursor-grabbing touch-none flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-stone-900 tracking-tight pointer-events-none flex items-center gap-2">
                    <ClipboardList size={20} className="text-[#004B36]" /> {currentForm.title}
                  </h3>
                  <button onClick={() => setIsRespondModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors pointer-events-auto">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                  {currentForm.description && (
                    <p className="text-sm font-medium text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-100">{currentForm.description}</p>
                  )}

                  <div className="space-y-6">
                    {(currentForm.fields || []).map(f => (
                      <div key={f.id}>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          {f.label} {f.required && <span className="text-red-500 font-medium">*</span>}
                        </label>
                        {f.type === 'text' && (
                          <input type="text" value={responses[f.id] || ''} onChange={e => setResponses({...responses, [f.id]: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm font-medium text-stone-800" placeholder="Your answer" />
                        )}
                        {f.type === 'textarea' && (
                          <textarea value={responses[f.id] || ''} onChange={e => setResponses({...responses, [f.id]: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm font-medium min-h-[100px] text-stone-800" placeholder="Your answer"></textarea>
                        )}
                        {f.type === 'checkbox' && (
                          f.options ? (
                            <div className="space-y-2 mt-2">
                              {(f.options || "").split(',').map((opt, i) => {
                                const optVal = opt.trim();
                                if (!optVal) return null;
                                const isChecked = f.multiSelect === false 
                                  ? responses[f.id] === optVal 
                                  : Array.isArray(responses[f.id]) && responses[f.id].includes(optVal);
                                return (
                                  <label key={i} className="flex items-start gap-3 cursor-pointer font-medium">
                                    <input 
                                      type={f.multiSelect === false ? "radio" : "checkbox"} 
                                      name={f.multiSelect === false ? f.id : undefined}
                                      checked={isChecked} 
                                      onChange={e => {
                                        if (f.multiSelect === false) {
                                          setResponses({...responses, [f.id]: optVal});
                                        } else {
                                          const current = Array.isArray(responses[f.id]) ? responses[f.id] : [];
                                          setResponses({...responses, [f.id]: e.target.checked ? [...current, optVal] : current.filter(x => x !== optVal)});
                                        }
                                      }} 
                                      className={`mt-1 text-[#004B36] focus:ring-[#004B36] ${f.multiSelect === false ? '' : 'rounded'}`} 
                                    />
                                    <span className="text-sm font-medium text-stone-700 leading-snug">{optVal}</span>
                                  </label>
                                )
                              })}
                            </div>
                          ) : (
                            <label className="flex items-start gap-3 mt-2 cursor-pointer font-medium">
                              <input type="checkbox" checked={responses[f.id] || false} onChange={e => setResponses({...responses, [f.id]: e.target.checked})} className="mt-1 rounded accent-[#004B36] text-[#004B36] focus:ring-[#004B36]" />
                              <span className="text-sm font-medium text-stone-700 leading-snug">{f.label}</span>
                            </label>
                          )
                        )}
                        {f.type === 'date' && (
                          <input type="date" value={responses[f.id] || ''} onChange={e => setResponses({...responses, [f.id]: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm font-medium text-stone-800" />
                        )}
                        {f.type === 'select' && (
                          <select value={responses[f.id] || ''} onChange={e => setResponses({...responses, [f.id]: e.target.value})} className="w-full px-4 py-2.5 bg-transparent border border-stone-200 rounded-xl focus:outline-none focus:border-[#004B36] focus:ring-1 focus:ring-[#004B36] transition-all text-sm font-medium appearance-none text-stone-800">
                            <option value="" disabled>Select an option</option>
                            {(f.options || '').split(',').map((opt, i) => (
                              <option key={i} value={opt.trim()}>{opt.trim()}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="px-5 sm:px-8 py-4 sm:py-5 border-t border-stone-100 bg-[#FDFCFB] flex-shrink-0 flex justify-end gap-3 pointer-events-auto">
                  <button onClick={() => setIsRespondModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-[#004B36] border border-[#004B36] hover:bg-stone-50 rounded-full transition-colors">Cancel</button>
                  <button onClick={handleSubmitResponse} disabled={(currentForm.responses || []).some(r => r.userId === currentUser.id) && !canCreate} className="bg-[#004B36] text-[#FDFCFB] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#003828] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save size={16} /> Submit Response
                  </button>
                </div>
              </DraggableModal>
            </div>
          </>
        </Portal>
      )}

      {isResponsesModalOpen && currentForm && (
        <Portal>
          <>
            <div className="fixed inset-0 z-[200] animate-in fade-in bg-stone-900/60 backdrop-blur-sm" />
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
              <DraggableModal className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-stone-200 w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-stone-100 bg-[#FDFCFB] flex-shrink-0 drag-handle cursor-grab active:cursor-grabbing touch-none flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900 tracking-tight pointer-events-none flex items-center gap-2">
                      <Users size={20} className="text-[#004B36]" /> {currentForm.title} - Responses
                    </h3>
                    <p className="text-sm font-medium text-stone-500 mt-1 pointer-events-none">{(currentForm.responses || []).length} Submissions</p>
                  </div>
                  <button onClick={() => setIsResponsesModalOpen(false)} className="text-stone-400 hover:text-stone-600 transition-colors pointer-events-auto self-start">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                  {(currentForm.responses || []).map((resp, i) => {
                    const user = globalUsers?.find(u => u.id === resp.userId) || { name: resp.userId, id: resp.userId };
                    return (
                      <div key={i} className="bg-stone-50 rounded-2xl border border-stone-200 p-6">
                        <div className="flex items-center gap-3 mb-4 border-b border-stone-200 pb-4">
                          <div className="w-10 h-10 rounded-full bg-[#004B36] text-white flex items-center justify-center font-medium text-sm shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-stone-900">
                              {canViewUser(user) ? (
                                <button onClick={(e) => { e.stopPropagation(); onUserClick(user); }} className="hover:underline focus:outline-none">{user.name}</button>
                              ) : (
                                <span>{user.name}</span>
                              )}
                            </div>
                            <div className="text-xs text-stone-500 font-medium">{new Date(resp.date).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="space-y-5">
                          {(currentForm.fields || []).map(f => (
                            <div key={f.id}>
                              <div className="text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">{f.label}</div>
                              <div className="text-sm font-medium text-stone-800 bg-white p-3 rounded-xl border border-stone-100 shadow-sm">
                                {f.type === 'checkbox' ? (
                                  f.options ? (
                                    Array.isArray(resp.answers[f.id]) && resp.answers[f.id].length > 0 
                                      ? resp.answers[f.id].join(', ') 
                                      : <span className="text-stone-400 italic font-medium">No Data Available</span>
                                  ) : (
                                    resp.answers[f.id] ? '✅ Yes/Agreed' : '❌ No'
                                  )
                                ) : (resp.answers[f.id] || <span className="text-stone-400 italic font-medium">No Data Available</span>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {(currentForm.responses || []).length === 0 && (
                    <div className="text-center p-12 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 text-stone-500 font-medium">
                      <Users size={40} className="mx-auto mb-3 text-stone-300" />
                      No responses yet.
                    </div>
                  )}
                </div>
              </DraggableModal>
            </div>
          </>
        </Portal>
      )}
    </div>
  );
}
