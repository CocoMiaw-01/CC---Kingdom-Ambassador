import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);
// Ensure Firebase remembers the authenticated account across sessions
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Auth persistence notice:', err);
});

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore initial connection warming up via long-polling.');
    }
  }
}
testConnection();

export type MinistryTeamOption =
  | 'Executive Board'
  | 'Worship & Prayer'
  | 'Outreach & Evangelism'
  | 'Media & Creative'
  | 'Hospitality & Logistics';

export type VerifiedAccessRole = 'Student/Alumni' | 'Admin';

export interface AmbassadorProfileData {
  uid: string;
  displayName: string;
  initials: string;
  roleTitle: string;
  ministryTeam: MinistryTeamOption;
  majorAndYear: string;
  bio: string;
  photoURL: string;
  officeLine: string; // Phone number editable by user in their own profile
  accessRole: VerifiedAccessRole;
  accountTag: string; // Unique Google email identifier (1 account per email)
  isOnline: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface PrivateContactData {
  uid: string;
  email: string;
  notificationsEnabled: boolean;
  updatedAt?: Timestamp | null;
}

export interface CommitteeInvitation {
  id: string;
  code: string;
  role: VerifiedAccessRole;
  label: string;
  createdAt: string;
  isGeneral?: boolean;
}

export const DEFAULT_INVITATIONS: CommitteeInvitation[] = [
  {
    id: 'default-sa-kasa26',
    code: 'KASA26',
    role: 'Student/Alumni',
    label: 'General Student / Alumni Code (Always Approved)',
    createdAt: 'Permanent',
    isGeneral: true,
  },
  {
    id: 'default-admin-kaacc26',
    code: 'KAACC26',
    role: 'Admin',
    label: 'General Admin Executive Code (Always Approved)',
    createdAt: 'Permanent',
    isGeneral: true,
  },
];

let interactiveSignInActive = false;
export function isInteractiveSignInActive(): boolean {
  return interactiveSignInActive;
}
export function setInteractiveSignInActive(active: boolean): void {
  interactiveSignInActive = active;
}

export function computeInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return 'KA';
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase().slice(0, 4);
  }
  return cleaned.slice(0, 2).toUpperCase();
}

const VALID_MINISTRY_TEAMS: MinistryTeamOption[] = [
  'Executive Board',
  'Worship & Prayer',
  'Outreach & Evangelism',
  'Media & Creative',
  'Hospitality & Logistics',
];

export function sanitizeProfileInput(input: Partial<AmbassadorProfileData>, uid: string) {
  const displayName = (input.displayName || 'Committee Member').trim().slice(0, 80) || 'Committee Member';
  const initials = (input.initials || computeInitials(displayName)).trim().toUpperCase().slice(0, 4) || 'KA';
  const roleTitle = (input.roleTitle || 'Committee Member').trim().slice(0, 80) || 'Committee Member';
  const ministryTeam: MinistryTeamOption = VALID_MINISTRY_TEAMS.includes(
    input.ministryTeam as MinistryTeamOption
  )
    ? (input.ministryTeam as MinistryTeamOption)
    : 'Worship & Prayer';
  const majorAndYear =
    (input.majorAndYear || 'Year 1 Undergraduate').trim().slice(0, 100) ||
    'Year 1 Undergraduate';
  const bio = (
    input.bio ?? 'Every Campus. Every Student. Multiplying Disciples. — Matthew 5:16'
  )
    .trim()
    .slice(0, 300);
  const photoURL = (input.photoURL ?? '').trim().slice(0, 500);
  const officeLine = (input.officeLine ?? '').trim().slice(0, 60);
  const accessRole: VerifiedAccessRole =
    input.accessRole === 'Admin' ? 'Admin' : 'Student/Alumni';
  const accountTag = (input.accountTag ?? '').trim().toLowerCase().slice(0, 160);
  const isOnline = typeof input.isOnline === 'boolean' ? input.isOnline : true;

  return {
    uid,
    displayName,
    initials,
    roleTitle,
    ministryTeam,
    majorAndYear,
    bio,
    photoURL,
    officeLine,
    accessRole,
    accountTag,
    isOnline,
  };
}

