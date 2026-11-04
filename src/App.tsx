/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Home,
  Users,
  Calendar,
  CheckSquare,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Plus,
  Megaphone,
  Check,
  Menu,
  X,
  UserCircle2,
  ShieldCheck,
  Award,
  Edit3,
} from 'lucide-react';
import {
  NavSection,
  CommitteeTask,
  CommitteeEvent,
  CommitteeMember,
  CommitteeAnnouncement,
  AdvisorMember,
  TaskPriority,
  INITIAL_TASKS,
  INITIAL_EVENTS,
  INITIAL_MEMBERS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_ADVISORS,
} from './data/committeeData';
import {
  auth,
  db,
  OperationType,
  handleFirestoreError,
  AmbassadorProfileData,
  PrivateContactData,
  VerifiedAccessRole,
  CommitteeInvitation,
  DEFAULT_INVITATIONS,
  isInteractiveSignInActive,
  setInteractiveSignInActive,
  signInWithGooglePopup,
  signOutUser,
  ensureUserProfileInFirestore,
  updateAmbassadorProfileInFirestore,
  setUserOnlineStatusInFirestore,
  deleteCommitteeMemberFromFirestore,
  saveInvitationCodesToFirestore,
  saveAdvisorToFirestore,
  deleteAdvisorFromFirestore,
  saveEventToFirestore,
  saveDashboardSyncToFirestore,
} from './lib/firebase';
import {
  KACrestLogo,
  WorshipHeroBanner,
  OverviewReachUsSection,
} from './components/BrandVisuals';
import {
  CreateEventModal,
  CreateTaskModal,
  AnnouncementsModal,
  MeetingDetailsModal,
} from './components/InteractiveModals';
import { ProfilePageView } from './components/ProfilePageView';
import { AdvisoryCouncilView } from './components/AdvisoryCouncilView';
import {
  CommitteeDirectoryView,
  EventsDirectoryView,
  TasksDirectoryView,
} from './components/SecondaryViews';

const COLOR_SWATCHES = [
  { hex: '#6D28D9', name: 'Royal Purple', bg: 'bg-[#6D28D9]', border: 'border-[#6D28D9]' },
  { hex: '#14245B', name: 'Dark Royal Blue', bg: 'bg-[#14245B]', border: 'border-[#14245B]' },
  { hex: '#D4AF37', name: 'Gold', bg: 'bg-[#D4AF37]', border: 'border-[#D4AF37]' },
  { hex: '#FFFFFF', name: 'White', bg: 'bg-[#FFFFFF]', border: 'border-[#D1D5DB]' },
  { hex: '#E5E7EB', name: 'Light Gray', bg: 'bg-[#E5E7EB]', border: 'border-[#D1D5DB]' },
  { hex: '#6B7280', name: 'Gray', bg: 'bg-[#6B7280]', border: 'border-[#6B7280]' },
];

