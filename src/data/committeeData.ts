export type NavSection =
  | 'overview'
  | 'committee'
  | 'events'
  | 'tasks'
  | 'resources'
  | 'advisory'
  | 'profile';

export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface CommitteeTask {
  id: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  completed: boolean;
  isOverdue?: boolean;
  assignee: string;
  assigneeInitials: string;
  category: string;
  notes?: string;
  showInThisWeek: boolean;
}

export interface CommitteeEvent {
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
  attendees: {
    initials: string;
    name: string;
    role: string;
    bgClass: string;
    textClass: string;
  }[];
  isFeaturedMeeting?: boolean;
  rsvpStatus?: 'Going' | 'Maybe' | 'Not Going';
  agenda?: string[];
}

export interface CommitteeMember {
  id: string;
  uid: string;
  name: string;
  initials: string;
  role: string;
  ministryTeam: 'Executive Board' | 'Worship & Prayer' | 'Outreach & Evangelism' | 'Media & Creative' | 'Hospitality & Logistics';
  majorAndYear: string;
  email: string;
  phoneNumber: string;
  bio: string;
  photoURL: string;
  accessRole: 'Student/Alumni' | 'Admin';
  isOnline: boolean;
  joinedThisMonth?: boolean;
  avatarBg: string;
  avatarText: string;
  activeTasksCount: number;
}

export interface CommitteeAnnouncement {
  id: string;
  title: string;
  summary: string;
  author: string;
  authorRole: string;
  date: string;
  isNewThisWeek?: boolean;
  pinned?: boolean;
  category: string;
}

export interface MinistryResource {
  id: string;
  title: string;
  category: 'Worship & Media' | 'Leadership & Guides' | 'Outreach Kit' | 'Templates & Admin';
  updatedAt: string;
  fileType: 'PDF' | 'Slides' | 'Doc' | 'Folder';
  fileSize: string;
  author: string;
  description: string;
  highlights: string[];
}

export const INITIAL_TASKS: CommitteeTask[] = [
  {
    id: 'task-1',
    title: 'Prepare slides for Worship Night',
    dueDate: 'Jan 15',
    priority: 'High',
    completed: true,
    assignee: 'Alex Tan',
    assigneeInitials: 'KA',
    category: 'Worship & Media',
    notes: 'Lyric slides for 5 worship songs + welcome loop and Matthew 5:16 scripture bumper.',
    showInThisWeek: true,
  },
  {
    id: 'task-2',
    title: 'Confirm venue booking',
    dueDate: 'Jan 16',
    priority: 'High',
    completed: false,
    isOverdue: true,
    assignee: 'Joshua Tan',
    assigneeInitials: 'JT',
    category: 'Logistics',
    notes: 'Confirm Main Auditorium audio engineering access and Student Center Room 201 keycard pickup.',
    showInThisWeek: true,
  },
  {
    id: 'task-3',
    title: 'Follow up with guest speaker',
    dueDate: 'Jan 17',
    priority: 'Medium',
    completed: false,
    isOverdue: true,
    assignee: 'Michelle Koh',
    assigneeInitials: 'MK',
    category: 'Program',
    notes: 'Send parking pass and sermon mic preference checklist to Pastor David Lim.',
    showInThisWeek: true,
  },
  {
    id: 'task-4',
    title: 'Finalize social media posters',
    dueDate: 'Jan 17',
    priority: 'Medium',
    completed: false,
    assignee: 'Samuel Lim',
    assigneeInitials: 'SL',
    category: 'Media & Creative',
    notes: 'Export Instagram story and feed carousel formats in Kingdom Ambassador royal purple & gold palette.',
    showInThisWeek: true,
  },
  {
    id: 'task-5',
    title: 'Team prayer meeting (online)',
    dueDate: 'Jan 18',
    priority: 'Low',
    completed: false,
    assignee: 'Grace Chen',
    assigneeInitials: 'GC',
    category: 'Prayer',
    notes: '30-minute morning intercession on Zoom prior to evening Worship Night setup.',
    showInThisWeek: true,
  },
  {
    id: 'task-6',
    title: 'Order welcome gift packs for freshmen',
    dueDate: 'Jan 20',
    priority: 'Medium',
    completed: false,
    assignee: 'Rachel Ng',
    assigneeInitials: 'RN',
    category: 'Hospitality',
    notes: 'Prepare 60 welcome notebooks, scripture bookmarks, and fellowship cards.',
    showInThisWeek: false,
  },
  {
    id: 'task-7',
    title: 'Submit Semester 2 budget sheet to Student Union',
    dueDate: 'Jan 22',
    priority: 'Low',
    completed: false,
    assignee: 'Daniel Wong',
    assigneeInitials: 'DW',
    category: 'Finance',
    notes: 'Include sound equipment rental and refreshments receipts for Campus Outreach.',
    showInThisWeek: false,
  },
];

