// ============================================
// SALON APP — SEED DATA
// 1 Salon, 3 Staff, 10 Services, 10 Customers
// ============================================

const SeedData = {
  settings: {
    salonName: 'Royal Cuts — Men\'s Salon',
    phone: '9876543210',
    address: 'Shop 4, Patel Nagar, Andheri West, Mumbai 400058',
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    workingHours: { start: '09:00', end: '21:00' },
    slotDuration: 30,
    ownerPin: '1234',
    wallet: {
      enabled: true,
      topUpSlabs: [
        { pay: 500, bonus: 50 },
        { pay: 1000, bonus: 120 },
        { pay: 2000, bonus: 300 }
      ],
      bonusPercent: 10,
      expiryDays: 180,
      minTopUp: 200
    },
    referral: {
      enabled: true,
      referrerReward: 100,
      refereeDiscount: 100,
      expiryDays: 30
    },
    reminder: {
      enabled: true,
      defaultCycleDays: 25,
      sendBeforeDays: 2
    }
  },

  staff: [
    {
      id: 'staff_ravi',
      name: 'Ravi Kumar',
      phone: '9876500001',
      role: 'Barber',
      specialization: 'Senior Barber — Haircuts & Styling',
      workingHours: {
        Mon: { start: '09:00', end: '20:00' },
        Tue: { start: '09:00', end: '20:00' },
        Wed: { start: '09:00', end: '20:00' },
        Thu: { start: '09:00', end: '20:00' },
        Fri: { start: '09:00', end: '20:00' },
        Sat: { start: '09:00', end: '20:00' }
      },
      isActive: true
    },
    {
      id: 'staff_amit',
      name: 'Amit Sharma',
      phone: '9876500002',
      role: 'Barber',
      specialization: 'Beard & Grooming Expert',
      workingHours: {
        Mon: { start: '10:00', end: '21:00' },
        Tue: { start: '10:00', end: '21:00' },
        Wed: { start: '10:00', end: '21:00' },
        Thu: { start: '10:00', end: '21:00' },
        Fri: { start: '10:00', end: '21:00' },
        Sat: { start: '10:00', end: '21:00' }
      },
      isActive: true
    },
    {
      id: 'staff_priya',
      name: 'Priya Desai',
      phone: '9876500003',
      role: 'Manager',
      specialization: 'Salon Manager',
      workingHours: {
        Mon: { start: '09:00', end: '18:00' },
        Tue: { start: '09:00', end: '18:00' },
        Wed: { start: '09:00', end: '18:00' },
        Thu: { start: '09:00', end: '18:00' },
        Fri: { start: '09:00', end: '18:00' },
        Sat: { start: '09:00', end: '18:00' }
      },
      isActive: true
    }
  ],

  services: [
    {
      id: 'svc_haircut',
      name: 'Men\'s Haircut',
      category: 'Hair',
      price: 300,
      duration: 30,
      isAddOn: false,
      reminderDays: 25,
      isActive: true,
      description: 'Classic haircut with wash and style'
    },
    {
      id: 'svc_kids',
      name: 'Kids Haircut',
      category: 'Hair',
      price: 200,
      duration: 20,
      isAddOn: false,
      reminderDays: 30,
      isActive: true,
      description: 'Haircut for kids under 12'
    },
    {
      id: 'svc_premium',
      name: 'Premium Haircut + Styling',
      category: 'Hair',
      price: 500,
      duration: 45,
      isAddOn: false,
      reminderDays: 25,
      isActive: true,
      description: 'Premium cut with hot towel and styling'
    },
    {
      id: 'svc_beard',
      name: 'Beard Trim',
      category: 'Beard',
      price: 99,
      duration: 15,
      isAddOn: true,
      reminderDays: 15,
      isActive: true,
      description: 'Shape up and trim your beard'
    },
    {
      id: 'svc_shave',
      name: 'Clean Shave',
      category: 'Beard',
      price: 149,
      duration: 20,
      isAddOn: false,
      reminderDays: 7,
      isActive: true,
      description: 'Traditional clean shave with hot towel'
    },
    {
      id: 'svc_massage',
      name: 'Head Massage',
      category: 'Spa',
      price: 199,
      duration: 20,
      isAddOn: true,
      reminderDays: 0,
      isActive: true,
      description: 'Relaxing head and neck massage'
    },
    {
      id: 'svc_colour',
      name: 'Hair Colour',
      category: 'Hair',
      price: 599,
      duration: 60,
      isAddOn: false,
      reminderDays: 45,
      isActive: true,
      description: 'Full hair colour with premium products'
    },
    {
      id: 'svc_facial',
      name: 'Facial (Men\'s)',
      category: 'Skin',
      price: 499,
      duration: 40,
      isAddOn: false,
      reminderDays: 30,
      isActive: true,
      description: 'Deep cleansing men\'s facial'
    },
    {
      id: 'svc_detan',
      name: 'Detan Pack',
      category: 'Skin',
      price: 349,
      duration: 30,
      isAddOn: false,
      reminderDays: 30,
      isActive: true,
      description: 'Tan removal face and neck pack'
    },
    {
      id: 'svc_combo',
      name: 'Royal Combo',
      category: 'Combo',
      price: 499,
      duration: 60,
      isAddOn: false,
      reminderDays: 25,
      isActive: true,
      description: 'Haircut + Beard Trim + Head Massage'
    }
  ],

  customers: [
    {
      id: 'cust_001',
      name: 'Rahul Verma',
      phone: '9876543001',
      email: 'rahul.v@email.com',
      gender: 'Male',
      createdAt: '2026-03-15T10:00:00Z',
      lastVisitAt: '2026-08-20T14:30:00Z',
      totalVisits: 12,
      totalSpent: 5400,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'RAH7K2M',
      referredBy: null,
      walletBalance: { paid: 350, bonus: 50, total: 400 }
    },
    {
      id: 'cust_002',
      name: 'Suresh Patel',
      phone: '9876543002',
      email: '',
      gender: 'Male',
      createdAt: '2026-01-10T09:00:00Z',
      lastVisitAt: '2026-08-25T11:00:00Z',
      totalVisits: 24,
      totalSpent: 12800,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'SUR9P4X',
      referredBy: null,
      walletBalance: { paid: 800, bonus: 120, total: 920 }
    },
    {
      id: 'cust_003',
      name: 'Amitabh Singh',
      phone: '9876543003',
      email: 'amit.singh@email.com',
      gender: 'Male',
      createdAt: '2026-05-20T10:00:00Z',
      lastVisitAt: '2026-08-18T16:00:00Z',
      totalVisits: 6,
      totalSpent: 2400,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'AMI3R8N',
      referredBy: 'RAH7K2M',
      walletBalance: { paid: 0, bonus: 100, total: 100 }
    },
    {
      id: 'cust_004',
      name: 'Deepak Joshi',
      phone: '9876543004',
      email: '',
      gender: 'Male',
      createdAt: '2026-06-01T10:00:00Z',
      lastVisitAt: '2026-08-10T13:00:00Z',
      totalVisits: 4,
      totalSpent: 1600,
      communicationConsent: false,
      reminderOptOut: true,
      referralCode: 'DEE5J1Q',
      referredBy: null,
      walletBalance: { paid: 0, bonus: 0, total: 0 }
    },
    {
      id: 'cust_005',
      name: 'Vikram Malhotra',
      phone: '9876543005',
      email: 'vikram.m@email.com',
      gender: 'Male',
      createdAt: '2026-04-08T10:00:00Z',
      lastVisitAt: '2026-08-28T10:30:00Z',
      totalVisits: 8,
      totalSpent: 4200,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'VIK2M5W',
      referredBy: null,
      walletBalance: { paid: 500, bonus: 50, total: 550 }
    },
    {
      id: 'cust_006',
      name: 'Manoj Kumar',
      phone: '9876543006',
      email: '',
      gender: 'Male',
      createdAt: '2026-07-15T10:00:00Z',
      lastVisitAt: '2026-08-22T15:00:00Z',
      totalVisits: 3,
      totalSpent: 1050,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'MAN6K9L',
      referredBy: 'SUR9P4X',
      walletBalance: { paid: 200, bonus: 20, total: 220 }
    },
    {
      id: 'cust_007',
      name: 'Arjun Nair',
      phone: '9876543007',
      email: 'arjun.n@email.com',
      gender: 'Male',
      createdAt: '2026-08-01T10:00:00Z',
      lastVisitAt: '2026-08-15T12:00:00Z',
      totalVisits: 2,
      totalSpent: 800,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'ARJ8N3F',
      referredBy: null,
      walletBalance: { paid: 0, bonus: 0, total: 0 }
    },
    {
      id: 'cust_008',
      name: 'Karan Mehta',
      phone: '9876543008',
      email: '',
      gender: 'Male',
      createdAt: '2026-08-20T10:00:00Z',
      lastVisitAt: null,
      totalVisits: 0,
      totalSpent: 0,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'KAR1M7H',
      referredBy: 'VIK2M5W',
      walletBalance: { paid: 0, bonus: 0, total: 0 }
    },
    {
      id: 'cust_009',
      name: 'Rajesh Tiwari',
      phone: '9876543009',
      email: 'rajesh.t@email.com',
      gender: 'Male',
      createdAt: '2026-02-28T10:00:00Z',
      lastVisitAt: '2026-06-15T14:00:00Z',
      totalVisits: 15,
      totalSpent: 7500,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'RAJ4T2B',
      referredBy: null,
      walletBalance: { paid: 1000, bonus: 120, total: 1120 }
    },
    {
      id: 'cust_010',
      name: 'Nikhil Gupta',
      phone: '9876543010',
      email: '',
      gender: 'Male',
      createdAt: '2026-08-25T10:00:00Z',
      lastVisitAt: null,
      totalVisits: 0,
      totalSpent: 0,
      communicationConsent: true,
      reminderOptOut: false,
      referralCode: 'NIK5G8C',
      referredBy: 'RAH7K2M',
      walletBalance: { paid: 0, bonus: 0, total: 0 }
    }
  ],

  // Pre-seeded bookings (some today, some past)
  bookings: [
    {
      id: 'bk_001',
      customerId: 'cust_001',
      staffId: 'staff_ravi',
      services: [
        { serviceId: 'svc_haircut', price: 300, isAddOn: false },
        { serviceId: 'svc_beard', price: 99, isAddOn: true }
      ],
      date: '2026-08-29',
      slot: { start: '10:00', end: '10:30' },
      status: 'Confirmed',
      totalAmount: 399,
      walletDebit: 0,
      cashPaid: 399,
      source: 'App',
      createdAt: '2026-08-28T18:00:00Z',
      updatedAt: '2026-08-28T18:00:00Z',
      completedAt: null,
      cancellationReason: null
    },
    {
      id: 'bk_002',
      customerId: 'cust_005',
      staffId: 'staff_amit',
      services: [
        { serviceId: 'svc_premium', price: 500, isAddOn: false },
        { serviceId: 'svc_massage', price: 199, isAddOn: true }
      ],
      date: '2026-08-29',
      slot: { start: '11:00', end: '11:30' },
      status: 'Confirmed',
      totalAmount: 699,
      walletDebit: 550,
      cashPaid: 149,
      source: 'App',
      createdAt: '2026-08-27T20:00:00Z',
      updatedAt: '2026-08-27T20:00:00Z',
      completedAt: null,
      cancellationReason: null
    },
    {
      id: 'bk_003',
      customerId: 'cust_002',
      staffId: 'staff_ravi',
      services: [
        { serviceId: 'svc_combo', price: 499, isAddOn: false }
      ],
      date: '2026-08-29',
      slot: { start: '14:00', end: '14:30' },
      status: 'Pending',
      totalAmount: 499,
      walletDebit: 0,
      cashPaid: 499,
      source: 'Walk-in',
      createdAt: '2026-08-29T09:00:00Z',
      updatedAt: '2026-08-29T09:00:00Z',
      completedAt: null,
      cancellationReason: null
    }
  ],

  // Pre-seeded visits (past completed)
  visits: [
    {
      id: 'vis_001',
      customerId: 'cust_001',
      bookingId: 'bk_past_001',
      services: [{ serviceId: 'svc_haircut', name: 'Men\'s Haircut', price: 300 }],
      totalPaid: 300,
      paymentMethod: 'Cash',
      staffId: 'staff_ravi',
      date: '2026-08-20',
      completedAt: '2026-08-20T14:30:00Z',
      nextDueDate: '2026-09-14',
      feedbackRating: 5
    },
    {
      id: 'vis_002',
      customerId: 'cust_002',
      bookingId: 'bk_past_002',
      services: [
        { serviceId: 'svc_combo', name: 'Royal Combo', price: 499 }
      ],
      totalPaid: 499,
      paymentMethod: 'Wallet',
      staffId: 'staff_amit',
      date: '2026-08-25',
      completedAt: '2026-08-25T11:00:00Z',
      nextDueDate: '2026-09-19',
      feedbackRating: 4
    },
    {
      id: 'vis_003',
      customerId: 'cust_005',
      bookingId: 'bk_past_003',
      services: [
        { serviceId: 'svc_premium', name: 'Premium Haircut + Styling', price: 500 },
        { serviceId: 'svc_beard', name: 'Beard Trim', price: 99 }
      ],
      totalPaid: 599,
      paymentMethod: 'Cash',
      staffId: 'staff_ravi',
      date: '2026-08-28',
      completedAt: '2026-08-28T10:30:00Z',
      nextDueDate: '2026-09-22',
      feedbackRating: 5
    }
  ],

  walletTransactions: [
    {
      id: 'wtx_001',
      customerId: 'cust_001',
      type: 'TopUp-Paid',
      amount: 500,
      creditType: 'Paid',
      balance: { paid: 500, bonus: 0, total: 500 },
      reference: { type: 'Manual', id: null },
      reason: 'Initial top-up',
      createdAt: '2026-07-01T10:00:00Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_002',
      customerId: 'cust_001',
      type: 'TopUp-Bonus',
      amount: 50,
      creditType: 'Bonus',
      balance: { paid: 500, bonus: 50, total: 550 },
      reference: { type: 'Manual', id: null },
      reason: 'Bonus on ₹500 top-up',
      createdAt: '2026-07-01T10:00:01Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_003',
      customerId: 'cust_001',
      type: 'Debit',
      amount: -150,
      creditType: 'Paid',
      balance: { paid: 350, bonus: 50, total: 400 },
      reference: { type: 'Booking', id: 'bk_past_001' },
      reason: null,
      createdAt: '2026-08-15T10:00:00Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_004',
      customerId: 'cust_002',
      type: 'TopUp-Paid',
      amount: 1000,
      creditType: 'Paid',
      balance: { paid: 1000, bonus: 0, total: 1000 },
      reference: { type: 'Manual', id: null },
      reason: 'Top-up',
      createdAt: '2026-06-15T10:00:00Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_005',
      customerId: 'cust_002',
      type: 'TopUp-Bonus',
      amount: 120,
      creditType: 'Bonus',
      balance: { paid: 1000, bonus: 120, total: 1120 },
      reference: { type: 'Manual', id: null },
      reason: 'Bonus on ₹1000 top-up',
      createdAt: '2026-06-15T10:00:01Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_006',
      customerId: 'cust_002',
      type: 'Debit',
      amount: -200,
      creditType: 'Paid',
      balance: { paid: 800, bonus: 120, total: 920 },
      reference: { type: 'Booking', id: 'bk_past_002' },
      reason: null,
      createdAt: '2026-08-25T11:00:00Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_007',
      customerId: 'cust_005',
      type: 'TopUp-Paid',
      amount: 500,
      creditType: 'Paid',
      balance: { paid: 500, bonus: 0, total: 500 },
      reference: { type: 'Manual', id: null },
      reason: 'Top-up',
      createdAt: '2026-08-01T10:00:00Z',
      reversedBy: null,
      reversalOf: null
    },
    {
      id: 'wtx_008',
      customerId: 'cust_005',
      type: 'TopUp-Bonus',
      amount: 50,
      creditType: 'Bonus',
      balance: { paid: 500, bonus: 50, total: 550 },
      reference: { type: 'Manual', id: null },
      reason: 'Bonus on ₹500 top-up',
      createdAt: '2026-08-01T10:00:01Z',
      reversedBy: null,
      reversalOf: null
    }
  ],

  referrals: [
    {
      id: 'ref_001',
      referrerCustomerId: 'cust_001',
      refereePhone: '9876543003',
      refereeCustomerId: 'cust_003',
      referralCode: 'RAH7K2M',
      status: 'Completed',
      referrerReward: { amount: 100, creditedAt: '2026-05-25T10:00:00Z' },
      refereeDiscount: { amount: 100, usedAt: '2026-05-20T10:00:00Z' },
      createdAt: '2026-05-18T10:00:00Z',
      completedAt: '2026-05-25T10:00:00Z'
    },
    {
      id: 'ref_002',
      referrerCustomerId: 'cust_005',
      refereePhone: '9876543008',
      refereeCustomerId: 'cust_008',
      referralCode: 'VIK2M5W',
      status: 'Pending',
      referrerReward: { amount: 100, creditedAt: null },
      refereeDiscount: { amount: 100, usedAt: null },
      createdAt: '2026-08-22T10:00:00Z',
      completedAt: null
    },
    {
      id: 'ref_003',
      referrerCustomerId: 'cust_001',
      refereePhone: '9876543010',
      refereeCustomerId: 'cust_010',
      referralCode: 'RAH7K2M',
      status: 'Pending',
      referrerReward: { amount: 100, creditedAt: null },
      refereeDiscount: { amount: 100, usedAt: null },
      createdAt: '2026-08-25T10:00:00Z',
      completedAt: null
    }
  ],

  reminders: [
    {
      id: 'rem_001',
      customerId: 'cust_001',
      serviceId: 'svc_haircut',
      bookingId: null,
      dueDate: '2026-09-14',
      status: 'Scheduled',
      createdAt: '2026-08-20T14:30:00Z',
      sentAt: null,
      bookedAt: null
    },
    {
      id: 'rem_002',
      customerId: 'cust_002',
      serviceId: 'svc_combo',
      bookingId: null,
      dueDate: '2026-09-19',
      status: 'Scheduled',
      createdAt: '2026-08-25T11:00:00Z',
      sentAt: null,
      bookedAt: null
    },
    {
      id: 'rem_003',
      customerId: 'cust_005',
      serviceId: 'svc_premium',
      bookingId: null,
      dueDate: '2026-09-22',
      status: 'Scheduled',
      createdAt: '2026-08-28T10:30:00Z',
      sentAt: null,
      bookedAt: null
    }
  ]
};
