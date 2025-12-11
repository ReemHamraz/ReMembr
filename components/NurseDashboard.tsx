import React, { useState, useRef } from 'react';
import { Visitor, VisitorType } from '../types';
import { Plus, Trash2, Upload, Save, X, Search, Shield, ShieldAlert, Users, Lock, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { validateReferencePhoto } from '../services/geminiService';

interface NurseDashboardProps {
  visitors: Visitor[];
  onUpdateVisitors: (visitors: Visitor[]) => void;
  onSwitchMode: () => void;
}

export const NurseDashboard: React.FC<NurseDashboardProps> = ({ visitors, onUpdateVisitors, onSwitchMode }) => {
  const [activeTab, setActiveTab] = useState<VisitorType>('trusted');
  const [isAdding, setIsAdding] = useState(false);
  
  // Deletion State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newRel, setNewRel] = useState('');
  const [newLastInt, setNewLastInt] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter visitors by tab
  const displayedVisitors = visitors.filter(v => v.type === activeTab);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto(reader.result as string);
        setValidationError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewRel('');
    setNewLastInt('');
    setNewNotes('');
    setNewPhoto('');
    setValidationError(null);
    setIsAdding(false);
  };

  const handleAddVisitor = async () => {
    if (!newName || !newPhoto) {
      setValidationError("Name and Photo are required.");
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Timeout the validation after 10 seconds to prevent hangs
      const validationPromise = validateReferencePhoto(newPhoto);
      const timeoutPromise = new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error("Validation timeout")), 10000));
      
      const hasFace = await Promise.race([validationPromise, timeoutPromise]);
      
      if (!hasFace) {
        setValidationError("No clear face detected. Please ensure the person is facing the camera.");
        setIsValidating(false);
        return;
      }

      const visitor: Visitor = {
        id: crypto.randomUUID(),
        name: newName,
        relationship: newRel || (activeTab === 'blocked' ? 'Restricted' : 'Visitor'),
        lastInteraction: newLastInt || "No recorded interaction.",
        notes: newNotes,
        photoBase64: newPhoto,
        type: activeTab
      };

      onUpdateVisitors([...visitors, visitor]);
      resetForm();
    } catch (error: any) {
      console.error(error);
      if (error.message === "QUOTA_EXCEEDED") {
         setValidationError("System is currently busy (Rate Limit Reached). Please wait a moment and try again.");
      } else {
         setValidationError("Validation failed. Please try again.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const confirmDelete = () => {
    if (deleteId) {
      onUpdateVisitors(visitors.filter(v => v.id !== deleteId));
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg shadow-blue-600/20">
                <Shield size={20} />
             </div>
             <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">ReMembr</h1>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                  <Lock size={10} /> Caregiver Access
                </div>
             </div>
          </div>
          <button 
            onClick={onSwitchMode}
            aria-label="Switch to Patient View"
            className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all font-medium text-sm shadow-md hover:shadow-xl active:scale-95"
          >
            Launch Patient HUD <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full">
        
        {/* Intro / Stats */}
        <div className="mb-8">
           <h2 className="text-2xl font-semibold text-slate-800">Identity Database</h2>
           <p className="text-slate-500 mt-1">Manage recognized faces stored in the encrypted local vault.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('trusted')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'trusted' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={18} /> Trusted Visitors
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{visitors.filter(v => v.type === 'trusted').length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('blocked')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 whitespace-nowrap ${activeTab === 'blocked' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <ShieldAlert size={18} /> Restricted / Blacklist
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{visitors.filter(v => v.type === 'blocked').length}</span>
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search profiles..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-slate-900" 
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className={`w-full sm:w-auto px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${activeTab === 'trusted' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            <Plus size={18} />
            Add {activeTab === 'trusted' ? 'Visitor' : 'Restriction'}
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex flex-col items-center text-center">
                   <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4">
                      <Trash2 size={32} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Profile?</h3>
                   <p className="text-sm text-slate-500 mb-6">
                     Are you sure you want to remove this person from the recognition database? This action cannot be undone.
                   </p>
                   <div className="flex gap-3 w-full">
                      <button 
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmDelete}
                        className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-md transition"
                      >
                        Delete
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Add Visitor Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-lg text-slate-800">
                  {activeTab === 'trusted' ? 'Register New Visitor' : 'Add Restricted Person'}
                </h3>
                <button onClick={resetForm}><X className="text-slate-400 hover:text-slate-600" /></button>
              </div>
              
              <div className="p-6 space-y-5">
                {validationError && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex gap-2">
                    <AlertTriangle size={18} className="shrink-0" />
                    {validationError}
                  </div>
                )}

                <div className="flex gap-5">
                  <div 
                    onClick={() => !isValidating && fileInputRef.current?.click()}
                    className={`w-32 h-32 shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors relative overflow-hidden ${isValidating ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {newPhoto ? (
                      <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-center p-2">
                         <Upload className="text-slate-400 mb-1" size={20} />
                         <span className="text-[10px] text-slate-400 font-medium uppercase">Upload Photo</span>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                      <input 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                        placeholder="Full Name"
                        disabled={isValidating}
                        value={newName} onChange={e => setNewName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Relationship</label>
                      <input 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                        placeholder={activeTab === 'trusted' ? "e.g. Daughter" : "e.g. Salesperson"}
                        disabled={isValidating}
                        value={newRel} onChange={e => setNewRel(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                     {activeTab === 'trusted' ? 'Last Interaction Context' : 'Reason for Restriction'}
                   </label>
                   <textarea 
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-shadow" 
                      rows={2}
                      placeholder={activeTab === 'trusted' ? "Visited last Sunday for lunch." : "Aggressive behavior recorded."}
                      disabled={isValidating}
                      value={newLastInt} onChange={e => setNewLastInt(e.target.value)}
                   />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={resetForm} 
                  disabled={isValidating}
                  className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddVisitor}
                  disabled={isValidating}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 ${activeTab === 'trusted' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'} ${isValidating ? 'opacity-80 cursor-wait' : 'shadow-sm'}`}
                >
                  {isValidating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isValidating ? 'Verifying...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedVisitors.map(visitor => (
            <div key={visitor.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex gap-4 relative group animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                <img src={visitor.photoBase64} alt={visitor.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate pr-6">{visitor.name}</h3>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${visitor.type === 'blocked' ? 'text-amber-600' : 'text-blue-600'}`}>
                  {visitor.relationship}
                </p>
                <p className="text-sm text-slate-500 line-clamp-2 leading-snug">
                  {visitor.lastInteraction}
                </p>
              </div>
              <button 
                onClick={() => setDeleteId(visitor.id)}
                aria-label="Delete Profile"
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all p-1 hover:bg-red-50 rounded-md"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {displayedVisitors.length === 0 && (
             <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
               <div className="inline-flex bg-slate-100 p-4 rounded-full text-slate-400 mb-3">
                 {activeTab === 'trusted' ? <Users size={32} /> : <ShieldAlert size={32} />}
               </div>
               <p className="text-slate-500 font-medium">No {activeTab} profiles found.</p>
               <p className="text-xs text-slate-400 mt-1">Use the "Add" button to build the database.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};