export const INITIAL_EVENTS: CommitteeEvent[] = [
  {
    id: 'evt-meeting-1',
    title: 'Kingdom Ambassador Conference',
    monthShort: 'OCT',
    dayNumber: '23',
    dayOfWeek: 'Fri',
    fullDate: 'Oct 23 – Oct 24, 2026',
    timeRange: '9:00 AM – 9:30 PM',
    location: 'Christ Church Likas (CCL)',
    description: '2 Corinthians 5:20 — Open for University Students, College & Pre-Uni Students, Working Youth, and Alumni across Sabah.',
    type: 'Worship',
    imageUrl: '/assets/aistudio/da4d912a-c6c0-4c13-bed2-500c99697c41_7271609d.jpeg',
    isFeaturedMeeting: true,
    rsvpStatus: 'Going',
    agenda: [
      '9:00 AM — Registration & Campus Fellowship Welcome',
      '10:00 AM — Opening Worship & Plenary Session 1 (2 Corinthians 5:20)',
      '2:00 PM — Campus Discipleship & Leadership Workshops',
      '7:30 PM — Kingdom Ambassador Night Rally & Commissioning',
    ],
    attendees: [
      { initials: 'JT', name: 'Joshua Tan', role: 'Committee President', bgClass: 'bg-[#EDE9FE]', textClass: 'text-[#6D28D9]' },
      { initials: 'MK', name: 'Michelle Koh', role: 'Vice President', bgClass: 'bg-[#CCFBF1]', textClass: 'text-[#0F766E]' },
      { initials: 'SL', name: 'Samuel Lim', role: 'Creative Director', bgClass: 'bg-[#E0E7FF]', textClass: 'text-[#4338CA]' },
      { initials: 'KA', name: 'Alex Tan', role: 'Committee Member', bgClass: 'bg-[#F3E8FF]', textClass: 'text-[#6D28D9]' },
      { initials: 'RN', name: 'Rachel Ng', role: 'Hospitality Lead', bgClass: 'bg-[#FEF3C7]', textClass: 'text-[#B45309]' },
      { initials: 'DW', name: 'Daniel Wong', role: 'Treasurer', bgClass: 'bg-[#E0F2FE]', textClass: 'text-[#0369A1]' },
      { initials: 'GC', name: 'Grace Chen', role: 'Prayer Coordinator', bgClass: 'bg-[#FCE7F3]', textClass: 'text-[#BE185D]' },
      { initials: 'CY', name: 'Caleb Yeo', role: 'Outreach Lead', bgClass: 'bg-[#DCFCE7]', textClass: 'text-[#15803D]' },
    ],
  },
  {
    id: 'evt-worship-1',
    title: 'XPAND Conference (Acts 6:7)',
    monthShort: 'OCT',
    dayNumber: '15',
    dayOfWeek: 'Fri',
    fullDate: 'Oct 15 – Oct 16, 2027',
    timeRange: '9:00 AM – 9:00 PM',
    location: 'To Be Confirmed',
    description: 'Every Campus. Every Student. Multiplying Disciples. A conference dedicated to expanding the Word and multiplying disciples across campuses.',
    type: 'Worship',
    imageUrl: '/assets/aistudio/4751a124-a8a7-4c8e-ae5b-6096b2c9ecd5_cddce778.jpeg',
    rsvpStatus: 'Going',
    agenda: [
      '9:00 AM — Doors Open & Campus Delegation Check-In',
      '10:00 AM — Praise & Worship by KA Worship Team',
      '11:15 AM — Keynote Word: "XPAND — Acts 6:7"',
      '7:30 PM — Evening Revival & Campus Commissioning',
    ],
    attendees: [
      { initials: 'KA', name: 'Alex Tan', role: 'Worship & Media', bgClass: 'bg-[#EDE9FE]', textClass: 'text-[#6D28D9]' },
      { initials: 'JT', name: 'Joshua Tan', role: 'Committee President', bgClass: 'bg-[#E0E7FF]', textClass: 'text-[#4338CA]' },
      { initials: 'GC', name: 'Grace Chen', role: 'Prayer Coordinator', bgClass: 'bg-[#CCFBF1]', textClass: 'text-[#0F766E]' },
      { initials: 'SL', name: 'Samuel Lim', role: 'Creative Director', bgClass: 'bg-[#FEF3C7]', textClass: 'text-[#B45309]' },
    ],
  },
  {
    id: 'evt-outreach-1',
    title: 'Committee Planning & Campus Fellowship',
    monthShort: 'JAN',
    dayNumber: '18',
    dayOfWeek: 'Sat',
    fullDate: 'Jan 18, 2025',
    timeRange: '3:00 PM – 4:30 PM',
    location: 'Student Center, Room 201',
    description: 'Planning for Semester 2 events, campus fellowship gatherings, and outreach initiatives.',
    type: 'Meeting',
    imageUrl: '/assets/aistudio/IMG_6080_fcdc691f.jpeg',
    rsvpStatus: 'Going',
    agenda: [
      '3:00 PM — Opening Worship & Scripture Reflection (Matthew 5:16)',
      '3:15 PM — Final Run-Through for Evening Worship Night',
      '3:45 PM — Semester 2 Campus Outreach Strategy & Small Group Placement',
      '4:15 PM — Budget Allocation & Prayer Commissioning',
    ],
    attendees: [
      { initials: 'CY', name: 'Caleb Yeo', role: 'Outreach Lead', bgClass: 'bg-[#DCFCE7]', textClass: 'text-[#15803D]' },
      { initials: 'RN', name: 'Rachel Ng', role: 'Hospitality Lead', bgClass: 'bg-[#FEF3C7]', textClass: 'text-[#B45309]' },
      { initials: 'MK', name: 'Michelle Koh', role: 'Vice President', bgClass: 'bg-[#CCFBF1]', textClass: 'text-[#0F766E]' },
    ],
  },
];