export async function signInWithGooglePopup(): Promise<User> {
  await setPersistence(auth, browserLocalPersistence);
  // If a user is currently signed in and switching accounts/roles, mark the previous account offline first while still authenticated as them
  if (auth.currentUser) {
    await setUserOnlineStatusInFirestore(auth.currentUser.uid, false).catch(() => {});
  }
  // Always use a fresh provider with select_account so any email can log in cleanly
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  if (result.user.email) {
    try {
      localStorage.setItem('ka_remembered_email_v1', result.user.email.toLowerCase());
    } catch {
      // ignore
    }
  }
  return result.user;
}

export async function fetchApprovedInvitationsFromFirestore(
  fallbackInvitations: CommitteeInvitation[] = DEFAULT_INVITATIONS
): Promise<CommitteeInvitation[]> {
  const codesRef = doc(db, 'invitation_meta', 'codes');
  let snap = null;
  try {
    snap = await getDocFromServer(codesRef);
  } catch {
    try {
      snap = await getDoc(codesRef);
    } catch {
      snap = null;
    }
  }

  const mergedMap = new Map<string, CommitteeInvitation>();
  DEFAULT_INVITATIONS.forEach((d) => mergedMap.set(d.code.toUpperCase(), d));

  if (snap && snap.exists()) {
    const data = snap.data();
    try {
      if (typeof data.invitationsJson === 'string') {
        const parsed: CommitteeInvitation[] = JSON.parse(data.invitationsJson);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && typeof item.code === 'string' && item.code.trim()) {
              const codeKey = item.code.trim().toUpperCase();
              if (codeKey !== 'KASA26' && codeKey !== 'KAACC26') {
                mergedMap.set(codeKey, {
                  ...item,
                  code: codeKey,
                });
              }
            }
          });
          return Array.from(mergedMap.values());
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }

  // Fallback to provided invitations if Firestore doc does not exist yet
  fallbackInvitations.forEach((item) => {
    if (item && typeof item.code === 'string' && item.code.trim()) {
      const codeKey = item.code.trim().toUpperCase();
      mergedMap.set(codeKey, {
        ...item,
        code: codeKey,
      });
    }
  });

  return Array.from(mergedMap.values());
}

export async function verifyApprovedInvitationCode(
  selectedRole: VerifiedAccessRole,
  rawCode: string,
  fallbackInvitations: CommitteeInvitation[] = DEFAULT_INVITATIONS
): Promise<boolean> {
  const normalizedCode = rawCode.trim().toUpperCase();
  if (!normalizedCode) return false;

  // 1. General codes always have access for their respective roles
  if (selectedRole === 'Student/Alumni' && normalizedCode === 'KASA26') {
    return true;
  }
  if (selectedRole === 'Admin' && normalizedCode === 'KAACC26') {
    return true;
  }

  // 2. Check added generated codes in Firestore
  const approvedList = await fetchApprovedInvitationsFromFirestore(fallbackInvitations);
  return approvedList.some(
    (inv) =>
      inv.role === selectedRole &&
      inv.code.trim().toUpperCase() === normalizedCode
  );
}

export async function setUserOnlineStatusInFirestore(
  uid: string,
  isOnline: boolean
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const profileRef = doc(db, 'profiles', uid);
  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<AmbassadorProfileData>;
      const sanitized = sanitizeProfileInput({ ...data, isOnline }, uid);
      await updateDoc(profileRef, {
        displayName: sanitized.displayName,
        initials: sanitized.initials,
        roleTitle: sanitized.roleTitle,
        ministryTeam: sanitized.ministryTeam,
        majorAndYear: sanitized.majorAndYear,
        bio: sanitized.bio,
        photoURL: sanitized.photoURL,
        officeLine: sanitized.officeLine,
        accessRole: sanitized.accessRole,
        accountTag: sanitized.accountTag,
        isOnline: sanitized.isOnline,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn('Online status update notice:', err);
  }
}

export async function signOutUser(): Promise<void> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    await setUserOnlineStatusInFirestore(currentUser.uid, false);
  }
  try {
    localStorage.removeItem('ka_verified_role_v1');
    localStorage.removeItem('ka_remembered_email_v1');
    localStorage.removeItem('ka_verified_code_v1');
  } catch {
    // ignore
  }
  await firebaseSignOut(auth);
}

