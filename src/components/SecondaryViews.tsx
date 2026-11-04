import React, { useState } from 'react';
import {
  Plus,
  Search,
  Check,
  Mail,
  Trash2,
  ArrowLeft,
  Edit3,
  KeyRound,
  Copy,
  Phone,
  ShieldCheck,
  GraduationCap,
  Users,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  CommitteeMember,
  CommitteeEvent,
  CommitteeTask,
  TaskPriority,
} from '../data/committeeData';
import {
  CommitteeInvitation,
  VerifiedAccessRole,
} from '../lib/firebase';

/* ============================================================================
   1. COMMITTEE MEMBERS & ADMIN INVITATIONS VIEW
   ============================================================================ */
interface CommitteeDirectoryViewProps {
  members: CommitteeMember[];
  isAdmin: boolean;
  currentUserUid?: string | null;
  invitations: CommitteeInvitation[];
  onCreateInvitation: (inv: CommitteeInvitation) => Promise<void> | void;
  onDeleteInvitation: (invId: string) => Promise<void> | void;
  onDeleteMember: (uid: string) => void;
  onGoToProfile: () => void;
  onBackToOverview: () => void;
}

export const CommitteeDirectoryView: React.FC<CommitteeDirectoryViewProps> = ({
  members,
  isAdmin,
  currentUserUid,
  invitations,
  onCreateInvitation,
  onDeleteInvitation,
  onDeleteMember,
  onGoToProfile,
  onBackToOverview,
}) => {
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [localQuery, setLocalQuery] = useState('');
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteRole, setInviteRole] = useState<VerifiedAccessRole>('Student/Alumni');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLabel, setInviteLabel] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addingInvite, setAddingInvite] = useState(false);
  const [addedSuccessCode, setAddedSuccessCode] = useState<string | null>(null);

  const teams = [
    'All',
    'Online Now',
    'Executive Board',
    'Worship & Prayer',
    'Outreach & Evangelism',
    'Media & Creative',
    'Hospitality & Logistics',
  ];

  const onlineCount = members.filter((m) => m.isOnline).length;

  const filteredMembers = members.filter((m) => {
    const matchesTeam =
      teamFilter === 'All'
        ? true
        : teamFilter === 'Online Now'
        ? m.isOnline
        : m.ministryTeam === teamFilter;
    const q = localQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.majorAndYear.toLowerCase().includes(q) ||
      (m.phoneNumber && m.phoneNumber.toLowerCase().includes(q));
    return matchesTeam && matchesSearch;
  });

  const handleGenerateRandomCode = (roleTarget: VerifiedAccessRole = inviteRole) => {
    const prefix = roleTarget === 'Admin' ? 'KAACC' : 'KASA';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    setInviteCode(`${prefix}-${rand}`);
    setAddedSuccessCode(null);
  };

  const handleSwitchInviteRole = (nextRole: VerifiedAccessRole) => {
    setInviteRole(nextRole);
    setAddedSuccessCode(null);
    if (inviteCode) {
      const prefix = nextRole === 'Admin' ? 'KAACC' : 'KASA';
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
      setInviteCode(`${prefix}-${rand}`);
    }
  };

  const handleCreateInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const cleanedCode = inviteCode.trim().toUpperCase();
    if (cleanedCode.length < 3) return;

    setAddingInvite(true);
    try {
      await onCreateInvitation({
        id: `inv-${Date.now()}`,
        code: cleanedCode,
        role: inviteRole,
        label:
          inviteLabel.trim() ||
          (inviteRole === 'Admin'
            ? 'Added Admin Generated Code'
            : 'Added SA Generated Code'),
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        isGeneral: false,
      });

      setAddedSuccessCode(cleanedCode);
      setInviteCode('');
      setInviteLabel('');
      setTimeout(() => setAddedSuccessCode(null), 4000);
    } finally {
      setAddingInvite(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <button
              onClick={onBackToOverview}
              className="hover:text-[#6D28D9] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Overview
            </button>
            <span>&middot;</span>
            <span className="text-[#6D28D9] font-semibold">Registered Committee Roster</span>
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">
            Kingdom Ambassador Committee ({members.length}{' '}
            {members.length === 1 ? 'Member' : 'Members'})
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5 flex flex-wrap items-center gap-2">
            <span>Auto-registered from verified invitation logins (1 unique account per email)</span>
            <span>&middot;</span>
            <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              {onlineCount} Online
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          {currentUserUid && (
            <button
              type="button"
              onClick={onGoToProfile}
              className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#14245B] text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-[#6D28D9]" />
              <span>Update My Profile</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowInvitePanel(!showInvitePanel)}
              className="px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>{showInvitePanel ? 'Hide Invitations' : 'Invitation Codes'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ADMIN-ONLY INVITATION CODE GENERATOR & LIST */}
      {isAdmin && showInvitePanel && (
        <div className="bg-white p-6 rounded-2xl border border-[#6D28D9]/30 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D28D9]">
                ADMIN ACCESS ONLY
              </span>
              <h3 className="text-base font-bold text-[#111827] mt-0.5">
                Generate &amp; Approve Committee Invitation Codes
              </h3>
              <p className="text-xs text-[#6B7280]">
                Choose invitation type for <strong>Student/Alumni (SA)</strong> or{' '}
                <strong>Admin</strong>, click <strong>Generate</strong>, then click{' '}
                <strong>Add Invite</strong> to approve it for login. Only added generated codes and the general codes (<strong>KASA26</strong> / <strong>KAACC26</strong>) can gain access.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateInviteSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* 1. Choose Invitation Type: SA or Admin */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  1. Choose Invitation Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchInviteRole('Student/Alumni')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      inviteRole === 'Student/Alumni'
                        ? 'border-[#6D28D9] bg-[#F3E8FF]/70 text-[#6D28D9]'
                        : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>SA (Student/Alumni)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchInviteRole('Admin')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      inviteRole === 'Admin'
                        ? 'border-[#14245B] bg-[#14245B] text-[#D4AF37]'
                        : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* 2. Generated Invitation Code (Read-only, generated via button) */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  2. Generate Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    required
                    placeholder="Click 'Generate' ->"
                    value={inviteCode}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] text-[#111827] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateRandomCode(inviteRole)}
                    className="px-3.5 py-2.5 rounded-xl border border-[#6D28D9]/30 bg-[#F3E8FF]/50 hover:bg-[#F3E8FF] text-xs font-bold text-[#6D28D9] shrink-0 flex items-center gap-1.5 cursor-pointer"
                    title="Generate new invitation code"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#6D28D9]" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* 3. Optional Note + Add Invite to approve */}
              <div className="md:col-span-4 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                    3. Note &amp; Approve Code
                  </label>
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="Optional label (e.g., Campus Batch)"
                    value={inviteLabel}
                    onChange={(e) => setInviteLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inviteCode || addingInvite}
                  className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C19B26] disabled:opacity-50 text-white text-sm font-bold shrink-0 self-end flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{addingInvite ? 'Adding...' : 'Add Invite'}</span>
                </button>
              </div>
            </div>

            {inviteCode && (
              <p className="text-xs font-semibold text-[#B45309] bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
                Generated preview code <span className="font-mono font-bold">{inviteCode}</span> is not active yet — click <strong>Add Invite</strong> so this code is approved to gain access.
              </p>
            )}

            {addedSuccessCode && (
              <p className="text-xs font-semibold text-[#15803D] bg-[#DCFCE7] border border-green-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Code <strong className="font-mono">{addedSuccessCode}</strong> has been added and approved for login!
                </span>
              </p>
            )}
          </form>

          {/* Approved Active Invitation Codes List */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2.5">
              Approved Invitation Codes ({invitations.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {invitations.map((inv) => {
                const isPermanent =
                  inv.code === 'KASA26' || inv.code === 'KAACC26';
                return (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-extrabold text-[#111827]">
                          {inv.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            inv.role === 'Admin'
                              ? 'bg-[#14245B] text-[#D4AF37]'
                              : 'bg-[#EDE9FE] text-[#6D28D9]'
                          }`}
                        >
                          {inv.role === 'Admin' ? 'Admin' : 'SA'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold">
                          {isPermanent ? 'General' : 'Added'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                        {inv.label}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(inv.code)}
                        className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-[#374151] transition-colors cursor-pointer"
                        title="Copy approved invitation code"
                      >
                        {copiedCode === inv.code ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {!isPermanent && (
                        <button
                          type="button"
                          onClick={() => onDeleteInvitation(inv.id)}
                          className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-red-50 text-slate-400 hover:text-[#DC2626] transition-colors cursor-pointer"
                          title="Delete invitation code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {teams.map((team) => (
            <button
              key={team}
              onClick={() => setTeamFilter(team)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                teamFilter === team
                  ? 'bg-[#14245B] text-white'
                  : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:text-[#111827]'
              }`}
            >
              {team}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-white border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
          />
        </div>
      </div>

      {/* Registered Logged-In Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">
            {members.length === 0
              ? 'No Committee Members Logged In Yet'
              : 'No Matching Committee Members'}
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
            {members.length === 0
              ? 'When members log in with a valid Student/Alumni (SA) or Admin invitation code, their profile is automatically registered here with live Online/Offline status.'
              : 'Try adjusting your team filter or search query.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isSelf = Boolean(currentUserUid && currentUserUid === member.uid);
            return (
              <div
                key={member.uid || member.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:border-[#6D28D9]/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden ${member.avatarBg} ${member.avatarText}`}
                        >
                          {member.photoURL ? (
                            <img
                              src={member.photoURL}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{member.initials}</span>
                          )}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                            member.isOnline ? 'bg-[#16A34A]' : 'bg-[#9CA3AF]'
                          }`}
                          title={member.isOnline ? 'Online' : 'Offline'}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-[15px] font-bold text-[#111827] truncate">
                            {member.name}
                          </h3>
                          {isSelf && (
                            <span className="px-2 py-0.5 rounded-md bg-[#F3E8FF] text-[#6D28D9] text-[10px] font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#6D28D9] truncate">
                          {member.role}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              member.isOnline
                                ? 'bg-[#DCFCE7] text-[#15803D]'
                                : 'bg-slate-100 text-[#6B7280]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                member.isOnline ? 'bg-[#16A34A]' : 'bg-[#9CA3AF]'
                              }`}
                            />
                            {member.isOnline ? 'Online' : 'Offline'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              member.accessRole === 'Admin'
                                ? 'bg-[#14245B] text-[#D4AF37]'
                                : 'bg-slate-100 text-[#374151]'
                            }`}
                          >
                            {member.accessRole === 'Admin' ? 'Admin' : 'SA'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onDeleteMember(member.uid)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Delete user from Committee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-[#6B7280]">
                    <p>
                      <span className="font-semibold text-[#374151]">Sub-Committee:</span>{' '}
                      {member.ministryTeam}
                    </p>
                    <p>
                      <span className="font-semibold text-[#374151]">Academic:</span>{' '}
                      {member.majorAndYear}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" />
                      <span className="font-semibold text-[#374151]">Phone:</span>{' '}
                      <span>{member.phoneNumber || 'Not set yet'}</span>
                    </p>
                    {member.bio && (
                      <p className="text-[11.5px] text-[#4B5563] italic pt-1 line-clamp-2">
                        &ldquo;{member.bio}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="text-[#14245B] hover:text-[#6D28D9] font-semibold flex items-center gap-1 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>
                  ) : (
                    <span className="text-[#6B7280]">Verified Account</span>
                  )}

                  {isSelf && (
                    <button
                      type="button"
                      onClick={onGoToProfile}
                      className="text-[#6D28D9] hover:text-[#5B21B6] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit My Profile</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   2. EVENTS & CALENDAR VIEW (1:1 Poster Layout inspired by reference)
   ============================================================================ */
interface EventsDirectoryViewProps {
  events: CommitteeEvent[];
  isAdmin: boolean;
  onOpenCreateModal: () => void;
  onEditEvent: (evt: CommitteeEvent) => void;
  onSelectEvent: (evt: CommitteeEvent) => void;
  onBackToOverview: () => void;
}

const DEFAULT_FALLBACK_POSTER =
  '/assets/aistudio/da4d912a-c6c0-4c13-bed2-500c99697c41_7271609d.jpeg';

export const EventsDirectoryView: React.FC<EventsDirectoryViewProps> = ({
  events,
  isAdmin,
  onOpenCreateModal,
  onEditEvent,
  onSelectEvent,
  onBackToOverview,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = events.length > 0 ? activeIndex % events.length : 0;
  const activeEvent = events[safeIndex] || events[0];

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <button
              onClick={onBackToOverview}
              className="hover:text-[#6D28D9] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Overview
            </button>
            <span>&middot;</span>
            <span className="text-[#6D28D9] font-semibold">Campus Events &amp; Gatherings</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-normal tracking-wide uppercase text-[#111827]">
            EVENTS
          </h2>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#C19B26] text-white text-sm font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Add Event
          </button>
        )}
      </div>

      {/* Featured 1:1 Poster Showcase (Matches reference screenshot layout) */}
      {activeEvent && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="w-full max-w-[380px] mx-auto">
            {/* 1:1 Square Poster Image */}
            <div
              onClick={() => onSelectEvent(activeEvent)}
              className="w-full aspect-square bg-[#14245B] overflow-hidden shadow-sm cursor-pointer group relative"
            >
              <img
                src={activeEvent.imageUrl || DEFAULT_FALLBACK_POSTER}
                alt={activeEvent.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover aspect-square group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>

            {/* Event Title (Bold Uppercase) */}
            <h3 className="mt-6 text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-[#111827] leading-snug">
              {activeEvent.title}
            </h3>

            {/* Date & Location */}
            <p className="mt-3 text-sm sm:text-base text-[#111827]">
              {activeEvent.fullDate}
            </p>
            <p className="mt-1 text-sm sm:text-base text-[#111827]">
              {activeEvent.location}
            </p>

            {/* Rectangular Bordered "More" Button */}
            <div className="mt-6 flex flex-col items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectEvent(activeEvent)}
                className="w-full max-w-[260px] py-2.5 px-8 border-2 border-[#111827] bg-white hover:bg-[#111827] text-[#111827] hover:text-white text-base font-bold transition-colors cursor-pointer"
              >
                More
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onEditEvent(activeEvent)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#6D28D9] hover:bg-[#F3E8FF]/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Event</span>
                </button>
              )}
            </div>

            {/* Pagination Dots */}
            {events.length > 1 && (
              <div className="mt-7 flex items-center justify-center gap-2.5">
                {events.map((evt, idx) => (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`View ${evt.title}`}
                    className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex
                        ? 'bg-[#1F2937] scale-105'
                        : 'bg-[#CBD5E1] hover:bg-[#94A3B8]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Events 1:1 Poster Grid */}
      {events.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt, idx) => (
            <div
              key={evt.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col items-center text-center justify-between transition-all ${
                idx === safeIndex
                  ? 'border-[#6D28D9] shadow-xs'
                  : 'border-[#E5E7EB] hover:border-[#6D28D9]/40'
              }`}
            >
              <div className="w-full">
                {/* 1:1 Square Poster */}
                <div
                  onClick={() => onSelectEvent(evt)}
                  className="w-full aspect-square bg-[#14245B] overflow-hidden shadow-2xs cursor-pointer group"
                >
                  <img
                    src={evt.imageUrl || DEFAULT_FALLBACK_POSTER}
                    alt={evt.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover aspect-square group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>

                <h4 className="mt-5 text-lg font-extrabold uppercase tracking-wide text-[#111827] leading-snug">
                  {evt.title}
                </h4>

                <p className="mt-2.5 text-sm text-[#111827]">{evt.fullDate}</p>
                <p className="mt-1 text-sm text-[#111827]">{evt.location}</p>
              </div>

              <div className="w-full mt-5 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectEvent(evt)}
                  className="w-full max-w-[220px] py-2 px-6 border-2 border-[#111827] bg-white hover:bg-[#111827] text-[#111827] hover:text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  More
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => onEditEvent(evt)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-[#6D28D9] hover:bg-[#F3E8FF]/60 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   3. TASKS VIEW (All 7 Tasks + 2 Overdue + Priority Filters)
   ============================================================================ */
interface TasksDirectoryViewProps {
  tasks: CommitteeTask[];
  isAdmin: boolean;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: CommitteeTask) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenAddTaskModal: () => void;
  onBackToOverview: () => void;
}

export const TasksDirectoryView: React.FC<TasksDirectoryViewProps> = ({
  tasks,
  isAdmin,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenAddTaskModal,
  onBackToOverview,
}) => {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed' | 'Overdue' | TaskPriority>('All');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return !t.completed;
    if (filter === 'Completed') return t.completed;
    if (filter === 'Overdue') return Boolean(t.isOverdue && !t.completed);
    return t.priority === filter;
  });

  const getPriorityBadgeStyle = (priority: TaskPriority) => {
    if (priority === 'High') return 'bg-[#FEF3C7] text-[#B45309]';
    if (priority === 'Medium') return 'bg-[#E0F2FE] text-[#0369A1]';
    return 'bg-[#DCFCE7] text-[#15803D]';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <button
              onClick={onBackToOverview}
              className="hover:text-[#6D28D9] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Overview
            </button>
            <span>&middot;</span>
            <span className="text-[#6D28D9] font-semibold">Mission Tasks</span>
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">
            Committee Action Items ({tasks.length} Total)
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Key tasks to keep our campus mission moving forward &middot;{' '}
            <span className="text-[#DC2626] font-semibold">
              {tasks.filter((t) => t.isOverdue && !t.completed).length} overdue
            </span>
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={onOpenAddTaskModal}
            className="px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['All', 'Pending', 'Overdue', 'Completed', 'High', 'Medium', 'Low'] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filter === tab
                  ? 'bg-[#14245B] text-white'
                  : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:text-[#111827]'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-slate-100 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#374151]">No tasks match this filter.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                      task.completed
                        ? 'bg-[#6D28D9] text-white border border-[#6D28D9]'
                        : 'border-2 border-[#CBD5E1] bg-white hover:border-[#6D28D9]'
                    }`}
                    aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ) : (
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      task.completed
                        ? 'bg-[#6D28D9] text-white border border-[#6D28D9]'
                        : 'border-2 border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      onClick={() => {
                        if (isAdmin) onToggleTask(task.id);
                      }}
                      className={`text-sm font-semibold ${
                        isAdmin ? 'cursor-pointer' : ''
                      } ${task.completed ? 'line-through text-[#9CA3AF]' : 'text-[#111827]'}`}
                    >
                      {task.title}
                    </span>
                    {task.isOverdue && !task.completed && (
                      <span className="text-xs font-semibold text-[#DC2626] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Overdue
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-xs text-[#6B7280] mt-1">{task.notes}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1.5">
                    <span>Assigned to {task.assignee}</span>
                    <span>&middot;</span>
                    <span>{task.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0 shrink-0">
                <span className="text-xs font-medium text-[#6B7280] tabular-nums">
                  {task.dueDate}
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-semibold min-w-[68px] text-center ${getPriorityBadgeStyle(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#6D28D9] hover:bg-[#F3E8FF]/60 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-[#DC2626] rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