export const INITIAL_ANNOUNCEMENTS: CommitteeAnnouncement[] = [
  {
    id: 'ann-1',
    title: 'Worship Night Final Run Sheet & Slide Deck Ready',
    summary: 'All lyric slides, transition bumpers, and stage lighting cues for Jan 18 Worship Night have been uploaded to Resources. Worship & Media team please review before Saturday 3:00 PM.',
    author: 'Alex Tan',
    authorRole: 'Committee Member · Worship & Media',
    date: 'Jan 15, 2025',
    isNewThisWeek: true,
    pinned: true,
    category: 'Worship Night',
  },
  {
    id: 'ann-2',
    title: 'Welcome 6 New Committee Ambassadors for Semester 2!',
    summary: 'Praise God! We grew to 48 active committee members this month with 6 new freshman and sophomore leaders joining Outreach, Media, and Hospitality teams.',
    author: 'Joshua Tan',
    authorRole: 'Committee President',
    date: 'Jan 12, 2025',
    pinned: true,
    category: 'Committee Growth',
  },
  {
    id: 'ann-3',
    title: 'Student Center Room 201 Confirmed for Planning Meeting',
    summary: 'Our Saturday 3:00 PM – 4:30 PM planning session will take place in Student Center Room 201 prior to heading over to the Main Auditorium.',
    author: 'Michelle Koh',
    authorRole: 'Vice President',
    date: 'Jan 10, 2025',
    category: 'Logistics',
  },
  {
    id: 'ann-4',
    title: 'Campus Welcome Booth Shifts Open for Sign-Up',
    summary: 'Please indicate your 2-hour availability blocks for the Jan 24 Central Quad booth so we have at least 4 ambassadors per shift.',
    author: 'Caleb Yeo',
    authorRole: 'Outreach Lead',
    date: 'Jan 8, 2025',
    category: 'Outreach',
  },
  {
    id: 'ann-5',
    title: 'Morning Intercession & Prayer Chain Schedule',
    summary: 'Join our weekly online prayer gathering every Saturday morning as we lift up our professors, classmates, and campus fellowship groups.',
    author: 'Grace Chen',
    authorRole: 'Prayer Coordinator',
    date: 'Jan 5, 2025',
    category: 'Prayer',
  },
];

export const INITIAL_MEMBERS: CommitteeMember[] = [];

