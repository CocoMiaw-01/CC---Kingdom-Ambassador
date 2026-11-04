import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Save,
  X,
  ShieldCheck,
  Loader2,
  Check,
  AlertCircle,
  Award,
} from 'lucide-react';
import { AdvisorMember } from '../data/committeeData';
import {
  countWords,
  computeInitials,
} from '../lib/firebase';

interface AdvisoryCouncilViewProps {
  advisors: AdvisorMember[];
  isAdmin: boolean;
  onSaveAdvisor: (advisor: AdvisorMember) => Promise<void>;
  onDeleteAdvisor: (advisorId: string) => Promise<void>;
  onBackToOverview: () => void;
}

// Helper to resize and compress uploaded advisor photo into a lightweight Data URL (< 120KB)
function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file selected.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressed);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const AdvisoryCouncilView: React.FC<AdvisoryCouncilViewProps> = ({
  advisors,
  isAdmin,
  onSaveAdvisor,
  onDeleteAdvisor,
  onBackToOverview,
}) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingAdvisorId, setEditingAdvisorId] = useState<string | null>(null);

  // Form Fields
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [localChurch, setLocalChurch] = useState('');
  const [ministry, setMinistry] = useState('');
  const [officeLine, setOfficeLine] = useState('');
  const [details, setDetails] = useState('');

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(details);
  const isOverWordLimit = wordCount > 700;

  const handleOpenAddForm = () => {
    setEditingAdvisorId(null);
    setPhotoUrl('');
    setName('');
    setLocalChurch('');
    setMinistry('');
    setOfficeLine('');
    setDetails('');
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEditForm = (adv: AdvisorMember) => {
    setEditingAdvisorId(adv.id);
    setPhotoUrl(adv.photoUrl || '');
    setName(adv.name);
    setLocalChurch(adv.localChurch);
    setMinistry(adv.ministry);
    setOfficeLine(adv.officeLine);
    setDetails(adv.details);
    setFormError(null);
    setFormOpen(true);
  };

  const handleDeleteClick = async (adv: AdvisorMember) => {
    if (!isAdmin) return;
    setDeletingId(adv.id);
    try {
      await onDeleteAdvisor(adv.id);
      if (editingAdvisorId === adv.id) {
        setFormOpen(false);
        setEditingAdvisorId(null);
      }
      setSaveSuccessToast(`Deleted advisory profile for ${adv.name}`);
      setTimeout(() => setSaveSuccessToast(null), 3200);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to delete advisor profile.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormError(null);
    setUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file);
      setPhotoUrl(compressedDataUrl);
    } catch (err: any) {
      setFormError(err?.message || 'Could not process the selected image.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !localChurch.trim() || !ministry.trim() || !officeLine.trim() || !details.trim()) {
      setFormError('Please fill in all required advisor details.');
      return;
    }

    if (wordCount > 700) {
      setFormError(`Details must be at most 700 words (currently ${wordCount} words).`);
      return;
    }

    setSaving(true);
    try {
      const advisorPayload: AdvisorMember = {
        id: editingAdvisorId || `adv-${Date.now()}`,
        name: name.trim(),
        localChurch: localChurch.trim(),
        ministry: ministry.trim(),
        officeLine: officeLine.trim(),
        details: details.trim(),
        photoUrl: photoUrl.trim(),
      };

      await onSaveAdvisor(advisorPayload);
      setFormOpen(false);
      setSaveSuccessToast(
        editingAdvisorId
          ? `Updated advisor profile for ${advisorPayload.name}`
          : `Added ${advisorPayload.name} to Advisory Council`
      );
      setTimeout(() => setSaveSuccessToast(null), 3200);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save advisor details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <button
              type="button"
              onClick={onBackToOverview}
              className="hover:text-[#6D28D9] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Overview
            </button>
            <span>&middot;</span>
            <span className="text-[#6D28D9] font-semibold">Advisory Council</span>
          </div>

          <h2 className="text-2xl font-bold text-[#111827]">
            Kingdom Ambassador Advisory Council ({advisors.length})
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Pastoral, church, and faculty advisors providing spiritual oversight for our campus committee
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C19B26] text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Advisor</span>
            </button>
          </div>
        )}
      </div>

      {/* Save / Delete Success Notice */}
      {saveSuccessToast && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-[#15803D] flex items-center gap-2.5">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveSuccessToast}</span>
        </div>
      )}

      {/* ADMIN ADD / EDIT / UPDATE ADVISOR MODAL */}
      {formOpen && isAdmin && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#14245B]/55 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div
              className="shrink-0 px-6 py-4 text-white flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #14245B 0%, #3B1485 65%, #6D28D9 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-[#D4AF37]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingAdvisorId ? 'Edit & Update Advisory Profile' : 'Add Advisory Council Profile'}
                  </h3>
                  <p className="text-xs text-white/80">
                    Admin Editor &middot; Live updates publish immediately to Public, SA, and Admin
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close advisor form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#DC2626] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Upload Advisor Picture */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#374151] mb-2">
                    Upload advisor picture
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                    <div className="w-20 h-20 rounded-2xl bg-[#EDE9FE] text-[#6D28D9] border border-[#6D28D9]/20 flex items-center justify-center overflow-hidden shrink-0 font-extrabold text-xl">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={name || 'Advisor preview'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{computeInitials(name || 'KA')}</span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingPhoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#6D28D9] text-xs font-bold text-[#14245B] flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6D28D9]" />
                              <span>Processing Image...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 text-[#6D28D9]" />
                              <span>Choose Picture File</span>
                            </>
                          )}
                        </button>
                        {photoUrl && (
                          <button
                            type="button"
                            onClick={() => setPhotoUrl('')}
                            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            Remove Picture
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6B7280]">
                        Supports JPG, PNG, or WebP portrait photos. Automatically optimized for instant live sync.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Names & Local Churches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Names: *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      placeholder="e.g., Rev. Dr. David Lim"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Local Churches: *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={160}
                      placeholder="e.g., Grace Covenant Community Church"
                      value={localChurch}
                      onChange={(e) => setLocalChurch(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                </div>

                {/* 3. Ministry & Contact No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Ministry: *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={160}
                      placeholder="e.g., Senior Pastor & Campus Leadership Mentor"
                      value={ministry}
                      onChange={(e) => setMinistry(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Contact No: *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={60}
                      placeholder="e.g., +65 6789 4321"
                      value={officeLine}
                      onChange={(e) => setOfficeLine(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                    />
                  </div>
                </div>

                {/* 4. Details (max 700 words) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#374151]">
                      Details: (max 700 words) *
                    </label>
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        isOverWordLimit ? 'text-[#DC2626]' : 'text-[#6B7280]'
                      }`}
                    >
                      {wordCount} / 700 words
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    required
                    maxLength={5000}
                    placeholder="Share advisor background, pastoral heart, and campus ministry details (up to 700 words)..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:outline-none ${
                      isOverWordLimit
                        ? 'border-[#DC2626] focus:border-[#DC2626]'
                        : 'border-[#E5E7EB] focus:border-[#6D28D9]'
                    }`}
                  />
                </div>
              </div>

              {/* Sticky Form Footer Actions */}
              <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAFC]">
                <div>
                  {editingAdvisorId && (
                    <button
                      type="button"
                      disabled={deletingId === editingAdvisorId}
                      onClick={() => {
                        const target = advisors.find((a) => a.id === editingAdvisorId);
                        if (target) handleDeleteClick(target);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-[#DC2626] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Profile</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#4B5563] hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || isOverWordLimit}
                    className="px-6 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{editingAdvisorId ? 'Update Profile' : 'Save Profile'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADVISORY COUNCIL CARDS GRID */}
      {advisors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">
            No Advisory Council Profiles Yet
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto">
            {isAdmin
              ? 'Click "Add Advisor" above to add pastoral, church, or faculty advisors.'
              : 'Advisory Council profiles will appear here once published.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {advisors.map((advisor) => (
            <article
              key={advisor.id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-6 hover:border-[#6D28D9]/40 transition-colors flex flex-col justify-between gap-5"
            >
              <div className="space-y-4">
                {/* Top Row: Advisor Picture + Names + Admin Edit/Update & Delete Buttons */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EDE9FE] text-[#6D28D9] border border-[#6D28D9]/20 flex items-center justify-center overflow-hidden shrink-0 font-extrabold text-xl shadow-2xs">
                      {advisor.photoUrl ? (
                        <img
                          src={advisor.photoUrl}
                          alt={advisor.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{computeInitials(advisor.name)}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#6D28D9]">
                        Advisory Council
                      </p>
                      <h3 className="text-lg font-extrabold text-[#111827] mt-0.5 truncate">
                        {advisor.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-semibold text-[#14245B] mt-0.5">
                        {advisor.ministry}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditForm(advisor)}
                        className="px-3 py-2 rounded-xl border border-[#E5E7EB] hover:border-[#6D28D9] hover:bg-[#F3E8FF]/40 text-xs font-bold text-[#6D28D9] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Edit and update advisor profile"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Update</span>
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === advisor.id}
                        onClick={() => handleDeleteClick(advisor)}
                        className="p-2 rounded-xl border border-[#E5E7EB] hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-[#DC2626] transition-colors cursor-pointer"
                        title="Delete advisor profile"
                      >
                        {deletingId === advisor.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#DC2626]" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Structured Advisor Metadata */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs sm:text-[13px]">
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-[#14245B] min-w-[115px] shrink-0">
                      Names:
                    </span>
                    <span className="text-[#111827] font-semibold">{advisor.name}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-[#14245B] min-w-[115px] shrink-0">
                      Local Churches:
                    </span>
                    <span className="text-[#374151]">{advisor.localChurch}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-[#14245B] min-w-[115px] shrink-0">
                      Ministry:
                    </span>
                    <span className="text-[#374151]">{advisor.ministry}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="font-bold text-[#14245B] min-w-[115px] shrink-0">
                      Contact No:
                    </span>
                    <span className="text-[#374151] tabular-nums">{advisor.officeLine}</span>
                  </div>
                </div>

                {/* Advisor Details (Max 700 words) */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
                    Details
                  </p>
                  <p className="text-xs sm:text-sm text-[#374151] leading-relaxed whitespace-pre-line">
                    {advisor.details}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
