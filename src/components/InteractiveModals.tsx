import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Megaphone,
  CheckCircle2,
  Pin,
  Check,
  Edit3,
  Trash2,
  Save,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import {
  CommitteeEvent,
  CommitteeAnnouncement,
  CommitteeTask,
  TaskPriority,
} from '../data/committeeData';

const DEFAULT_EVENT_POSTER =
  '/assets/aistudio/da4d912a-c6c0-4c13-bed2-500c99697c41_7271609d.jpeg';

// Center-crops and compresses an uploaded image file to a crisp 1:1 square (600x600) Data URL
function compressEventImageTo1x1Square(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file selected.'));
      img.onload = () => {
        const targetSize = 600;
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }

        // Center-crop to 1:1 square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEvent?: CommitteeEvent | null;
  onSaveEvent: (savedEvent: CommitteeEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  initialEvent,
  onSaveEvent,
}) => {
  const [title, setTitle] = useState('');
  const [dateInput, setDateInput] = useState('2026-10-23');
  const [customFullDate, setCustomFullDate] = useState('');
  const [timeRange, setTimeRange] = useState('9:00 AM – 9:30 PM');
  const [location, setLocation] = useState('Christ Church Likas (CCL)');
  const [type, setType] = useState<'Meeting' | 'Worship' | 'Outreach' | 'Prayer'>('Worship');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_EVENT_POSTER);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [setAsFeatured, setSetAsFeatured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title);
      setCustomFullDate(initialEvent.fullDate);
      setTimeRange(initialEvent.timeRange);
      setLocation(initialEvent.location);
      setType(initialEvent.type);
      setDescription(initialEvent.description);
      setImageUrl(initialEvent.imageUrl || DEFAULT_EVENT_POSTER);
      setSetAsFeatured(Boolean(initialEvent.isFeaturedMeeting));
      setDateInput('2026-10-23');
      setImageError(null);
    } else {
      setTitle('');
      setDateInput('2026-10-23');
      setCustomFullDate('');
      setTimeRange('9:00 AM – 9:30 PM');
      setLocation('Christ Church Likas (CCL)');
      setType('Worship');
      setDescription('');
      setImageUrl(DEFAULT_EVENT_POSTER);
      setSetAsFeatured(false);
      setImageError(null);
    }
  }, [initialEvent, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setUploadingImage(true);
    try {
      const squareDataUrl = await compressEventImageTo1x1Square(file);
      setImageUrl(squareDataUrl);
    } catch (err: any) {
      setImageError(err?.message || 'Could not process image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedDate = new Date(dateInput + 'T12:00:00');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthShort = months[parsedDate.getMonth()] || initialEvent?.monthShort || 'OCT';
    const dayNumber = String(parsedDate.getDate() || initialEvent?.dayNumber || 23);
    const dayOfWeek = days[parsedDate.getDay()] || initialEvent?.dayOfWeek || 'Fri';
    const computedDateStr = `${monthNames[parsedDate.getMonth()]} ${dayNumber}, ${parsedDate.getFullYear()}`;
    const fullDate = customFullDate.trim() || computedDateStr;

    const savedEvent: CommitteeEvent = {
      id: initialEvent ? initialEvent.id : `evt-${Date.now()}`,
      title: title.trim(),
      monthShort,
      dayNumber,
      dayOfWeek,
      fullDate,
      timeRange: timeRange.trim() || '9:00 AM – 5:00 PM',
      location: location.trim() || 'Christ Church Likas (CCL)',
      description:
        description.trim() ||
        'Committee gathering to coordinate campus ministry initiatives and worship preparation.',
      type,
      imageUrl: imageUrl || DEFAULT_EVENT_POSTER,
      isFeaturedMeeting: setAsFeatured,
      rsvpStatus: initialEvent?.rsvpStatus || 'Going',
      agenda: initialEvent?.agenda || [
        'Opening Prayer & Scripture Focus',
        'Ministry Team Updates & Action Items',
        'Campus Outreach & Logistics Coordination',
        'Closing Intercession',
      ],
      attendees: initialEvent?.attendees || [
        { initials: 'KA', name: 'Alex Tan', role: 'Committee Member', bgClass: 'bg-[#EDE9FE]', textClass: 'text-[#6D28D9]' },
        { initials: 'JT', name: 'Joshua Tan', role: 'Committee President', bgClass: 'bg-[#E0E7FF]', textClass: 'text-[#4338CA]' },
        { initials: 'MK', name: 'Michelle Koh', role: 'Vice President', bgClass: 'bg-[#CCFBF1]', textClass: 'text-[#0F766E]' },
        { initials: 'SL', name: 'Samuel Lim', role: 'Creative Director', bgClass: 'bg-[#FEF3C7]', textClass: 'text-[#B45309]' },
      ],
    };

    onSaveEvent(savedEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#14245B]/50 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Sticky Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D4AF37] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#B45309]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                {initialEvent ? 'Edit Event' : 'Add Event'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                Upload a 1:1 event poster and fill in event details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content + Sticky Action Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 1:1 Event Picture Upload Section */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-2">
                Event Picture (1:1 Square Format) *
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                {/* 1:1 Square Preview Box */}
                <div className="w-32 h-32 aspect-square rounded-xl border border-[#E5E7EB] bg-white overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Event 1:1 Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover aspect-square"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing 1:1...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload 1:1 Picture</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    Uploaded images are automatically cropped &amp; fitted to a <strong>1:1 square</strong> aspect ratio.
                  </p>
                  {imageError && (
                    <p className="text-xs text-[#DC2626] font-medium">{imageError}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Event Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., KINGDOM AMBASSADOR CONFERENCE"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/15"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Displayed Date Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., March 9, 2027 – March 11, 2027"
                  value={customFullDate}
                  onChange={(e) => setCustomFullDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Christ Church Likas (CCL)"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Time Range *
                </label>
                <input
                  type="text"
                  required
                  placeholder="9:00 AM – 9:30 PM"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
              >
                <option value="Worship">Conference / Worship Night</option>
                <option value="Meeting">Planning Meeting</option>
                <option value="Outreach">Campus Outreach</option>
                <option value="Prayer">Prayer Gathering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Event Details &amp; Summary
              </label>
              <textarea
                rows={3}
                placeholder="Describe event speakers, registration info, or schedule..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={setAsFeatured}
                onChange={(e) => setSetAsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#6D28D9] focus:ring-[#6D28D9]"
              />
              <span className="text-xs text-[#4B5563] font-medium">
                Set as Primary Featured Event on Overview Dashboard
              </span>
            </label>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E5E7EB] bg-[#F8FAFC]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#D4AF37] hover:bg-[#C19B26] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            >
              {initialEvent ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: CommitteeTask | null;
  onSaveTask: (task: CommitteeTask) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  initialTask,
  onSaveTask,
}) => {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('Jan 19');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignee, setAssignee] = useState('Alex Tan');
  const [category, setCategory] = useState('Worship & Media');
  const [notes, setNotes] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDueDate(initialTask.dueDate);
      setPriority(initialTask.priority);
      setAssignee(initialTask.assignee || 'Alex Tan');
      setCategory(initialTask.category || 'Worship & Media');
      setNotes(initialTask.notes || '');
      setIsOverdue(Boolean(initialTask.isOverdue));
    } else {
      setTitle('');
      setDueDate('Jan 19');
      setPriority('Medium');
      setAssignee('Alex Tan');
      setCategory('Worship & Media');
      setNotes('');
      setIsOverdue(false);
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const initialsMap: Record<string, string> = {
      'Alex Tan': 'KA',
      'Joshua Tan': 'JT',
      'Michelle Koh': 'MK',
      'Samuel Lim': 'SL',
      'Grace Chen': 'GC',
      'Caleb Yeo': 'CY',
      'Rachel Ng': 'RN',
    };

    const savedTask: CommitteeTask = {
      id: initialTask ? initialTask.id : `task-${Date.now()}`,
      title: title.trim(),
      dueDate: dueDate.trim() || 'Jan 19',
      priority,
      completed: initialTask ? initialTask.completed : false,
      isOverdue,
      assignee: assignee.trim() || 'Alex Tan',
      assigneeInitials: initialsMap[assignee] || 'KA',
      category,
      notes: notes.trim() || 'Assigned during committee weekly planning.',
      showInThisWeek: initialTask ? initialTask.showInThisWeek : true,
    };

    onSaveTask(savedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14245B]/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                {initialTask ? 'Edit Committee Task' : 'Add Committee Task'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                {initialTask
                  ? 'Update mission task details (Admin access)'
                  : 'Assign a new mission task for this week'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Task Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Coordinate acoustic guitar & mic cables"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Due Date (e.g., Jan 19)
              </label>
              <input
                type="text"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Assignee
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Alex Tan"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Ministry Team
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
              >
                <option value="Worship & Media">Worship & Media</option>
                <option value="Logistics">Logistics</option>
                <option value="Program">Program</option>
                <option value="Media & Creative">Media & Creative</option>
                <option value="Prayer">Prayer</option>
                <option value="Hospitality">Hospitality</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Additional context or checklist details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isOverdue}
              onChange={(e) => setIsOverdue(e.target.checked)}
              className="w-4 h-4 rounded text-[#DC2626] focus:ring-[#DC2626]"
            />
            <span className="text-xs font-medium text-[#4B5563]">
              Mark task as Overdue
            </span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#4B5563] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#5B21B6] transition-colors flex items-center gap-2 cursor-pointer"
            >
              {initialTask ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: CommitteeAnnouncement[];
  isAdmin: boolean;
  onSaveAnnouncement: (ann: CommitteeAnnouncement) => void;
  onDeleteAnnouncement?: (id: string) => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  announcements,
  isAdmin,
  onSaveAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [showCompose, setShowCompose] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Worship Night');

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setSummary('');
    setCategory('Worship Night');
    setShowCompose(true);
  };

  const handleOpenEdit = (item: CommitteeAnnouncement) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSummary(item.summary);
    setCategory(item.category);
    setShowCompose(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const existing = editingId ? announcements.find((a) => a.id === editingId) : null;

    onSaveAnnouncement({
      id: existing ? existing.id : `ann-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim(),
      author: existing ? existing.author : 'Admin Executive',
      authorRole: existing ? existing.authorRole : 'Committee Admin',
      date: existing ? existing.date : 'Just now',
      isNewThisWeek: true,
      pinned: existing?.pinned,
      category,
    });
    setTitle('');
    setSummary('');
    setEditingId(null);
    setShowCompose(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14245B]/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Committee Announcements ({announcements.length})
              </h3>
              <p className="text-xs text-[#6B7280]">
                Updates from Kingdom Ambassador Executive &amp; Ministry Leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => (showCompose ? setShowCompose(false) : handleOpenCreate())}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#6D28D9] text-white hover:bg-[#5B21B6] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showCompose ? 'Close Form' : 'Post Update'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {isAdmin && showCompose && (
            <form
              onSubmit={handleSubmit}
              className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-3 mb-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6D28D9] uppercase tracking-wider">
                  {editingId ? 'Edit Committee Announcement' : 'New Committee Announcement'}
                </span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs border border-[#E5E7EB] rounded-lg px-2.5 py-1 bg-white text-[#374151]"
                >
                  <option value="Worship Night">Worship Night</option>
                  <option value="Committee Growth">Committee Growth</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Outreach">Outreach</option>
                  <option value="Prayer">Prayer</option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Announcement headline..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
              />
              <textarea
                rows={2}
                required
                placeholder="Share details for committee members..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompose(false);
                    setEditingId(null);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:text-[#111827]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D4AF37] text-white hover:bg-[#C19B26] cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          )}

          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#6D28D9]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                  <span className="font-semibold text-[#6D28D9]">{item.category}</span>
                  <span>&middot;</span>
                  <span>{item.date}</span>
                  {item.isNewThisWeek && (
                    <>
                      <span>&middot;</span>
                      <span className="text-[#6D28D9] font-semibold">New this week</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {item.pinned && <Pin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-2 py-1 rounded-md text-xs font-semibold text-[#6D28D9] hover:bg-[#F3E8FF]/60 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      {onDeleteAnnouncement && (
                        <button
                          type="button"
                          onClick={() => onDeleteAnnouncement(item.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete announcement"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#111827] mt-1">{item.title}</h4>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1.5 leading-relaxed">
                {item.summary}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#6B7280]">
                <span>
                  Posted by <strong className="text-[#374151]">{item.author}</strong> ({item.authorRole})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MeetingDetailsModalProps {
  event: CommitteeEvent | null;
  isAdmin: boolean;
  onClose: () => void;
  onEditEvent: (event: CommitteeEvent) => void;
  onUpdateRsvp: (eventId: string, status: 'Going' | 'Maybe' | 'Not Going') => void;
}

export const MeetingDetailsModal: React.FC<MeetingDetailsModalProps> = ({
  event,
  isAdmin,
  onClose,
  onEditEvent,
  onUpdateRsvp,
}) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14245B]/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex flex-col items-center justify-center leading-none shadow-2xs">
              <span className="text-[9px] font-bold text-[#6D28D9] uppercase">
                {event.monthShort}
              </span>
              <span className="text-sm font-extrabold text-[#111827] tabular-nums">
                {event.dayNumber}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">{event.title}</h3>
              <p className="text-xs text-[#6B7280]">
                {event.fullDate} ({event.dayOfWeek}) &middot; {event.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditEvent(event);
                }}
                className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] hover:border-[#6D28D9] text-xs font-bold text-[#6D28D9] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {event.imageUrl && (
            <div className="w-full max-w-[280px] mx-auto aspect-square rounded-xl overflow-hidden border border-[#E5E7EB] shadow-2xs">
              <img
                src={event.imageUrl}
                alt={event.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover aspect-square"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#374151]">
              <Clock className="w-4 h-4 text-[#14245B] shrink-0" />
              <span>{event.timeRange}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#374151]">
              <MapPin className="w-4 h-4 text-[#14245B] shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-1.5">
              Event Details
            </h4>
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