export const INITIAL_RESOURCES: MinistryResource[] = [
  {
    id: 'res-1',
    title: 'Worship Night Lyric & Bumper Slides (Jan 18)',
    category: 'Worship & Media',
    updatedAt: 'Updated Jan 15, 2025',
    fileType: 'Slides',
    fileSize: '18.4 MB',
    author: 'Alex Tan',
    description: 'Complete 16:9 projection deck including Matthew 5:16 theme slide, countdown timer, and 5 worship song lyric sets.',
    highlights: [
      'Royal Purple (#6D28D9) & Gold (#D4AF37) high-contrast stage typography',
      'Includes lower-thirds broadcast overlay for livestream',
      'Checked and verified for Auditorium projector resolution',
    ],
  },
  {
    id: 'res-2',
    title: 'Semester 2 Committee Leadership & Vision Handbook',
    category: 'Leadership & Guides',
    updatedAt: 'Updated Jan 10, 2025',
    fileType: 'PDF',
    fileSize: '4.2 MB',
    author: 'Joshua Tan',
    description: 'Core charter for Kingdom Ambassadors: "Same Campus. A Greater Calling." Covers team responsibilities, spiritual rhythms, and campus partnership guidelines.',
    highlights: [
      'Ministry values & Matthew 5:16 meditation guide',
      'Role descriptions for Executive, Worship, Outreach, and Media sub-committees',
      'Semester 2 key milestone dates & exam prayer week schedule',
    ],
  },
  {
    id: 'res-3',
    title: 'Social Media Poster & Brand Kit 2025',
    category: 'Worship & Media',
    updatedAt: 'Updated Jan 14, 2025',
    fileType: 'Folder',
    fileSize: '42.0 MB',
    author: 'Samuel Lim',
    description: 'Official KA crest SVG, typography guidelines, and editable templates for Instagram posts, stories, and printed campus posters.',
    highlights: [
      'Official Color Swatches: #6D28D9 Royal Purple, #14245B Dark Royal Blue, #D4AF37 Gold',
      'High-resolution KA Crown Monogram in vector and PNG formats',
      'Ready-to-print A3 poster layouts for Worship Night',
    ],
  },
  {
    id: 'res-4',
    title: 'Student Center & Auditorium Venue Booking SOP',
    category: 'Templates & Admin',
    updatedAt: 'Updated Jan 8, 2025',
    fileType: 'Doc',
    fileSize: '1.1 MB',
    author: 'Daniel Wong',
    description: 'Step-by-step checklist for reserving Student Center Room 201 and the Main Auditorium, including AV desk contacts and risk assessment forms.',
    highlights: [
      'Direct contact extensions for Campus Facilities & AV technicians',
      'Room 201 setup diagram for 48-member committee meetings',
      'Reimbursement form template for ministry expenses',
    ],
  },
  {
    id: 'res-5',
    title: 'Campus Evangelism & Small Group Conversation Guide',
    category: 'Outreach Kit',
    updatedAt: 'Updated Jan 12, 2025',
    fileType: 'PDF',
    fileSize: '2.8 MB',
    author: 'Caleb Yeo',
    description: 'Practical Icebreakers, testimony sharing frameworks, and 4-week discovery Bible study notes for welcoming new students on campus.',
    highlights: [
      'How to share your 3-minute personal story naturally on campus',
      'Gospel of Mark 4-part introductory study for freshman groups',
      'Follow-up workflow for booth visitors',
    ],
  },
];

export interface AdvisorMember {
  id: string;
  name: string;
  localChurch: string;
  ministry: string;
  officeLine: string;
  details: string;
  photoUrl: string;
  updatedByUid?: string;
}

export const INITIAL_ADVISORS: AdvisorMember[] = [
  {
    id: 'adv-1',
    name: 'Rev. Dr. David Lim',
    localChurch: 'Grace Covenant Community Church',
    ministry: 'Senior Pastor & Campus Leadership Mentor',
    officeLine: '+65 6789 4321',
    details:
      'Rev. Dr. David Lim has mentored university youth committees and emerging Christian leaders for over 18 years. He holds a Doctorate in Missiology and partners closely with Kingdom Ambassador executives to equip students in biblical exposition, spiritual formation, andservant-hearted campus outreach.',
    photoUrl: '',
  },
  {
    id: 'adv-2',
    name: 'Prof. Esther Tan-Wijaya',
    localChurch: 'Trinity Wesley Methodist Church',
    ministry: 'Faculty Christian Fellowship & Student Care Advisor',
    officeLine: '+65 6512 8890',
    details:
      'Prof. Esther Tan-Wijaya serves as a Faculty Advisor bridging academic excellence and Christian witness on campus. She leads monthly mentoring roundtables for student committee heads, offering pastoral wisdom on balancing rigorous university coursework with sustainable ministry leadership.',
    photoUrl: '',
  },
  {
    id: 'adv-3',
    name: 'Pastor Jonathan Chee',
    localChurch: 'City Light Evangelical Free Church',
    ministry: 'Young Adults & Inter-Varsity Worship Director',
    officeLine: '+65 6420 1158',
    details:
      'Pastor Jonathan Chee oversees inter-collegiate worship nights and evangelistic missions across universities and colleges. He coaches the Kingdom Ambassador Worship & Media and Outreach sub-committees in prayer ministry, creative gospel communication, and discipleship group multiplication.',
    photoUrl: '',
  },
];

