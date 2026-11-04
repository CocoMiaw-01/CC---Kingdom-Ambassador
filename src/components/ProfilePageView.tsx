import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  GraduationCap,
  KeyRound,
  Save,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Bell,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Phone,
} from 'lucide-react';
import {
  AmbassadorProfileData,
  PrivateContactData,
  MinistryTeamOption,
  VerifiedAccessRole,
  CommitteeInvitation,
  computeInitials,
  verifyApprovedInvitationCode,
} from '../lib/firebase';

interface ProfilePageViewProps {
  firebaseUser: User | null;
  authLoading: boolean;
  profile: AmbassadorProfileData;
  privateInfo: PrivateContactData | null;
  verifiedRole: VerifiedAccessRole | null;
  invitations: CommitteeInvitation[];
  onGoogleSignIn: (role: VerifiedAccessRole, usedCode?: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveProfile: (
    updates: Partial<AmbassadorProfileData>,
    notificationsEnabled: boolean
  ) => Promise<void>;
  onBackToOverview: () => void;
}

const MINISTRY_TEAMS: MinistryTeamOption[] = [
  'Worship & Prayer',
  'Executive Board',
  'Outreach & Evangelism',
  'Media & Creative',
  'Hospitality & Logistics',
];

export const ProfilePageView: React.FC<ProfilePageViewProps> = ({
  firebaseUser,
  authLoading,
  profile,
  privateInfo,
  verifiedRole,
  invitations,
  onGoogleSignIn,
  onSignOut,
  onSaveProfile,
  onBackToOverview,
}) => {
  // Multi-step login flow state
  const [showRoleForm, setShowRoleForm] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<VerifiedAccessRole>('Student/Alumni');
  const [invitationCode, setInvitationCode] = useState<string>('');
  const [wrongCodeError, setWrongCodeError] = useState<boolean>(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState<boolean>(false);

  // Profile Editor state (Self-update only when logged in)
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [initials, setInitials] = useState(profile.initials);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [ministryTeam, setMinistryTeam] = useState<MinistryTeamOption>(profile.ministryTeam);
  const [majorAndYear, setMajorAndYear] = useState(profile.majorAndYear);
  const [phoneNumber, setPhoneNumber] = useState(profile.officeLine || '');
  const [bio, setBio] = useState(profile.bio);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    privateInfo?.notificationsEnabled ?? true
  );
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setInitials(profile.initials);
    setRoleTitle(profile.roleTitle);
    setMinistryTeam(profile.ministryTeam);
    setMajorAndYear(profile.majorAndYear);
    setPhoneNumber(profile.officeLine || '');
    setBio(profile.bio);
    setNotificationsEnabled(privateInfo?.notificationsEnabled ?? true);
  }, [profile, privateInfo]);

  const handleRoleChoiceSelect = (role: VerifiedAccessRole) => {
    setSelectedRole(role);
    setWrongCodeError(false);
    setAuthErrorMessage(null);
  };

  const handleVerifyCodeAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWrongCodeError(false);
    setAuthErrorMessage(null);

    const normalizedCode = invitationCode.trim().toUpperCase();
    setSigningIn(true);

    try {
      // Only general codes (KASA26 / KAACC26) and Admin-generated codes that have been added are approved
      const isCodeValid = await verifyApprovedInvitationCode(
        selectedRole,
        normalizedCode,
        invitations
      );

      if (!isCodeValid) {
        setWrongCodeError(true);
        setSigningIn(false);
        return;
      }

      // Code is approved for the chosen role -> trigger Google Login via Firebase
      await onGoogleSignIn(selectedRole, normalizedCode);
      setInvitationCode('');
      setShowRoleForm(false);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthErrorMessage('Google sign-in popup was closed before completing login.');
      } else {
        setAuthErrorMessage(err?.message || 'Unable to complete Google sign-in. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setAuthErrorMessage(null);
    setSaving(true);
    try {
      await onSaveProfile(
        {
          displayName: displayName.trim().slice(0, 80) || 'Committee Member',
          initials:
            initials.trim().toUpperCase().slice(0, 4) ||
            computeInitials(displayName || 'Committee Member'),
          roleTitle: roleTitle.trim().slice(0, 80) || 'Committee Member',
          ministryTeam,
          majorAndYear: majorAndYear.trim().slice(0, 100) || 'Year 1 Undergraduate',
          officeLine: phoneNumber.trim().slice(0, 60),
          bio: bio.trim().slice(0, 300),
          photoURL: firebaseUser.photoURL || profile.photoURL || '',
        },
        notificationsEnabled
      );
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch (err: any) {
      setAuthErrorMessage(err?.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
            <button
              type="button"
              onClick={onBackToOverview}
              className="hover:text-[#6D28D9] font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <span>&middot;</span>
            <span className="text-[#6D28D9] font-semibold">Ambassador Profile</span>
          </div>
          <h2 className="text-2xl font-bold text-[#111827]">
            Kingdom Ambassador Profile &amp; Access
          </h2>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {firebaseUser
              ? `Signed in with Google · Verified ${verifiedRole || 'Committee'} Account`
              : 'Verify your Student/Alumni or Admin invitation code to sign in with Google'}
          </p>
        </div>

        {firebaseUser && (
          <button
            type="button"
            onClick={onSignOut}
            className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-red-50 hover:text-[#DC2626] hover:border-red-200 text-sm font-semibold text-[#374151] flex items-center gap-2 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
      </div>

      {authLoading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex flex-col items-center justify-center gap-3 text-[#6B7280]">
          <Loader2 className="w-7 h-7 animate-spin text-[#6D28D9]" />
          <p className="text-sm font-medium">Restoring your saved Firebase account session...</p>
        </div>
      ) : !firebaseUser || showRoleForm ? (
        /* ====================================================================
           UNAUTHENTICATED / ROLE & INVITATION CODE LOGIN GATE
           ==================================================================== */
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          {/* Royal Banner Header */}
          <div
            className="px-7 py-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #14245B 0%, #3B1485 65%, #6D28D9 100%)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              KINGDOM AMBASSADOR PORTAL
            </p>
            <h3 className="text-xl font-extrabold text-white mt-1">
              Member &amp; Admin Profile Log In
            </h3>
            <p className="text-xs sm:text-sm text-white/85 mt-1">
              Same Campus. A Greater Calling.
            </p>
          </div>

          <div className="p-7">
            {!showRoleForm ? (
              /* STEP 1: Initial Profile View leading to "Log In" button */
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center mx-auto font-extrabold text-xl">
                  KA
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-lg font-bold text-[#111827]">
                    Access Your Committee Profile
                  </h4>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    Click below to choose your role (<strong>Student/ Alumni</strong> or{' '}
                    <strong>Admin</strong>), enter your invitation code, and sign in with Google.
                    Your account will be remembered automatically on future visits.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleForm(true);
                      setWrongCodeError(false);
                      setAuthErrorMessage(null);
                    }}
                    className="w-full sm:w-auto min-w-[220px] px-8 py-3.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold text-sm inline-flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Log In</span>
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: 2 Choices (Student/ Alumni or Admin) + "invitation code" input + "Log In" button */
              <form onSubmit={handleVerifyCodeAndLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2.5">
                    1. Choose Your Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Choice 1: Student/ Alumni */}
                    <button
                      type="button"
                      onClick={() => handleRoleChoiceSelect('Student/Alumni')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                        selectedRole === 'Student/Alumni'
                          ? 'border-[#6D28D9] bg-[#F3E8FF]/60 ring-2 ring-[#6D28D9]/20'
                          : 'border-[#E5E7EB] bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          selectedRole === 'Student/Alumni'
                            ? 'bg-[#6D28D9] text-white'
                            : 'bg-slate-100 text-[#4B5563]'
                        }`}
                      >
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">Student/ Alumni</p>
                        <p className="text-xs text-[#6B7280]">Campus Member Access</p>
                      </div>
                    </button>

                    {/* Choice 2: Admin */}
                    <button
                      type="button"
                      onClick={() => handleRoleChoiceSelect('Admin')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3.5 cursor-pointer ${
                        selectedRole === 'Admin'
                          ? 'border-[#6D28D9] bg-[#F3E8FF]/60 ring-2 ring-[#6D28D9]/20'
                          : 'border-[#E5E7EB] bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          selectedRole === 'Admin'
                            ? 'bg-[#14245B] text-[#D4AF37]'
                            : 'bg-slate-100 text-[#4B5563]'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#111827]">Admin</p>
                        <p className="text-xs text-[#6B7280]">Committee Executive</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Invitation Code Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                    2. Enter Invitation Code for {selectedRole}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="invitation code"
                      value={invitationCode}
                      onChange={(e) => {
                        setInvitationCode(e.target.value);
                        if (wrongCodeError) setWrongCodeError(false);
                      }}
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/15"
                    />
                  </div>
                </div>

                {/* Wrong Code Comment + Link to Dashboard */}
                {wrongCodeError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-[#DC2626]">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-bold">wrong code</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setWrongCodeError(false);
                        setInvitationCode('');
                        onBackToOverview();
                      }}
                      className="text-xs sm:text-sm font-bold text-[#6D28D9] hover:text-[#5B21B6] underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Go to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {authErrorMessage && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#B45309] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authErrorMessage}</span>
                  </div>
                )}

                {/* Log In Button Below */}
                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer"
                >
                  {signingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Connecting to Google Firebase...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Log In</span>
                    </>
                  )}
                </button>

                {firebaseUser && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRoleForm(false)}
                      className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
                    >
                      Cancel and return to current profile
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      ) : (
        /* ====================================================================
           AUTHENTICATED & REMEMBERED PROFILE VIEW
           ==================================================================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Identity Summary Card (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div
              className="p-6 text-white text-center"
              style={{
                background: 'linear-gradient(135deg, #14245B 0%, #3B1485 65%, #6D28D9 100%)',
              }}
            >
              <div className="w-20 h-20 rounded-full bg-[#6D28D9] ring-3 ring-[#D4AF37] text-white font-extrabold text-2xl flex items-center justify-center mx-auto overflow-hidden shadow-md">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile.initials || 'KA'}</span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-white mt-3">{profile.displayName}</h3>
              <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">{profile.roleTitle}</p>
              <p className="text-xs text-white/80 mt-1">{profile.ministryTeam}</p>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">Status:</span>
                  <span className="font-bold text-[#16A34A] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">Access Tier:</span>
                  <span className="font-bold text-[#6D28D9] flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {verifiedRole || profile.accessRole || 'Student/Alumni'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">Google Account:</span>
                  <span className="font-semibold text-[#111827] truncate max-w-[160px]">
                    {privateInfo?.email || firebaseUser.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280] font-medium">Same-Device Auto Login:</span>
                  <span className="font-semibold text-[#16A34A]">Active until Sign Out</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowRoleForm(true);
                  setWrongCodeError(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E5E7EB] hover:bg-slate-50 text-xs font-semibold text-[#14245B] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#6D28D9]" />
                <span>Switch Role / Enter New Invitation Code</span>
              </button>
            </div>
          </div>

          {/* Right Editable Firestore Profile Form (Self-Update Only, 8 cols) */}
          <form
            onSubmit={handleSaveProfileSubmit}
            className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5"
          >
            <div className="border-b border-[#E5E7EB] pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111827]">
                  Edit Your Personal &amp; Committee Details (Self-Update Only)
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Only you can edit your profile details. Updates sync live to the Committee page.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6D28D9]">
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {privateInfo?.email || firebaseUser.email}
                </span>
              </div>
            </div>

            {authErrorMessage && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authErrorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (!initials || initials.length <= 2) {
                      setInitials(computeInitials(e.target.value));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Badge Initials *
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] uppercase font-bold text-[#6D28D9] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Committee Role Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Sub-Committee Team *
                </label>
                <select
                  value={ministryTeam}
                  onChange={(e) => setMinistryTeam(e.target.value as MinistryTeamOption)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
                >
                  {MINISTRY_TEAMS.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Phone Number (Contact No.)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={60}
                    placeholder="e.g., +60 12-345 6789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  University Major &amp; Academic Year *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={majorAndYear}
                  onChange={(e) => setMajorAndYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Campus Calling &amp; Bio (Max 300 chars)
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] cursor-pointer">
              <span className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#374151]">
                <Bell className="w-4 h-4 text-[#6D28D9]" />
                Receive Worship Night &amp; Weekly Task Alerts
              </span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#6D28D9] focus:ring-[#6D28D9]"
              />
            </label>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
              <div>
                {savedBanner && (
                  <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Profile saved to Firestore!
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