const DEFAULT_PREVIEW_PROFILE: AmbassadorProfileData = {
  uid: 'preview-guest',
  displayName: 'Guest Visitor',
  initials: 'KA',
  roleTitle: 'Public Visitor',
  ministryTeam: 'Worship & Prayer',
  majorAndYear: 'Kingdom Ambassador Portal',
  bio: 'Every Campus. Every Student. Multiplying Disciples. — Matthew 5:16',
  photoURL: '',
  officeLine: '',
  accessRole: 'Student/Alumni',
  accountTag: '',
  isOnline: false,
};

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Firebase Auth & Firestore Profile State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [profileReady, setProfileReady] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<AmbassadorProfileData>(DEFAULT_PREVIEW_PROFILE);
  const [privateInfo, setPrivateInfo] = useState<PrivateContactData | null>(null);
  const [verifiedRole, setVerifiedRole] = useState<VerifiedAccessRole | null>(() => {
    try {
      const saved = localStorage.getItem('ka_verified_role_v1');
      if (saved === 'Student/Alumni' || saved === 'Admin') return saved;
    } catch {
      // ignore
    }
    return null;
  });

  const isAdmin = Boolean(
    firebaseUser &&
      (verifiedRole === 'Admin' || userProfile.accessRole === 'Admin')
  );

  const isSAOrAdmin = Boolean(
    firebaseUser &&
      (verifiedRole === 'Student/Alumni' ||
        verifiedRole === 'Admin' ||
        isAdmin)
  );

  // Advisory Council Live State (visible to Public, SA, and Admin)
  const [advisorIds, setAdvisorIds] = useState<string[]>([]);
  const [advisoryRosterSynced, setAdvisoryRosterSynced] = useState<boolean>(false);
  const [advisorsMap, setAdvisorsMap] = useState<Record<string, AdvisorMember>>({});
  const [localFallbackAdvisors, setLocalFallbackAdvisors] = useState<AdvisorMember[]>(() => {
    try {
      const saved = localStorage.getItem('ka_advisors_v1');
      return saved ? JSON.parse(saved) : INITIAL_ADVISORS;
    } catch {
      return INITIAL_ADVISORS;
    }
  });

  // Listen to Firebase Auth state (automatically logs in from the same email on the same device unless user logs out)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (isInteractiveSignInActive()) {
        // handleGoogleSignInWithRole is currently handling this login with the verified role and code
        setAuthLoading(false);
        return;
      }
      if (currentUser) {
        try {
          const { profile, privateInfo: priv, isAllowedInCommittee } =
            await ensureUserProfileInFirestore(currentUser);
          if (!isAllowedInCommittee) {
            // User was deleted from committee by Admin or session has no approved invitation code
            await signOutUser();
            setFirebaseUser(null);
            setProfileReady(false);
            setUserProfile(DEFAULT_PREVIEW_PROFILE);
            setPrivateInfo(null);
            setVerifiedRole(null);
            setAuthLoading(false);
            return;
          }
          setUserProfile(profile);
          setPrivateInfo(priv);
          if (profile.accessRole) {
            setVerifiedRole(profile.accessRole);
          }
          setProfileReady(true);
        } catch (err) {
          console.warn('Error initializing user profile in Firestore:', err);
        }
      } else {
        setProfileReady(false);
        setUserProfile(DEFAULT_PREVIEW_PROFILE);
        setPrivateInfo(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Automatically mark user offline when tab/window closes, and online when focused
  useEffect(() => {
    if (!firebaseUser) return;
    const uid = firebaseUser.uid;

    const handlePageHide = () => {
      setUserOnlineStatusInFirestore(uid, false).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setUserOnlineStatusInFirestore(uid, true).catch(() => {});
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [firebaseUser]);

  // Real-time Firestore listener for authenticated user's profile
  useEffect(() => {
    if (!firebaseUser || !profileReady) return;

    const profilePath = `profiles/${firebaseUser.uid}`;
    const privatePath = `profiles/${firebaseUser.uid}/private/contact`;

    const unsubProfile = onSnapshot(
      doc(db, 'profiles', firebaseUser.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as AmbassadorProfileData);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, profilePath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    const unsubPrivate = onSnapshot(
      doc(db, 'profiles', firebaseUser.uid, 'private', 'contact'),
      (snapshot) => {
        if (snapshot.exists()) {
          setPrivateInfo(snapshot.data() as PrivateContactData);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, privatePath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    return () => {
      unsubProfile();
      unsubPrivate();
    };
  }, [firebaseUser, profileReady]);

  // Real-time Firestore listener for Advisory Council Roster (Public, SA, and Admin)
  useEffect(() => {
    const rosterPath = 'advisory_meta/roster';
    const unsubRoster = onSnapshot(
      doc(db, 'advisory_meta', 'roster'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.advisorIds)) {
            setAdvisorIds(data.advisorIds);
            setAdvisoryRosterSynced(true);
          }
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, rosterPath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    return () => unsubRoster();
  }, []);

  // Real-time Firestore listeners for each Advisor document in advisorIds
  useEffect(() => {
    if (advisorIds.length === 0) return;

    const unsubs = advisorIds.map((advId) => {
      const advPath = `advisors/${advId}`;
      return onSnapshot(
        doc(db, 'advisors', advId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AdvisorMember;
            setAdvisorsMap((prev) => ({
              ...prev,
              [advId]: {
                id: data.id || advId,
                name: data.name,
                localChurch: data.localChurch,
                ministry: data.ministry,
                officeLine: data.officeLine,
                details: data.details,
                photoUrl: data.photoUrl || '',
                updatedByUid: data.updatedByUid,
              },
            }));
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, advPath);
          } catch {
            // Handled by handleFirestoreError
          }
        }
      );
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [advisorIds]);

  // Compute displayed advisors list (from live Firestore if populated, else fallback to INITIAL_ADVISORS)
  const syncedAdvisors = advisorIds
    .map((id) => advisorsMap[id])
    .filter((item): item is AdvisorMember => Boolean(item));
  const displayedAdvisors: AdvisorMember[] = advisoryRosterSynced
    ? syncedAdvisors.length > 0 || advisorIds.length === 0
      ? syncedAdvisors
      : localFallbackAdvisors
    : syncedAdvisors.length > 0
      ? syncedAdvisors
      : localFallbackAdvisors;

  // Live Events State (visible to Public, SA, and Admin)
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, CommitteeEvent>>({});
  const [localFallbackEvents, setLocalFallbackEvents] = useState<CommitteeEvent[]>(() => {
    try {
      const saved = localStorage.getItem('ka_events_v2');
      return saved ? JSON.parse(saved) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  });

  // Real-time Firestore listener for Event Roster (Public, SA, and Admin)
  useEffect(() => {
    const rosterPath = 'event_meta/roster';
    const unsubEventRoster = onSnapshot(
      doc(db, 'event_meta', 'roster'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.eventIds)) {
            setEventIds(data.eventIds);
          }
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, rosterPath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    return () => unsubEventRoster();
  }, []);

  // Real-time Firestore listeners for each Event document in eventIds
  useEffect(() => {
    if (eventIds.length === 0) return;

    const unsubs = eventIds.map((evtId) => {
      const evtPath = `events/${evtId}`;
      return onSnapshot(
        doc(db, 'events', evtId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            let parsedAttendees: CommitteeEvent['attendees'] = [];
            let parsedAgenda: string[] = [];
            try {
              if (typeof data.attendeesJson === 'string') {
                parsedAttendees = JSON.parse(data.attendeesJson);
              }
            } catch {
              parsedAttendees = [];
            }
            try {
              if (typeof data.agendaJson === 'string') {
                parsedAgenda = JSON.parse(data.agendaJson);
              }
            } catch {
              parsedAgenda = [];
            }

            const mappedEvent: CommitteeEvent = {
              id: data.id || evtId,
              title: data.title || 'Campus Event',
              monthShort: data.monthShort || 'MAR',
              dayNumber: data.dayNumber || '09',
              dayOfWeek: data.dayOfWeek || 'Tue',
              fullDate: data.fullDate || 'March 9, 2027',
              timeRange: data.timeRange || '7:00 PM – 9:00 PM',
              location: data.location || 'Bangunan Yin',
              description: data.description || '',
              type: data.type || 'Worship',
              imageUrl: data.imageUrl || '',
              isFeaturedMeeting: Boolean(data.isFeaturedMeeting),
              rsvpStatus: data.rsvpStatus || 'Going',
              attendees: Array.isArray(parsedAttendees) ? parsedAttendees : [],
              agenda: Array.isArray(parsedAgenda) ? parsedAgenda : [],
            };

            setEventsMap((prev) => ({
              ...prev,
              [evtId]: mappedEvent,
            }));
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, evtPath);
          } catch {
            // Handled by handleFirestoreError
          }
        }
      );
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [eventIds]);

  const syncedEvents = eventIds
    .map((id) => eventsMap[id])
    .filter((item): item is CommitteeEvent => Boolean(item));
  const events: CommitteeEvent[] =
    syncedEvents.length > 0 ? syncedEvents : localFallbackEvents;

  // Persistent & Live-Synced Dashboard State (Announcements, Tasks, Registered Committee Members, Invitations)
  const [tasks, setTasks] = useState<CommitteeTask[]>(() => {
    try {
      const saved = localStorage.getItem('ka_tasks_v1');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [announcements, setAnnouncements] = useState<CommitteeAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem('ka_announcements_v1');
      return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  // Live Invitation Codes (General KASA26 & KAACC26 + Admin-added generated codes)
  const [invitations, setInvitations] = useState<CommitteeInvitation[]>(() => {
    try {
      const saved = localStorage.getItem('ka_invitations_v1');
      if (saved) {
        const parsed: CommitteeInvitation[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const mergedMap = new Map<string, CommitteeInvitation>();
          DEFAULT_INVITATIONS.forEach((d) => mergedMap.set(d.code.toUpperCase(), d));
          parsed.forEach((item) => {
            if (item && item.code) {
              const codeKey = item.code.trim().toUpperCase();
              if (codeKey !== 'KASA26' && codeKey !== 'KAACC26') {
                mergedMap.set(codeKey, { ...item, code: codeKey });
              }
            }
          });
          return Array.from(mergedMap.values());
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_INVITATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ka_invitations_v1', JSON.stringify(invitations));
    } catch {
      // ignore
    }
  }, [invitations]);

  useEffect(() => {
    const codesPath = 'invitation_meta/codes';
    const unsubCodes = onSnapshot(
      doc(db, 'invitation_meta', 'codes'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          try {
            if (typeof data.invitationsJson === 'string') {
              const parsed: CommitteeInvitation[] = JSON.parse(data.invitationsJson);
              if (Array.isArray(parsed)) {
                const mergedMap = new Map<string, CommitteeInvitation>();
                DEFAULT_INVITATIONS.forEach((d) =>
                  mergedMap.set(d.code.toUpperCase(), d)
                );
                parsed.forEach((item) => {
                  if (item && item.code) {
                    const codeKey = item.code.trim().toUpperCase();
                    if (codeKey !== 'KASA26' && codeKey !== 'KAACC26') {
                      mergedMap.set(codeKey, { ...item, code: codeKey });
                    }
                  }
                });
                setInvitations(Array.from(mergedMap.values()));
              }
            }
          } catch {
            // ignore malformed JSON
          }
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, codesPath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    return () => unsubCodes();
  }, []);

  // Live Registered Committee Roster (Only logged-in users from invitation codes, 1 unique entry per email)
  const [memberUids, setMemberUids] = useState<string[]>([]);
  const [deletedUids, setDeletedUids] = useState<string[]>([]);
  const [committeeProfilesMap, setCommitteeProfilesMap] = useState<
    Record<string, AmbassadorProfileData>
  >({});

  useEffect(() => {
    const rosterPath = 'committee_meta/roster';
    const unsubCommitteeRoster = onSnapshot(
      doc(db, 'committee_meta', 'roster'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const nextMembers = Array.isArray(data.memberUids) ? data.memberUids : [];
          const nextDeleted = Array.isArray(data.deletedUids) ? data.deletedUids : [];
          setMemberUids(nextMembers);
          setDeletedUids(nextDeleted);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, rosterPath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    return () => unsubCommitteeRoster();
  }, []);

  // If an Admin deletes the currently logged-in user, sign them out automatically
  useEffect(() => {
    if (firebaseUser && deletedUids.includes(firebaseUser.uid)) {
      signOutUser().then(() => {
        setFirebaseUser(null);
        setProfileReady(false);
        setVerifiedRole(null);
        setUserProfile(DEFAULT_PREVIEW_PROFILE);
      });
    }
  }, [firebaseUser, deletedUids]);

  // Listen in real time to each registered member's profile document (/profiles/{uid})
  useEffect(() => {
    if (memberUids.length === 0) return;

    const unsubs = memberUids.map((uid) => {
      const pPath = `profiles/${uid}`;
      return onSnapshot(
        doc(db, 'profiles', uid),
        (snapshot) => {
          if (snapshot.exists()) {
            const pData = snapshot.data() as AmbassadorProfileData;
            setCommitteeProfilesMap((prev) => ({
              ...prev,
              [uid]: {
                ...pData,
                uid: pData.uid || uid,
              },
            }));
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, pPath);
          } catch {
            // Handled by handleFirestoreError
          }
        }
      );
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [memberUids]);

  // Build deduplicated CommitteeMember list (strictly 1 unique member per email & UID, excluding deletedUids)
  const members: CommitteeMember[] = (() => {
    const seenEmails = new Set<string>();
    const seenUids = new Set<string>();
    const list: CommitteeMember[] = [];

    for (const uid of memberUids) {
      if (deletedUids.includes(uid) || seenUids.has(uid)) continue;
      const p =
        firebaseUser && firebaseUser.uid === uid && profileReady
          ? userProfile
          : committeeProfilesMap[uid];
      if (!p) continue;

      const emailKey = (
        p.accountTag ||
        (firebaseUser && firebaseUser.uid === uid ? firebaseUser.email || '' : '')
      )
        .trim()
        .toLowerCase();

      if (emailKey && seenEmails.has(emailKey)) continue;
      if (emailKey) seenEmails.add(emailKey);
      seenUids.add(uid);

      const isAdminMember = p.accessRole === 'Admin';
      list.push({
        id: uid,
        uid,
        name: p.displayName || 'Committee Member',
        initials: p.initials || 'KA',
        role: p.roleTitle || 'Committee Member',
        ministryTeam: p.ministryTeam || 'Worship & Prayer',
        majorAndYear: p.majorAndYear || 'Year 1 Undergraduate',
        email: emailKey,
        phoneNumber: p.officeLine || '',
        bio: p.bio || '',
        photoURL: p.photoURL || '',
        accessRole: isAdminMember ? 'Admin' : 'Student/Alumni',
        isOnline:
          firebaseUser && firebaseUser.uid === uid
            ? true
            : Boolean(p.isOnline),
        avatarBg: isAdminMember ? 'bg-[#14245B]' : 'bg-[#6D28D9]',
        avatarText: isAdminMember ? 'text-[#D4AF37]' : 'text-white',
        activeTasksCount: 0,
      });
    }

    return list;
  })();

  // Real-time Firestore listener for Announcements and Tasks
  useEffect(() => {
    const syncPath = 'dashboard_sync/public_board';
    const unsubBoard = onSnapshot(
      doc(db, 'dashboard_sync', 'public_board'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          try {
            if (typeof data.announcementsJson === 'string') {
              const parsedAnn = JSON.parse(data.announcementsJson);
              if (Array.isArray(parsedAnn)) {
                setAnnouncements(parsedAnn);
              }
            }
          } catch {
            // ignore malformed JSON
          }
          try {
            if (typeof data.tasksJson === 'string') {
              const parsedTasks = JSON.parse(data.tasksJson);
              if (Array.isArray(parsedTasks)) {
                setTasks(parsedTasks);
              }
            }
          } catch {
            // ignore malformed JSON
          }
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, syncPath);
        } catch {
          // Handled by handleFirestoreError
        }
      }
    );

    return () => unsubBoard();
  }, []);

  const totalMemberCount = members.length;
  const onlineMemberCount = members.filter((m) => m.isOnline).length;

  useEffect(() => {
    try {
      localStorage.setItem('ka_tasks_v1', JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('ka_events_v2', JSON.stringify(localFallbackEvents));
    } catch {
      // ignore
    }
  }, [localFallbackEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('ka_announcements_v1', JSON.stringify(announcements));
    } catch {
      // ignore
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem('ka_advisors_v1', JSON.stringify(localFallbackAdvisors));
    } catch {
      // ignore
    }
  }, [localFallbackAdvisors]);

  // Search & Popover States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Modal States
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommitteeEvent | null>(null);
  const [overviewEventIdx, setOverviewEventIdx] = useState(0);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CommitteeTask | null>(null);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<CommitteeEvent | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auth & Profile Handlers
  const handleGoogleSignInWithRole = async (
    selectedRole: VerifiedAccessRole,
    usedCode?: string
  ) => {
    setInteractiveSignInActive(true);
    try {
      const user = await signInWithGooglePopup();
      setFirebaseUser(user);
      setVerifiedRole(selectedRole);
      const { profile, privateInfo: priv } = await ensureUserProfileInFirestore(
        user,
        selectedRole,
        usedCode
      );
      setUserProfile(profile);
      setPrivateInfo(priv);
      setProfileReady(true);
      setMemberUids((prev) => (prev.includes(user.uid) ? prev : [user.uid, ...prev]));
      setDeletedUids((prev) => prev.filter((id) => id !== user.uid));
    } finally {
      setInteractiveSignInActive(false);
    }
  };

  const handleSignOut = async () => {
    setProfileReady(false);
    setVerifiedRole(null);
    await signOutUser();
  };

  const handleSaveProfile = async (
    updates: Partial<AmbassadorProfileData>,
    notificationsEnabled: boolean
  ) => {
    if (!firebaseUser) return;
    await updateAmbassadorProfileInFirestore(
      firebaseUser.uid,
      updates,
      notificationsEnabled,
      privateInfo?.email || firebaseUser.email || 'ambassador@campus.edu'
    );
  };

  // Admin Invitation & Member Management Handlers
  const handleCreateInvitation = async (newInv: CommitteeInvitation) => {
    if (!isAdmin) return;
    const filtered = invitations.filter(
      (i) => i.code.toUpperCase() !== newInv.code.toUpperCase()
    );
    const nextInvitations = [newInv, ...filtered];
    setInvitations(nextInvitations);
    if (firebaseUser) {
      await saveInvitationCodesToFirestore(nextInvitations).catch((err) =>
        console.warn('Invitation create sync notice:', err)
      );
    }
  };

  const handleDeleteInvitation = async (invId: string) => {
    if (!isAdmin) return;
    const nextInvitations = invitations.filter(
      (i) => i.id !== invId || i.code === 'KASA26' || i.code === 'KAACC26'
    );
    setInvitations(nextInvitations);
    if (firebaseUser) {
      await saveInvitationCodesToFirestore(nextInvitations).catch((err) =>
        console.warn('Invitation delete sync notice:', err)
      );
    }
  };

  const handleDeleteMember = (targetUid: string) => {
    if (!isAdmin) return;
    setMemberUids((prev) => prev.filter((id) => id !== targetUid));
    setDeletedUids((prev) => (prev.includes(targetUid) ? prev : [targetUid, ...prev]));
    if (firebaseUser) {
      deleteCommitteeMemberFromFirestore(targetUid).catch((err) =>
        console.warn('Member delete sync notice:', err)
      );
    }
  };

  // Advisory Council Save & Delete Handlers (Admin only)
  const handleSaveAdvisor = async (advisor: AdvisorMember) => {
    if (!isAdmin) return;
    setLocalFallbackAdvisors((prev) => {
      const exists = prev.some((a) => a.id === advisor.id);
      if (exists) {
        return prev.map((a) => (a.id === advisor.id ? advisor : a));
      }
      return [advisor, ...prev];
    });
    setAdvisorsMap((prev) => ({
      ...prev,
      [advisor.id]: advisor,
    }));

    if (firebaseUser) {
      await saveAdvisorToFirestore(
        advisor,
        advisorIds.length > 0 || advisoryRosterSynced
          ? advisorIds
          : displayedAdvisors.map((a) => a.id),
        displayedAdvisors
      );
    }
  };

  const handleDeleteAdvisor = async (advisorId: string) => {
    if (!isAdmin) return;
    const remainingAdvisors = displayedAdvisors.filter((a) => a.id !== advisorId);
    setLocalFallbackAdvisors((prev) => prev.filter((a) => a.id !== advisorId));
    setAdvisorIds((prev) => prev.filter((id) => id !== advisorId));
    setAdvisorsMap((prev) => {
      const next = { ...prev };
      delete next[advisorId];
      return next;
    });

    if (firebaseUser) {
      await deleteAdvisorFromFirestore(advisorId, remainingAdvisors).catch((err) =>
        console.warn('Advisor delete sync notice:', err)
      );
    }
  };

  // Dashboard Handlers (Live Synced to Firestore when Admin updates)
  const handleToggleTask = (taskId: string) => {
    if (!isAdmin) return;
    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(nextTasks);
    if (firebaseUser) {
      saveDashboardSyncToFirestore({
        announcements,
        members: [],
        tasks: nextTasks,
      }).catch((err) => console.warn('Task toggle sync notice:', err));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (!isAdmin) return;
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(nextTasks);
    if (firebaseUser) {
      saveDashboardSyncToFirestore({
        announcements,
        members: [],
        tasks: nextTasks,
      }).catch((err) => console.warn('Task delete sync notice:', err));
    }
  };

  const handleSaveTask = (savedTask: CommitteeTask) => {
    if (!isAdmin) return;
    const exists = tasks.some((t) => t.id === savedTask.id);
    const nextTasks = exists
      ? tasks.map((t) => (t.id === savedTask.id ? savedTask : t))
      : [savedTask, ...tasks];
    setTasks(nextTasks);
    if (firebaseUser) {
      saveDashboardSyncToFirestore({
        announcements,
        members: [],
        tasks: nextTasks,
      }).catch((err) => console.warn('Task save sync notice:', err));
    }
  };

  const handleSaveEvent = (savedEvent: CommitteeEvent) => {
    if (!isAdmin) return;
    setLocalFallbackEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => {
          if (e.id === savedEvent.id) return savedEvent;
          if (savedEvent.isFeaturedMeeting) return { ...e, isFeaturedMeeting: false };
          return e;
        });
      }
      if (savedEvent.isFeaturedMeeting) {
        return [
          savedEvent,
          ...prev.map((e) => ({ ...e, isFeaturedMeeting: false })),
        ];
      }
      return [savedEvent, ...prev];
    });
    if (selectedMeeting && selectedMeeting.id === savedEvent.id) {
      setSelectedMeeting(savedEvent);
    }
    if (firebaseUser) {
      saveEventToFirestore(
        savedEvent,
        eventIds.length > 0 ? eventIds : events.map((e) => e.id),
        events
      ).catch((err) => console.warn('Event live sync notice:', err));
    }
  };

  const handleUpdateRsvp = (eventId: string, status: 'Going' | 'Maybe' | 'Not Going') => {
    if (!isAdmin) return;
    const targetEvent = events.find((e) => e.id === eventId);
    setLocalFallbackEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, rsvpStatus: status } : e))
    );
    if (selectedMeeting && selectedMeeting.id === eventId) {
      setSelectedMeeting((prev) => (prev ? { ...prev, rsvpStatus: status } : null));
    }
    if (firebaseUser && targetEvent) {
      const updatedEvent: CommitteeEvent = { ...targetEvent, rsvpStatus: status };
      saveEventToFirestore(
        updatedEvent,
        eventIds.length > 0 ? eventIds : events.map((e) => e.id),
        events
      ).catch((err) => console.warn('Event RSVP live sync notice:', err));
    }
  };

  const handleSaveAnnouncement = (savedAnn: CommitteeAnnouncement) => {
    if (!isAdmin) return;
    const exists = announcements.some((a) => a.id === savedAnn.id);
    const nextAnnouncements = exists
      ? announcements.map((a) => (a.id === savedAnn.id ? savedAnn : a))
      : [savedAnn, ...announcements];
    setAnnouncements(nextAnnouncements);
    if (firebaseUser) {
      saveDashboardSyncToFirestore({
        announcements: nextAnnouncements,
        members: [],
        tasks,
      }).catch((err) => console.warn('Announcement save sync notice:', err));
    }
  };

  const handleDeleteAnnouncement = (annId: string) => {
    if (!isAdmin) return;
    const nextAnnouncements = announcements.filter((a) => a.id !== annId);
    setAnnouncements(nextAnnouncements);
    if (firebaseUser) {
      saveDashboardSyncToFirestore({
        announcements: nextAnnouncements,
        members: [],
        tasks,
      }).catch((err) => console.warn('Announcement delete sync notice:', err));
    }
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1600);
  };

  // Derived Dashboard Metrics
  const thisWeekTasks = tasks.filter((t) => t.showInThisWeek).slice(0, 6);
  const overdueCount = tasks.filter((t) => t.isOverdue && !t.completed).length;
  const newAnnouncementsCount = announcements.filter((a) => a.isNewThisWeek).length;
  const featuredMeeting =
    events.find((e) => e.isFeaturedMeeting) || events[0] || INITIAL_EVENTS[0];

  // Global Search Results
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const matchedEvents = trimmedSearch
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(trimmedSearch) ||
          e.location.toLowerCase().includes(trimmedSearch)
      )
    : [];
  const matchedTasks =
    trimmedSearch && isSAOrAdmin
      ? tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(trimmedSearch) ||
            t.assignee.toLowerCase().includes(trimmedSearch)
        )
      : [];
  const matchedMembers = trimmedSearch
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(trimmedSearch) ||
          m.role.toLowerCase().includes(trimmedSearch)
      )
    : [];
  const matchedAdvisors = trimmedSearch
    ? displayedAdvisors.filter(
        (a) =>
          a.name.toLowerCase().includes(trimmedSearch) ||
          a.localChurch.toLowerCase().includes(trimmedSearch) ||
          a.ministry.toLowerCase().includes(trimmedSearch)
      )
    : [];
  const totalSearchMatches =
    matchedEvents.length +
    matchedTasks.length +
    matchedMembers.length +
    matchedAdvisors.length;

  const getPriorityBadgeStyle = (priority: TaskPriority) => {
    if (priority === 'High') return 'bg-[#FEF3C7] text-[#B45309]';
    if (priority === 'Medium') return 'bg-[#E0F2FE] text-[#0369A1]';
    return 'bg-[#DCFCE7] text-[#15803D]';
  };

  useEffect(() => {
    if (!authLoading && activeNav === 'tasks' && !isSAOrAdmin) {
      setActiveNav('overview');
    }
  }, [authLoading, activeNav, isSAOrAdmin]);

  const navItems: { id: NavSection; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'committee', label: 'Committee', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    ...(isSAOrAdmin ? [{ id: 'tasks' as NavSection, label: 'Tasks', icon: CheckSquare }] : []),
    { id: 'advisory', label: 'Advisory Council', icon: Award },
    { id: 'profile', label: 'Profile', icon: UserCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#EEF0F6] flex flex-col justify-between p-0 sm:p-3 md:p-5 lg:p-6">
      {/* Main Application Frame */}
      <div className="w-full max-w-[1440px] mx-auto bg-white sm:rounded-[22px] shadow-md border border-[#E5E7EB] overflow-hidden flex flex-col lg:flex-row min-h-[820px]">
        {/* Mobile Sidebar Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}

        {/* ====================================================================
            LEFT SIDEBAR (#14245B Dark Royal Blue)
            ==================================================================== */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-[240px] xl:w-[248px] bg-[#14245B] text-white flex flex-col justify-between shrink-0 transition-transform duration-200 ease-out ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{
            background: 'linear-gradient(180deg, #14245B 0%, #0F1D4B 100%)',
          }}
        >
          <div className="px-5 pt-6 pb-4">
            {/* Close button on mobile */}
            <div className="flex justify-end lg:hidden mb-1">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kingdom Ambassador Crest Logo */}
            <div
              onClick={() => {
                setActiveNav('overview');
                setMobileSidebarOpen(false);
              }}
              className="cursor-pointer"
            >
              <KACrestLogo />
            </div>

            {/* Navigation Menu */}
            <nav className="mt-4 space-y-1.5" aria-label="Main Committee Navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#6D28D9] text-white shadow-sm'
                        : 'text-slate-200/90 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Subtle Horizontal Divider */}
            <div className="mt-5 border-t border-white/12" />
          </div>

          {/* Bottom Motto Quote */}
          <div className="px-5 pb-7 pt-4 text-center select-none">
            <p className="font-serif-editorial italic text-[13.5px] leading-[1.45] text-slate-200/90">
              Students today.
              <br />
              Kingdom leaders tomorrow.
            </p>
            <div className="w-9 h-[2.5px] bg-[#D4AF37] mx-auto mt-3 rounded-full" />
          </div>
        </aside>

        {/* ====================================================================
            MAIN WORKSPACE COLUMN
            ==================================================================== */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFC]">
          {/* TOP HEADER BAR */}
          <header className="bg-white border-b border-[#E5E7EB]/80 px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md" ref={searchContainerRef}>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-[#E5E7EB] text-[#14245B] hover:bg-slate-50"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search Input */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-[#6B7280] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  placeholder="Search events, members, advisors..."
                  className="w-full pl-10 pr-8 py-2.5 text-sm bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl text-[#111827] placeholder-[#6B7280] focus:outline-none focus:bg-white focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/15 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Instant Search Results Dropdown */}
                {searchFocused && trimmedSearch.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl z-40 p-3 max-h-80 overflow-y-auto space-y-3">
                    {totalSearchMatches === 0 ? (
                      <p className="text-xs text-[#6B7280] py-3 text-center">
                        No matching events, members, or advisors for &ldquo;{searchQuery}&rdquo;
                      </p>
                    ) : (
                      <>
                        {matchedAdvisors.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] px-2 mb-1">
                              Advisory Council ({matchedAdvisors.length})
                            </p>
                            {matchedAdvisors.map((adv) => (
                              <button
                                key={adv.id}
                                type="button"
                                onClick={() => {
                                  setActiveNav('advisory');
                                  setSearchFocused(false);
                                }}
                                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F3E8FF]/50 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#111827]">{adv.name}</span>
                                <span className="text-[#6D28D9] font-medium">{adv.localChurch}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {matchedEvents.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] px-2 mb-1">
                              Events ({matchedEvents.length})
                            </p>
                            {matchedEvents.map((ev) => (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMeeting(ev);
                                  setSearchFocused(false);
                                }}
                                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F3E8FF]/50 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#111827]">{ev.title}</span>
                                <span className="text-[#6D28D9] font-medium">{ev.fullDate}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {matchedTasks.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] px-2 mb-1">
                              Tasks ({matchedTasks.length})
                            </p>
                            {matchedTasks.map((tk) => (
                              <button
                                key={tk.id}
                                type="button"
                                onClick={() => {
                                  setActiveNav('tasks');
                                  setSearchFocused(false);
                                }}
                                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F3E8FF]/50 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#111827]">{tk.title}</span>
                                <span className="text-[#6B7280]">{tk.dueDate}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {matchedMembers.length > 0 && (
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] px-2 mb-1">
                              Committee Members ({matchedMembers.length})
                            </p>
                            {matchedMembers.map((mem) => (
                              <button
                                key={mem.id}
                                type="button"
                                onClick={() => {
                                  setActiveNav('committee');
                                  setSearchFocused(false);
                                }}
                                className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#F3E8FF]/50 flex items-center justify-between text-xs"
                              >
                                <span className="font-semibold text-[#111827]">{mem.name}</span>
                                <span className="text-[#6B7280]">{mem.ministryTeam}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Actions: Notification Bell + User Profile Button */}
            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
              {/* Notification Bell */}
              <div className="relative" ref={notifContainerRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setHasUnreadNotifications(false);
                  }}
                  className="relative p-2 rounded-xl text-[#14245B] hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 stroke-[2]" />
                  {hasUnreadNotifications && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#6D28D9] ring-2 ring-white" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl z-40 overflow-hidden">
                    <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E5E7EB] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#111827]">
                        Committee Notifications
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setAnnouncementsOpen(true);
                        }}
                        className="text-xs font-semibold text-[#6D28D9] hover:underline"
                      >
                        View All (5)
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setAnnouncementsOpen(true);
                        }}
                        className="w-full text-left p-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-xs font-bold text-[#111827]">
                          1 New Announcement This Week
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          Worship Night Final Run Sheet &amp; Slide Deck uploaded to Resources.
                        </p>
                      </button>
                      {isSAOrAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            setActiveNav('tasks');
                          }}
                          className="w-full text-left p-3.5 hover:bg-slate-50 transition-colors"
                        >
                          <p className="text-xs font-bold text-[#DC2626]">
                            {overdueCount} Tasks Require Attention
                          </p>
                          <p className="text-xs text-[#6B7280] mt-0.5">
                            Confirm venue booking &amp; Follow up with guest speaker.
                          </p>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setSelectedMeeting(featuredMeeting);
                        }}
                        className="w-full text-left p-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-xs font-bold text-[#111827]">
                          Upcoming: Committee Planning Meeting
                        </p>
                        <p className="text-xs text-[#6B7280] mt-0.5">
                          Sat, Jan 18 &middot; 3:00 PM – 4:30 PM &middot; Room 201
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Button -> Clicking navigates to the Profile Page */}
              <button
                type="button"
                onClick={() => setActiveNav('profile')}
                className={`flex items-center gap-3 text-left rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer ${
                  activeNav === 'profile'
                    ? 'bg-[#F3E8FF] ring-1 ring-[#6D28D9]/30'
                    : 'hover:bg-slate-50'
                }`}
                title="Open Profile & Login Page"
              >
                <div className="w-10 h-10 rounded-full bg-[#6D28D9] text-white font-bold text-sm flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
                  {firebaseUser && userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userProfile.initials || 'KA'}</span>
                  )}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-[#111827] max-w-[140px] truncate">
                      {userProfile.displayName}
                    </p>
                    {firebaseUser && (
                      <span title="Signed in with Google" className="inline-flex">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] max-w-[150px] truncate">
                    {firebaseUser
                      ? verifiedRole || userProfile.roleTitle
                      : userProfile.roleTitle}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#6B7280] hidden sm:block" />
              </button>
            </div>
          </header>

          {/* MAIN SCROLLABLE CONTENT */}
          <main className="flex-1 p-5 sm:p-7 space-y-6">
            {activeNav === 'overview' && (
              <>
                {/* 1. HERO WELCOME BANNER */}
                <WorshipHeroBanner />

                {/* 2. KPI SUMMARY CARDS ROW */}
                <div
                  className={`grid grid-cols-1 gap-4 ${
                    isSAOrAdmin
                      ? 'sm:grid-cols-2 xl:grid-cols-4'
                      : 'sm:grid-cols-3'
                  }`}
                >
                  {/* Card 1: Members */}
                  <button
                    type="button"
                    onClick={() => setActiveNav('committee')}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-left hover:border-[#6D28D9]/40 hover:shadow-xs transition-all flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-bold text-[#111827]">
                          Members
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                      <p className="text-3xl font-extrabold text-[#111827] tabular-nums mt-1 leading-none">
                        {totalMemberCount}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
                        <span className="text-[#16A34A] font-bold tabular-nums">
                          {onlineMemberCount} online
                        </span>
                      </p>
                    </div>
                  </button>

                  {/* Card 2: Upcoming Events */}
                  <button
                    type="button"
                    onClick={() => setActiveNav('events')}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-left hover:border-[#6D28D9]/40 hover:shadow-xs transition-all flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-bold text-[#111827] truncate">
                          Upcoming Events
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                      <p className="text-3xl font-extrabold text-[#111827] tabular-nums mt-1 leading-none">
                        {events.length}
                      </p>
                      <div className="text-xs text-[#6B7280] mt-2 leading-[1.35]">
                        <p className="truncate font-medium text-[#4B5563]">
                          Next: {featuredMeeting.title}
                        </p>
                        <p>{featuredMeeting.fullDate}</p>
                      </div>
                    </div>
                  </button>

                  {/* Card 3: Tasks (Visible only to SA & Admin) */}
                  {isSAOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveNav('tasks')}
                      className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-left hover:border-[#6D28D9]/40 hover:shadow-xs transition-all flex items-start gap-4 group cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13.5px] font-bold text-[#111827]">
                            Tasks
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                        <p className="text-3xl font-extrabold text-[#111827] tabular-nums mt-1 leading-none">
                          {tasks.length}
                        </p>
                        <p className="text-xs mt-2.5 flex items-center gap-1.5">
                          {overdueCount > 0 ? (
                            <>
                              <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                !
                              </span>
                              <span className="text-[#DC2626] font-semibold tabular-nums">
                                {overdueCount} overdue
                              </span>
                            </>
                          ) : (
                            <span className="text-[#16A34A] font-semibold">
                              All tasks on track
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Card 4: Announcements */}
                  <button
                    type="button"
                    onClick={() => setAnnouncementsOpen(true)}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-5 text-left hover:border-[#6D28D9]/40 hover:shadow-xs transition-all flex items-start gap-4 group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13.5px] font-bold text-[#111827] truncate">
                          Announcements
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                      <p className="text-3xl font-extrabold text-[#111827] tabular-nums mt-1 leading-none">
                        {announcements.length}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#6D28D9] shrink-0" />
                        <span className="tabular-nums">
                          {newAnnouncementsCount} new this week
                        </span>
                      </p>
                    </div>
                  </button>
                </div>

                {/* 3. BOTTOM SECTION: THIS WEEK TASKS (SA & ADMIN ONLY) + EVENTS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column (7 cols): This Week Tasks — Visible only to SA & Admin */}
                  {isSAOrAdmin && (
                    <section className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6 flex flex-col justify-between">
                      <div>
                        {/* Section Header */}
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center shrink-0">
                              <CheckSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-[17px] font-bold text-[#111827] leading-snug">
                                This Week
                              </h3>
                              <p className="text-xs sm:text-[13px] text-[#6B7280]">
                                Key tasks to keep our mission moving forward.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 mt-1">
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(null);
                                  setCreateTaskOpen(true);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#C09B27] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Add Task</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setActiveNav('tasks')}
                              className="text-xs sm:text-[13.5px] font-bold text-[#6D28D9] hover:text-[#5B21B6] transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {isAdmin ? 'Manage All' : 'Review All'}
                            </button>
                          </div>
                        </div>

                        {/* Task Rows */}
                        <div className="divide-y divide-slate-100">
                          {thisWeekTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => {
                                if (isAdmin) handleToggleTask(task.id);
                              }}
                              className={`py-3.5 flex items-center justify-between gap-3 -mx-2 px-2 rounded-xl transition-colors ${
                                isAdmin ? 'cursor-pointer group hover:bg-slate-50/70' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleTask(task.id);
                                    }}
                                    className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
                                      task.completed
                                        ? 'bg-[#6D28D9] text-white border border-[#6D28D9]'
                                        : 'border-2 border-[#CBD5E1] bg-white group-hover:border-[#6D28D9]'
                                    }`}
                                    aria-label={`Toggle ${task.title}`}
                                  >
                                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>
                                ) : (
                                  <span
                                    className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 ${
                                      task.completed
                                        ? 'bg-[#6D28D9] text-white border border-[#6D28D9]'
                                        : 'border-2 border-[#CBD5E1] bg-white'
                                    }`}
                                  >
                                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </span>
                                )}
                                <span
                                  className={`text-sm font-medium truncate transition-colors ${
                                    task.completed
                                      ? 'text-[#6B7280] line-through'
                                      : 'text-[#1F2937] group-hover:text-[#111827]'
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs sm:text-[13px] text-[#6B7280] tabular-nums">
                                  {task.dueDate}
                                </span>
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold min-w-[66px] text-center ${getPriorityBadgeStyle(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingTask(task);
                                      setCreateTaskOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#6D28D9] hover:bg-[#F3E8FF] transition-colors cursor-pointer"
                                    title="Edit task"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* EVENTS Section (5 cols when alongside Tasks, 12 cols in Public View) */}
                  <section
                    className={`${
                      isSAOrAdmin ? 'lg:col-span-5' : 'lg:col-span-12'
                    } bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 flex flex-col justify-between`}
                  >
                    {(() => {
                      const safeIdx = events.length > 0 ? overviewEventIdx % events.length : 0;
                      const currentOverviewEvent = events[safeIdx] || featuredMeeting;
                      const posterSrc =
                        currentOverviewEvent.imageUrl ||
                        '/assets/aistudio/da4d912a-c6c0-4c13-bed2-500c99697c41_7271609d.jpeg';

                      return (
                        <div className="flex flex-col items-center w-full">
                          {/* Top Header: EVENTS + Admin Add Event */}
                          <div className="w-full flex items-center justify-between gap-3 mb-5">
                            <h3 className="text-2xl font-normal tracking-wide uppercase text-[#111827]">
                              EVENTS
                            </h3>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingEvent(null);
                                  setCreateEventOpen(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#C09B27] text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Add Event</span>
                              </button>
                            )}
                          </div>

                          {/* 1:1 Square Poster Image */}
                          <div
                            onClick={() => setSelectedMeeting(currentOverviewEvent)}
                            className="w-full max-w-[320px] aspect-square bg-[#14245B] overflow-hidden shadow-xs cursor-pointer group"
                          >
                            <img
                              src={posterSrc}
                              alt={currentOverviewEvent.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover aspect-square group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          </div>

                          {/* Centered Event Details */}
                          <div className="text-center mt-5 w-full max-w-[320px]">
                            <h4 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-[#111827] leading-snug">
                              {currentOverviewEvent.title}
                            </h4>

                            <p className="mt-2.5 text-sm text-[#111827]">
                              {currentOverviewEvent.fullDate}
                            </p>
                            <p className="mt-1 text-sm text-[#111827]">
                              {currentOverviewEvent.location}
                            </p>

                            {/* Rectangular Bordered "More" Button */}
                            <div className="mt-5 flex flex-col items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedMeeting(currentOverviewEvent)}
                                className="w-full max-w-[240px] py-2.5 px-6 border-2 border-[#111827] bg-white hover:bg-[#111827] text-[#111827] hover:text-white text-sm font-bold transition-colors cursor-pointer"
                              >
                                More
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEvent(currentOverviewEvent);
                                    setCreateEventOpen(true);
                                  }}
                                  className="text-xs font-semibold text-[#6D28D9] hover:underline mt-0.5 cursor-pointer"
                                >
                                  Edit Event
                                </button>
                              )}
                            </div>

                            {/* Pagination Dots */}
                            {events.length > 1 && (
                              <div className="mt-6 flex items-center justify-center gap-2.5">
                                {events.map((evt, idx) => (
                                  <button
                                    key={evt.id}
                                    type="button"
                                    onClick={() => setOverviewEventIdx(idx)}
                                    aria-label={`Show event ${idx + 1}`}
                                    className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                                      idx === safeIdx
                                        ? 'bg-[#1F2937] scale-105'
                                        : 'bg-[#CBD5E1] hover:bg-[#94A3B8]'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </section>
                </div>

                {/* 4. LOWER OVERVIEW REACH US & MINISTRY FOOTER SECTION */}
                <OverviewReachUsSection
                  onNavigate={(section) => setActiveNav(section)}
                />
              </>
            )}

            {activeNav === 'committee' && (
              <CommitteeDirectoryView
                members={members}
                isAdmin={isAdmin}
                currentUserUid={firebaseUser?.uid || null}
                invitations={invitations}
                onCreateInvitation={handleCreateInvitation}
                onDeleteInvitation={handleDeleteInvitation}
                onDeleteMember={handleDeleteMember}
                onGoToProfile={() => setActiveNav('profile')}
                onBackToOverview={() => setActiveNav('overview')}
              />
            )}

            {activeNav === 'events' && (
              <EventsDirectoryView
                events={events}
                isAdmin={isAdmin}
                onOpenCreateModal={() => {
                  setEditingEvent(null);
                  setCreateEventOpen(true);
                }}
                onEditEvent={(evt) => {
                  setEditingEvent(evt);
                  setCreateEventOpen(true);
                }}
                onSelectEvent={(evt) => setSelectedMeeting(evt)}
                onBackToOverview={() => setActiveNav('overview')}
              />
            )}

            {activeNav === 'tasks' && isSAOrAdmin && (
              <TasksDirectoryView
                tasks={tasks}
                isAdmin={isAdmin}
                onToggleTask={handleToggleTask}
                onEditTask={(task) => {
                  setEditingTask(task);
                  setCreateTaskOpen(true);
                }}
                onDeleteTask={handleDeleteTask}
                onOpenAddTaskModal={() => {
                  setEditingTask(null);
                  setCreateTaskOpen(true);
                }}
                onBackToOverview={() => setActiveNav('overview')}
              />
            )}

            {activeNav === 'advisory' && (
              <AdvisoryCouncilView
                advisors={displayedAdvisors}
                isAdmin={isAdmin}
                onSaveAdvisor={handleSaveAdvisor}
                onDeleteAdvisor={handleDeleteAdvisor}
                onBackToOverview={() => setActiveNav('overview')}
              />
            )}

            {activeNav === 'profile' && (
              <ProfilePageView
                firebaseUser={firebaseUser}
                authLoading={authLoading}
                profile={userProfile}
                privateInfo={privateInfo}
                verifiedRole={verifiedRole}
                invitations={invitations}
                onGoogleSignIn={handleGoogleSignInWithRole}
                onSignOut={handleSignOut}
                onSaveProfile={handleSaveProfile}
                onBackToOverview={() => setActiveNav('overview')}
              />
            )}
          </main>
        </div>
      </div>

      {/* ======================================================================
          BOTTOM BRAND PALETTE SWATCH BAR (Matches design sheet footer)
          ====================================================================== */}
      <footer className="w-full max-w-[1440px] mx-auto mt-4 bg-white sm:rounded-2xl border border-[#E5E7EB] px-5 py-3.5 shadow-2xs hidden sm:flex flex-wrap items-center justify-between gap-4">
        {COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch.hex}
            type="button"
            onClick={() => handleCopyHex(swatch.hex)}
            className="flex items-center gap-3 text-left group px-2 py-1 rounded-xl hover:bg-slate-50 transition-colors"
            title={`Click to copy ${swatch.hex}`}
          >
            <span
              className={`w-9 h-9 rounded-lg border ${swatch.bg} ${swatch.border} shadow-2xs shrink-0`}
            />
            <div className="leading-tight">
              <p className="text-xs font-bold text-[#111827] tabular-nums flex items-center gap-1.5">
                <span>{swatch.hex}</span>
                {copiedHex === swatch.hex && (
                  <span className="text-[10px] font-semibold text-[#6D28D9]">
                    Copied!
                  </span>
                )}
              </p>
              <p className="text-[11px] text-[#6B7280]">{swatch.name}</p>
            </div>
          </button>
        ))}
      </footer>

      {/* ======================================================================
          INTERACTIVE MODALS
          ====================================================================== */}
      <CreateEventModal
        isOpen={createEventOpen}
        onClose={() => {
          setCreateEventOpen(false);
          setEditingEvent(null);
        }}
        initialEvent={editingEvent}
        onSaveEvent={handleSaveEvent}
      />

      <CreateTaskModal
        isOpen={createTaskOpen}
        onClose={() => {
          setCreateTaskOpen(false);
          setEditingTask(null);
        }}
        initialTask={editingTask}
        onSaveTask={handleSaveTask}
      />

      <AnnouncementsModal
        isOpen={announcementsOpen}
        onClose={() => setAnnouncementsOpen(false)}
        announcements={announcements}
        isAdmin={isAdmin}
        onSaveAnnouncement={handleSaveAnnouncement}
        onDeleteAnnouncement={handleDeleteAnnouncement}
      />

      <MeetingDetailsModal
        event={selectedMeeting}
        isAdmin={isAdmin}
        onClose={() => setSelectedMeeting(null)}
        onEditEvent={(evt) => {
          setEditingEvent(evt);
          setCreateEventOpen(true);
        }}
        onUpdateRsvp={handleUpdateRsvp}
      />
    </div>
  );
}