export async function registerUserInCommitteeRoster(
  uid: string,
  isExplicitLoginWithCode: boolean
): Promise<boolean> {
  const rosterPath = 'committee_meta/roster';
  const rosterRef = doc(db, 'committee_meta', 'roster');
  let snap;
  try {
    snap = await getDoc(rosterRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, rosterPath);
  }

  let memberUids: string[] = [];
  let deletedUids: string[] = [];

  if (snap.exists()) {
    const data = snap.data();
    if (Array.isArray(data.memberUids)) memberUids = [...data.memberUids];
    if (Array.isArray(data.deletedUids)) deletedUids = [...data.deletedUids];
  }

  // If user is restoring a session automatically AND an Admin deleted them, do not re-add them
  if (!isExplicitLoginWithCode && deletedUids.includes(uid)) {
    return false;
  }

  // If restoring a session automatically (no explicit code just entered), require that they are either already registered OR have an approved saved code
  if (!isExplicitLoginWithCode && !memberUids.includes(uid)) {
    let savedCode = '';
    let savedRole: VerifiedAccessRole = 'Student/Alumni';
    try {
      savedCode = (localStorage.getItem('ka_verified_code_v1') || '').trim().toUpperCase();
      const r = localStorage.getItem('ka_verified_role_v1');
      if (r === 'Admin' || r === 'Student/Alumni') savedRole = r;
    } catch {
      // ignore
    }
    if (!savedCode) {
      return false;
    }
    const stillApproved = await verifyApprovedInvitationCode(savedRole, savedCode);
    if (!stillApproved) {
      return false;
    }
  }

  // If user explicitly logged in with a valid invitation code, remove from deletedUids if present
  if (isExplicitLoginWithCode && deletedUids.includes(uid)) {
    deletedUids = deletedUids.filter((id) => id !== uid);
  }

  const alreadyRegistered = memberUids.includes(uid);
  if (!alreadyRegistered) {
    memberUids = [uid, ...memberUids].slice(0, 50);
  }

  try {
    if (snap.exists()) {
      await updateDoc(rosterRef, {
        memberUids,
        deletedUids: deletedUids.slice(0, 50),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(rosterRef, {
        memberUids,
        deletedUids: deletedUids.slice(0, 50),
        updatedByUid: uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, rosterPath);
  }

  return true;
}

export async function deleteCommitteeMemberFromFirestore(
  targetUid: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const rosterPath = 'committee_meta/roster';
  const rosterRef = doc(db, 'committee_meta', 'roster');

  let snap;
  try {
    snap = await getDoc(rosterRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, rosterPath);
  }

  let memberUids: string[] = [];
  let deletedUids: string[] = [];

  if (snap.exists()) {
    const data = snap.data();
    if (Array.isArray(data.memberUids)) memberUids = [...data.memberUids];
    if (Array.isArray(data.deletedUids)) deletedUids = [...data.deletedUids];
  }

  memberUids = memberUids.filter((id) => id !== targetUid);
  if (!deletedUids.includes(targetUid)) {
    deletedUids = [targetUid, ...deletedUids].slice(0, 50);
  }

  try {
    if (snap.exists()) {
      await updateDoc(rosterRef, {
        memberUids,
        deletedUids,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(rosterRef, {
        memberUids,
        deletedUids,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, rosterPath);
  }
}

export async function saveInvitationCodesToFirestore(
  invitations: CommitteeInvitation[]
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  await ensureAdminRecordInFirestore(currentUser.uid);

  const codesPath = 'invitation_meta/codes';
  const codesRef = doc(db, 'invitation_meta', 'codes');
  const invitationsJson = JSON.stringify(invitations).slice(0, 50000);

  let snap;
  try {
    snap = await getDoc(codesRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, codesPath);
  }

  try {
    if (snap.exists()) {
      await updateDoc(codesRef, {
        invitationsJson,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(codesRef, {
        invitationsJson,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, codesPath);
  }
}

const inFlightProfileOps = new Map<
  string,
  Promise<{
    profile: AmbassadorProfileData;
    privateInfo: PrivateContactData;
    isAllowedInCommittee: boolean;
  }>
>();

export async function ensureUserProfileInFirestore(
  user: User,
  selectedRole?: VerifiedAccessRole,
  usedInvitationCode?: string
): Promise<{
  profile: AmbassadorProfileData;
  privateInfo: PrivateContactData;
  isAllowedInCommittee: boolean;
}> {
  const opKey = `${user.uid}:${selectedRole || 'restore'}`;
  const existingOp = inFlightProfileOps.get(opKey);
  if (existingOp) {
    return existingOp;
  }

  const opPromise = (async () => {
    const profilePath = `profiles/${user.uid}`;
    const privatePath = `profiles/${user.uid}/private/contact`;
    const profileRef = doc(db, 'profiles', user.uid);
    const privateRef = doc(db, 'profiles', user.uid, 'private', 'contact');

    if (selectedRole) {
      try {
        localStorage.setItem('ka_verified_role_v1', selectedRole);
        if (user.email) {
          localStorage.setItem('ka_remembered_email_v1', user.email.toLowerCase());
        }
        if (usedInvitationCode) {
          localStorage.setItem('ka_verified_code_v1', usedInvitationCode.trim().toUpperCase());
        }
      } catch {
        // ignore
      }
    }

    let storedRole: VerifiedAccessRole | null = selectedRole || null;
    if (!storedRole) {
      try {
        const saved = localStorage.getItem('ka_verified_role_v1');
        if (saved === 'Student/Alumni' || saved === 'Admin') {
          storedRole = saved;
        }
      } catch {
        // ignore
      }
    }

    const safeEmail = (user.email || 'ambassador@campus.edu').trim().toLowerCase().slice(0, 160);

    let existingProfileSnap;
    try {
      existingProfileSnap = await getDoc(profileRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, profilePath);
    }

    const resolvedRole: VerifiedAccessRole =
      selectedRole ||
      (existingProfileSnap.exists() &&
      ((existingProfileSnap.data() as Partial<AmbassadorProfileData>).accessRole === 'Admin' ||
        (existingProfileSnap.data() as Partial<AmbassadorProfileData>).accessRole ===
          'Student/Alumni')
        ? ((existingProfileSnap.data() as Partial<AmbassadorProfileData>)
            .accessRole as VerifiedAccessRole)
        : storedRole || 'Student/Alumni');

    try {
      localStorage.setItem('ka_verified_role_v1', resolvedRole);
      if (user.email) {
        localStorage.setItem('ka_remembered_email_v1', user.email.toLowerCase());
      }
    } catch {
      // ignore
    }

    // Check committee roster permission first before writing
    const isAllowedInCommittee = await registerUserInCommitteeRoster(
      user.uid,
      Boolean(selectedRole)
    );

    if (!isAllowedInCommittee) {
      return {
        profile: sanitizeProfileInput({ displayName: user.displayName || 'Visitor' }, user.uid),
        privateInfo: {
          uid: user.uid,
          email: safeEmail,
          notificationsEnabled: true,
        },
        isAllowedInCommittee: false,
      };
    }

    const defaultRoleTitle =
      resolvedRole === 'Admin'
        ? 'Admin · Committee Executive'
        : 'Student / Alumni Ambassador';

    const defaultMinistryTeam: MinistryTeamOption =
      resolvedRole === 'Admin' ? 'Executive Board' : 'Worship & Prayer';

    let finalProfile: AmbassadorProfileData;

    if (!existingProfileSnap.exists()) {
      const sanitized = sanitizeProfileInput(
        {
          displayName: user.displayName || safeEmail.split('@')[0] || 'Committee Member',
          initials: computeInitials(user.displayName || safeEmail.split('@')[0] || 'KA'),
          roleTitle: defaultRoleTitle,
          ministryTeam: defaultMinistryTeam,
          majorAndYear: 'Year 1 Undergraduate',
          bio: 'Every Campus. Every Student. Multiplying Disciples. — Matthew 5:16',
          photoURL: user.photoURL || '',
          officeLine: '',
          accessRole: resolvedRole,
          accountTag: safeEmail,
          isOnline: true,
        },
        user.uid
      );

      try {
        const batch = writeBatch(db);
        batch.set(profileRef, {
          ...sanitized,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        batch.set(privateRef, {
          uid: user.uid,
          email: safeEmail,
          notificationsEnabled: true,
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, profilePath);
      }

      finalProfile = sanitized;
    } else {
      const existingData = existingProfileSnap.data() as Partial<AmbassadorProfileData>;
      const updatedSanitized = sanitizeProfileInput(
        {
          ...existingData,
          displayName: existingData.displayName || user.displayName || 'Committee Member',
          roleTitle: selectedRole ? defaultRoleTitle : existingData.roleTitle || defaultRoleTitle,
          ministryTeam:
            selectedRole === 'Admin'
              ? 'Executive Board'
              : (existingData.ministryTeam as MinistryTeamOption) || defaultMinistryTeam,
          photoURL: user.photoURL || existingData.photoURL || '',
          officeLine: existingData.officeLine ?? '',
          accessRole: resolvedRole,
          accountTag: safeEmail,
          isOnline: true,
        },
        user.uid
      );

      try {
        await updateDoc(profileRef, {
          displayName: updatedSanitized.displayName,
          initials: updatedSanitized.initials,
          roleTitle: updatedSanitized.roleTitle,
          ministryTeam: updatedSanitized.ministryTeam,
          majorAndYear: updatedSanitized.majorAndYear,
          bio: updatedSanitized.bio,
          photoURL: updatedSanitized.photoURL,
          officeLine: updatedSanitized.officeLine,
          accessRole: updatedSanitized.accessRole,
          accountTag: updatedSanitized.accountTag,
          isOnline: true,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, profilePath);
      }

      finalProfile = updatedSanitized;
    }

    let privateData: PrivateContactData = {
      uid: user.uid,
      email: safeEmail,
      notificationsEnabled: true,
    };

    if (existingProfileSnap.exists()) {
      try {
        const privateSnap = await getDoc(privateRef);
        if (privateSnap.exists()) {
          privateData = privateSnap.data() as PrivateContactData;
        } else {
          await setDoc(privateRef, {
            uid: user.uid,
            email: safeEmail,
            notificationsEnabled: true,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, privatePath);
      }
    }

    if (resolvedRole === 'Admin') {
      await ensureAdminRecordInFirestore(user.uid, usedInvitationCode || 'KAACC26');
    }

    return {
      profile: finalProfile,
      privateInfo: privateData,
      isAllowedInCommittee: true,
    };
  })();

  inFlightProfileOps.set(opKey, opPromise);
  try {
    return await opPromise;
  } finally {
    inFlightProfileOps.delete(opKey);
  }
}

export async function ensureAdminRecordInFirestore(
  uid: string,
  code = 'KAACC26'
): Promise<void> {
  const adminPath = `admins/${uid}`;
  const adminRef = doc(db, 'admins', uid);
  const safeCode = (code || 'KAACC26').trim().slice(0, 40);
  try {
    const snap = await getDoc(adminRef);
    if (!snap.exists()) {
      await setDoc(adminRef, {
        uid,
        invitationCode: safeCode.length >= 3 ? safeCode : 'KAACC26',
        grantedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, adminPath);
  }
}

export async function updateAmbassadorProfileInFirestore(
  uid: string,
  updates: Partial<AmbassadorProfileData>,
  notificationsEnabled?: boolean,
  email?: string
): Promise<void> {
  const profilePath = `profiles/${uid}`;
  const privatePath = `profiles/${uid}/private/contact`;
  const profileRef = doc(db, 'profiles', uid);
  const privateRef = doc(db, 'profiles', uid, 'private', 'contact');

  let existingData: Partial<AmbassadorProfileData> = {};
  try {
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      existingData = snap.data() as Partial<AmbassadorProfileData>;
    }
  } catch {
    // ignore
  }

  const sanitized = sanitizeProfileInput(
    {
      ...existingData,
      ...updates,
      accountTag:
        (updates.accountTag || existingData.accountTag || email || '')
          .trim()
          .toLowerCase()
          .slice(0, 160),
      isOnline: true,
    },
    uid
  );

  try {
    await updateDoc(profileRef, {
      displayName: sanitized.displayName,
      initials: sanitized.initials,
      roleTitle: sanitized.roleTitle,
      ministryTeam: sanitized.ministryTeam,
      majorAndYear: sanitized.majorAndYear,
      bio: sanitized.bio,
      photoURL: sanitized.photoURL,
      officeLine: sanitized.officeLine,
      accessRole: sanitized.accessRole,
      accountTag: sanitized.accountTag,
      isOnline: sanitized.isOnline,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, profilePath);
  }

  if (typeof notificationsEnabled === 'boolean' && email) {
    try {
      await updateDoc(privateRef, {
        email: email.trim().slice(0, 160),
        notificationsEnabled,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, privatePath);
    }
  }
}

export interface AdvisorEntryPayload {
  id: string;
  name: string;
  localChurch: string;
  ministry: string;
  officeLine: string;
  details: string;
  photoUrl: string;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function truncateToMaxWords(text: string, maxWords = 700): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  if (words.length <= maxWords) return trimmed;
  return words.slice(0, maxWords).join(' ');
}

export async function saveAdvisorToFirestore(
  advisor: AdvisorEntryPayload,
  existingIds: string[],
  seedAdvisorsIfEmpty?: AdvisorEntryPayload[]
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google as Admin (code KAACC26) to save changes to Firestore.');
  }

  // Ensure Admin record exists before writing to /advisors
  await ensureAdminRecordInFirestore(currentUser.uid);

  const safeId = advisor.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `adv-${Date.now()}`;
  const safeName = advisor.name.trim().slice(0, 120) || 'Advisor';
  const safeChurch = advisor.localChurch.trim().slice(0, 160) || 'Local Church';
  const safeMinistry = advisor.ministry.trim().slice(0, 160) || 'Campus Ministry';
  const safeOfficeLine = advisor.officeLine.trim().slice(0, 60) || 'N/A';
  const safeDetails = truncateToMaxWords(advisor.details, 700).slice(0, 5000) || 'Kingdom Ambassador Advisor.';
  const safePhotoUrl = (advisor.photoUrl || '').trim().slice(0, 250000);

  const rosterRef = doc(db, 'advisory_meta', 'roster');
  const advisorRef = doc(db, 'advisors', safeId);

  let rosterSnap;
  try {
    rosterSnap = await getDoc(rosterRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'advisory_meta/roster');
  }

  let existingAdvisorSnap;
  try {
    existingAdvisorSnap = await getDoc(advisorRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `advisors/${safeId}`);
  }

  const batch = writeBatch(db);

  // If the roster document doesn't exist yet in Firestore, seed default advisors too so none are lost
  let updatedIds: string[] = [];
  if (!rosterSnap.exists() && seedAdvisorsIfEmpty && seedAdvisorsIfEmpty.length > 0) {
    for (const seed of seedAdvisorsIfEmpty) {
      const seedId = seed.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
      if (!updatedIds.includes(seedId)) {
        updatedIds.push(seedId);
      }
      if (seedId !== safeId) {
        const sRef = doc(db, 'advisors', seedId);
        batch.set(sRef, {
          id: seedId,
          name: seed.name.trim().slice(0, 120),
          localChurch: seed.localChurch.trim().slice(0, 160),
          ministry: seed.ministry.trim().slice(0, 160),
          officeLine: seed.officeLine.trim().slice(0, 60),
          details: truncateToMaxWords(seed.details, 700).slice(0, 5000),
          photoUrl: (seed.photoUrl || '').trim().slice(0, 250000),
          updatedByUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } else if (rosterSnap.exists()) {
    const data = rosterSnap.data();
    if (Array.isArray(data.advisorIds)) {
      updatedIds = [...data.advisorIds];
    }
  } else {
    updatedIds = [...existingIds];
  }

  if (!updatedIds.includes(safeId)) {
    updatedIds = [safeId, ...updatedIds].slice(0, 50);
  } else {
    updatedIds = updatedIds.slice(0, 50);
  }

  if (existingAdvisorSnap.exists()) {
    batch.update(advisorRef, {
      name: safeName,
      localChurch: safeChurch,
      ministry: safeMinistry,
      officeLine: safeOfficeLine,
      details: safeDetails,
      photoUrl: safePhotoUrl,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(advisorRef, {
      id: safeId,
      name: safeName,
      localChurch: safeChurch,
      ministry: safeMinistry,
      officeLine: safeOfficeLine,
      details: safeDetails,
      photoUrl: safePhotoUrl,
      updatedByUid: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (rosterSnap.exists()) {
    batch.update(rosterRef, {
      advisorIds: updatedIds,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(rosterRef, {
      advisorIds: updatedIds,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `advisors/${safeId}`);
  }
}

export async function deleteAdvisorFromFirestore(
  advisorIdToRemove: string,
  remainingAdvisors: AdvisorEntryPayload[]
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in as Admin to delete an advisor profile.');
  }

  await ensureAdminRecordInFirestore(currentUser.uid);

  const safeRemoveId = advisorIdToRemove.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
  const rosterRef = doc(db, 'advisory_meta', 'roster');

  let rosterSnap;
  try {
    rosterSnap = await getDoc(rosterRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'advisory_meta/roster');
  }

  const batch = writeBatch(db);
  let nextIds: string[] = [];

  if (!rosterSnap.exists()) {
    // Seed the remaining advisors into Firestore so the roster reflects the deletion accurately
    for (const rem of remainingAdvisors) {
      const remId = rem.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
      if (remId && remId !== safeRemoveId && !nextIds.includes(remId)) {
        nextIds.push(remId);
        const sRef = doc(db, 'advisors', remId);
        batch.set(sRef, {
          id: remId,
          name: (rem.name || 'Advisor').trim().slice(0, 120),
          localChurch: (rem.localChurch || 'Local Church').trim().slice(0, 160),
          ministry: (rem.ministry || 'Campus Ministry').trim().slice(0, 160),
          officeLine: (rem.officeLine || 'N/A').trim().slice(0, 60),
          details:
            truncateToMaxWords(rem.details || 'Kingdom Ambassador Advisor.', 700).slice(
              0,
              5000
            ) || 'Kingdom Ambassador Advisor.',
          photoUrl: (rem.photoUrl || '').trim().slice(0, 250000),
          updatedByUid: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    batch.set(rosterRef, {
      advisorIds: nextIds.slice(0, 50),
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  } else {
    const data = rosterSnap.data();
    const currentIds = Array.isArray(data.advisorIds) ? data.advisorIds : [];
    nextIds = currentIds.filter((id: string) => id !== safeRemoveId).slice(0, 50);
    batch.update(rosterRef, {
      advisorIds: nextIds,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'advisory_meta/roster');
  }
}

export interface EventFirestorePayload {
  id: string;
  title: string;
  monthShort: string;
  dayNumber: string;
  dayOfWeek: string;
  fullDate: string;
  timeRange: string;
  location: string;
  description: string;
  type: 'Meeting' | 'Worship' | 'Outreach' | 'Prayer';
  imageUrl?: string;
  isFeaturedMeeting?: boolean;
  rsvpStatus?: 'Going' | 'Maybe' | 'Not Going';
  attendees: {
    initials: string;
    name: string;
    role: string;
    bgClass: string;
    textClass: string;
  }[];
  agenda?: string[];
}

function sanitizeEventForFirestore(evt: EventFirestorePayload, uid: string) {
  const safeId = evt.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || `evt-${Date.now()}`;
  const validTypes = ['Meeting', 'Worship', 'Outreach', 'Prayer'] as const;
  const safeType = validTypes.includes(evt.type) ? evt.type : 'Worship';
  const validRsvp = ['Going', 'Maybe', 'Not Going'] as const;
  const safeRsvp = evt.rsvpStatus && validRsvp.includes(evt.rsvpStatus) ? evt.rsvpStatus : 'Going';

  return {
    id: safeId,
    title: (evt.title || 'Campus Event').trim().slice(0, 140) || 'Campus Event',
    monthShort: (evt.monthShort || 'MAR').trim().slice(0, 12) || 'MAR',
    dayNumber: (evt.dayNumber || '09').trim().slice(0, 10) || '09',
    dayOfWeek: (evt.dayOfWeek || 'Tue').trim().slice(0, 20) || 'Tue',
    fullDate: (evt.fullDate || 'March 9, 2027').trim().slice(0, 120) || 'March 9, 2027',
    timeRange: (evt.timeRange || '7:00 PM – 9:00 PM').trim().slice(0, 80) || '7:00 PM – 9:00 PM',
    location: (evt.location || 'Bangunan Yin').trim().slice(0, 160) || 'Bangunan Yin',
    description:
      (evt.description || 'Kingdom Ambassador Campus Gathering.').trim().slice(0, 3000) ||
      'Kingdom Ambassador Campus Gathering.',
    type: safeType,
    imageUrl: (evt.imageUrl || '').trim().slice(0, 250000),
    isFeaturedMeeting: Boolean(evt.isFeaturedMeeting),
    rsvpStatus: safeRsvp,
    attendeesJson: JSON.stringify(Array.isArray(evt.attendees) ? evt.attendees : []).slice(0, 20000),
    agendaJson: JSON.stringify(Array.isArray(evt.agenda) ? evt.agenda : []).slice(0, 10000),
    updatedByUid: uid,
  };
}

export async function saveEventToFirestore(
  event: EventFirestorePayload,
  existingIds: string[],
  seedEventsIfEmpty?: EventFirestorePayload[]
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Please sign in with Google as Admin (code KAACC26) to save events to Firestore.');
  }

  await ensureAdminRecordInFirestore(currentUser.uid);

  const sanitized = sanitizeEventForFirestore(event, currentUser.uid);
  const safeId = sanitized.id;

  const rosterRef = doc(db, 'event_meta', 'roster');
  const eventRef = doc(db, 'events', safeId);

  let rosterSnap;
  try {
    rosterSnap = await getDoc(rosterRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'event_meta/roster');
  }

  let existingEventSnap;
  try {
    existingEventSnap = await getDoc(eventRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `events/${safeId}`);
  }

  const batch = writeBatch(db);

  let updatedIds: string[] = [];
  if (!rosterSnap.exists() && seedEventsIfEmpty && seedEventsIfEmpty.length > 0) {
    for (const seed of seedEventsIfEmpty) {
      const seedSanitized = sanitizeEventForFirestore(seed, currentUser.uid);
      if (!updatedIds.includes(seedSanitized.id)) {
        updatedIds.push(seedSanitized.id);
      }
      if (seedSanitized.id !== safeId) {
        const sRef = doc(db, 'events', seedSanitized.id);
        batch.set(sRef, {
          ...seedSanitized,
          isFeaturedMeeting: sanitized.isFeaturedMeeting ? false : seedSanitized.isFeaturedMeeting,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } else if (rosterSnap.exists()) {
    const data = rosterSnap.data();
    if (Array.isArray(data.eventIds)) {
      updatedIds = [...data.eventIds];
    }
  } else {
    updatedIds = [...existingIds];
  }

  if (!updatedIds.includes(safeId)) {
    updatedIds = [safeId, ...updatedIds].slice(0, 50);
  } else {
    updatedIds = updatedIds.slice(0, 50);
  }

  if (existingEventSnap.exists()) {
    batch.update(eventRef, {
      title: sanitized.title,
      monthShort: sanitized.monthShort,
      dayNumber: sanitized.dayNumber,
      dayOfWeek: sanitized.dayOfWeek,
      fullDate: sanitized.fullDate,
      timeRange: sanitized.timeRange,
      location: sanitized.location,
      description: sanitized.description,
      type: sanitized.type,
      imageUrl: sanitized.imageUrl,
      isFeaturedMeeting: sanitized.isFeaturedMeeting,
      rsvpStatus: sanitized.rsvpStatus,
      attendeesJson: sanitized.attendeesJson,
      agendaJson: sanitized.agendaJson,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(eventRef, {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (rosterSnap.exists()) {
    batch.update(rosterRef, {
      eventIds: updatedIds,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(rosterRef, {
      eventIds: updatedIds,
      updatedByUid: currentUser.uid,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `events/${safeId}`);
  }
}

export async function saveDashboardSyncToFirestore(payload: {
  announcements: unknown[];
  members: unknown[];
  tasks: unknown[];
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return;
  }

  await ensureAdminRecordInFirestore(currentUser.uid);

  const syncPath = 'dashboard_sync/public_board';
  const syncRef = doc(db, 'dashboard_sync', 'public_board');

  const announcementsJson = JSON.stringify(payload.announcements || []).slice(0, 100000);
  const membersJson = JSON.stringify(payload.members || []).slice(0, 100000);
  const tasksJson = JSON.stringify(payload.tasks || []).slice(0, 100000);

  let existingSnap;
  try {
    existingSnap = await getDoc(syncRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, syncPath);
  }

  try {
    if (existingSnap.exists()) {
      await updateDoc(syncRef, {
        announcementsJson,
        membersJson,
        tasksJson,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(syncRef, {
        announcementsJson,
        membersJson,
        tasksJson,
        updatedByUid: currentUser.uid,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, syncPath);
  }
}


