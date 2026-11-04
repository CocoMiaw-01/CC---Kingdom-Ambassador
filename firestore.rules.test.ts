/**
 * Security Rules Verification Suite for Kingdom Ambassador Dashboard
 * Verifies all "Dirty Dozen" adversarial payloads defined in security_spec.md
 * return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  auth: { uid: string; email_verified: boolean; email?: string } | null;
  path: string;
  operation: 'get' | 'create' | 'update' | 'delete';
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Create on /profiles/user_1',
    auth: null,
    path: '/profiles/user_1',
    operation: 'create',
    payload: { uid: 'user_1', displayName: 'Alex Tan' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Create on /profiles/user_1',
    auth: { uid: 'user_1', email_verified: false },
    path: '/profiles/user_1',
    operation: 'create',
    payload: { uid: 'user_1', displayName: 'Alex Tan' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User Identity Spoofing on /profiles/victim_1',
    auth: { uid: 'attacker_1', email_verified: true },
    path: '/profiles/victim_1',
    operation: 'create',
    payload: { uid: 'victim_1', displayName: 'Spoofed Name' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow/Ghost Field Injection (isAdmin: true) on Create',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1',
    operation: 'create',
    payload: {
      uid: 'user_1',
      displayName: 'Alex Tan',
      initials: 'KA',
      roleTitle: 'Committee Member',
      ministryTeam: 'Worship & Prayer',
      majorAndYear: 'CS Year 3',
      bio: 'Hello',
      photoURL: '',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on Update',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1',
    operation: 'update',
    payload: { role: 'superadmin' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized displayName (> 80 chars)',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1',
    operation: 'create',
    payload: {
      uid: 'user_1',
      displayName: 'A'.repeat(200),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Invalid ministryTeam Enum Value',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1',
    operation: 'create',
    payload: {
      uid: 'user_1',
      displayName: 'Alex Tan',
      initials: 'KA',
      roleTitle: 'Member',
      ministryTeam: 'Unauthorized Team',
      majorAndYear: 'Year 3',
      bio: '',
      photoURL: '',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Timestamp Spoofing on Create (client timestamp != request.time)',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1',
    operation: 'create',
    payload: {
      uid: 'user_1',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immortal Field (createdAt) Mutation on Update',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1',
    operation: 'update',
    payload: {
      createdAt: '2099-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'PII Cross-User Read on /profiles/user_1/private/contact',
    auth: { uid: 'user_2', email_verified: true },
    path: '/profiles/user_1/private/contact',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Orphaned Subcollection Write without Parent Profile',
    auth: { uid: 'user_orphan', email_verified: true },
    path: '/profiles/user_orphan/private/contact',
    operation: 'create',
    payload: {
      uid: 'user_orphan',
      email: 'orphan@campus.edu',
      notificationsEnabled: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'ID Poisoning on Private Subcollection Document ID',
    auth: { uid: 'user_1', email_verified: true },
    path: '/profiles/user_1/private/invalid_doc_id',
    operation: 'create',
    payload: {
      uid: 'user_1',
      email: 'alex@campus.edu',
      notificationsEnabled: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
