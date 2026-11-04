import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  LogIn,
  LogOut,
  ShieldCheck,
  Save,
  Check,
  UserCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Bell,
} from 'lucide-react';
import {
  AmbassadorProfileData,
  PrivateContactData,
  MinistryTeamOption,
  computeInitials,
} from '../lib/firebase';

interface FirebaseProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  authLoading: boolean;
  profile: AmbassadorProfileData;
  privateInfo: PrivateContactData | null;
  onGoogleSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSaveProfile: (
    updates: Partial<AmbassadorProfileData>,
    notificationsEnabled: boolean
  ) => Promise<void>;
}

const MINISTRY_TEAMS: MinistryTeamOption[] = [
  'Worship & Prayer',
  'Executive Board',
  'Outreach & Evangelism',
  'Media & Creative',
  'Hospitality & Logistics',
];

export const FirebaseProfileModal: React.FC<FirebaseProfileModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  authLoading,
  profile,
  privateInfo,
  onGoogleSignIn,
  onSignOut,
  onSaveProfile,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [initials, setInitials] = useState(profile.initials);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [ministryTeam, setMinistryTeam] = useState<MinistryTeamOption>(profile.ministryTeam);
  const [majorAndYear, setMajorAndYear] = useState(profile.majorAndYear);
  const [bio, setBio] = useState(profile.bio);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    privateInfo?.notificationsEnabled ?? true
  );

  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setInitials(profile.initials);
    setRoleTitle(profile.roleTitle);
    setMinistryTeam(profile.ministryTeam);
    setMajorAndYear(profile.majorAndYear);
    setBio(profile.bio);
    setNotificationsEnabled(privateInfo?.notificationsEnabled ?? true);
  }, [profile, privateInfo, isOpen]);

  if (!isOpen) return null;

  const handleSignInClick = async () => {
    setErrorMessage(null);
    setSigningIn(true);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in popup was closed before completing authentication.');
      } else {
        setErrorMessage(err?.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setErrorMessage(null);
    setSaving(true);
    try {
      await onSaveProfile(
        {
          displayName: displayName.trim().slice(0, 80) || 'Alex Tan',
          initials:
            initials.trim().toUpperCase().slice(0, 4) ||
            computeInitials(displayName || 'Alex Tan'),
          roleTitle: roleTitle.trim().slice(0, 80) || 'Committee Member',
          ministryTeam,
          majorAndYear: majorAndYear.trim().slice(0, 100) || 'Year 3 Undergraduate',
          bio: bio.trim().slice(0, 300),
          photoURL: firebaseUser.photoURL || profile.photoURL || '',
        },
        notificationsEnabled
      );
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save profile to Firestore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14245B]/55 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Royal Header */}
        <div
          className="px-6 py-5 text-white flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #14245B 0%, #3B1485 65%, #6D28D9 100%)',
          }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#6D28D9] ring-2 ring-[#D4AF37] text-white font-extrabold text-base flex items-center justify-center shrink-0 overflow-hidden">
              {firebaseUser && profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials || 'KA'}</span>
              )}
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#D4AF37] block">
                Kingdom Ambassador Identity
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">
                {firebaseUser ? profile.displayName : 'Committee Member Sign In'}
              </h3>
              <p className="text-xs text-white/80">
                {firebaseUser
                  ? `${profile.roleTitle} · ${profile.ministryTeam}`
                  : 'Sign in with Google to sync your committee profile via Firebase'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close profile modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="break-words">{errorMessage}</span>
            </div>
          )}

          {authLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#6B7280]">
              <Loader2 className="w-6 h-6 animate-spin text-[#6D28D9]" />
              <p className="text-xs font-medium">Checking Firebase Authentication session...</p>
            </div>
          ) : !firebaseUser ? (
            /* SIGNED OUT VIEW */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#14245B]">
                  <ShieldCheck className="w-4 h-4 text-[#6D28D9]" />
                  <span>Firebase Authentication &amp; Cloud Firestore</span>
                </div>
                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  Authenticate with your Google account to unlock your persistent{' '}
                  <strong className="text-[#111827]">Kingdom Ambassador Profile</strong>. Your
                  committee role, sub-committee placement, academic year, and notification
                  preferences are stored securely in Firestore.
                </p>
              </div>

              <button
                type="button"
                disabled={signingIn}
                onClick={handleSignInClick}
                className="w-full py-3 px-5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-3 shadow-sm transition-all cursor-pointer"
              >
                {signingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opening Google Sign-In...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                <span>Currently previewing as Alex Tan (KA)</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="font-semibold text-[#14245B] hover:text-[#6D28D9]"
                >
                  Continue Preview
                </button>
              </div>
            </div>
          ) : (
            /* SIGNED IN PROFILE EDITOR VIEW */
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Verified Account Bar */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-[#6D28D9] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#111827] truncate">
                      {privateInfo?.email || firebaseUser.email}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      Synced to Firestore &middot; Isolated private contact record
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-red-50 hover:text-[#DC2626] hover:border-red-200 text-xs font-semibold text-[#374151] flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
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
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Badge Initials *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E7EB] uppercase font-bold text-[#6D28D9] focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Committee Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Committee Member"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1">
                    Sub-Committee Team *
                  </label>
                  <select
                    value={ministryTeam}
                    onChange={(e) => setMinistryTeam(e.target.value as MinistryTeamOption)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#6D28D9]"
                  >
                    {MINISTRY_TEAMS.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  University Major &amp; Academic Year *
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={majorAndYear}
                  onChange={(e) => setMajorAndYear(e.target.value)}
                  placeholder="B.Sc. Computer Science · Year 3"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Campus Calling &amp; Bio (Max 300 chars)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:border-[#6D28D9]"
                />
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-semibold text-[#374151]">
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
                    <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Saved to Firestore!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4B5563] hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
