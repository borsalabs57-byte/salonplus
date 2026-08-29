// ============================================
// SALON APP — SERVICE LAYER
// Booking, Wallet, Referral, Reminder + Automations
// ============================================

const BookingService = {
  // Check if a slot is available for a given staff+date
  isSlotAvailable(staffId, date, slotStart, excludeBookingId = null) {
    const bookings = Store.getWhere('bookings', b =>
      b.staffId === staffId &&
      b.date === date &&
      b.slot.start === slotStart &&
      b.status !== 'Cancelled' &&
      b.status !== 'No-show' &&
      b.id !== excludeBookingId
    );
    return bookings.length === 0;
  },

  // Get booked slots for a staff member on a date
  getBookedSlots(staffId, date) {
    return Store.getWhere('bookings', b =>
      b.staffId === staffId &&
      b.date === date &&
      b.status !== 'Cancelled' &&
      b.status !== 'No-show'
    ).map(b => b.slot.start);
  },

  // Get available slots for a staff member on a date
  getAvailableSlots(staffId, date) {
    const staff = Store.getById('staff', staffId);
    if (!staff || !staff.isActive) return [];

    const settings = Store.getSettings();
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const hours = staff.workingHours[dayName];
    if (!hours) return []; // Staff doesn't work this day

    const allSlots = Utils.generateSlots(hours.start, hours.end, settings.slotDuration);
    const bookedSlots = this.getBookedSlots(staffId, date);

    // Filter out past slots if date is today
    const now = new Date();
    const isToday = date === Utils.today();

    return allSlots.map(slot => ({
      ...slot,
      available: !bookedSlots.includes(slot.start) &&
        (!isToday || slot.start > `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }));
  },

  // Create a new booking
  create(data) {
    // Validate slot availability
    if (!this.isSlotAvailable(data.staffId, data.date, data.slot.start)) {
      return { success: false, error: 'This slot is already booked' };
    }

    const booking = {
      id: 'bk_' + Utils.generateId(),
      customerId: data.customerId,
      staffId: data.staffId,
      services: data.services,
      date: data.date,
      slot: data.slot,
      status: 'Pending',
      totalAmount: data.totalAmount,
      walletDebit: data.walletDebit || 0,
      cashPaid: data.totalAmount - (data.walletDebit || 0),
      source: data.source || 'App',
      createdAt: Utils.now(),
      updatedAt: Utils.now(),
      completedAt: null,
      cancellationReason: null
    };

    Store.add('bookings', booking);
    return { success: true, booking };
  },

  // Update booking status
  updateStatus(bookingId, newStatus, reason = null) {
    const booking = Store.getById('bookings', bookingId);
    if (!booking) return { success: false, error: 'Booking not found' };

    const validTransitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Completed', 'Cancelled', 'No-show'],
      'Completed': [],
      'Cancelled': [],
      'No-show': []
    };

    if (!validTransitions[booking.status]?.includes(newStatus)) {
      return { success: false, error: `Cannot change from ${booking.status} to ${newStatus}` };
    }

    const updates = {
      status: newStatus,
      updatedAt: Utils.now()
    };

    if (newStatus === 'Completed') {
      updates.completedAt = Utils.now();
    }
    if (newStatus === 'Cancelled') {
      updates.cancellationReason = reason || 'Cancelled by salon';
    }

    Store.update('bookings', bookingId, updates);

    // Trigger automations
    if (newStatus === 'Confirmed') {
      Automations.onBookingConfirmed(bookingId);
    } else if (newStatus === 'Completed') {
      Automations.onBookingCompleted(bookingId);
    } else if (newStatus === 'Cancelled' && booking.walletDebit > 0) {
      // Refund wallet
      WalletService.refund(booking.customerId, booking.walletDebit, bookingId);
    }

    return { success: true };
  },

  // Get today's bookings
  getTodayBookings() {
    return Store.getWhere('bookings', b => b.date === Utils.today())
      .sort((a, b) => a.slot.start.localeCompare(b.slot.start));
  },

  // Get bookings for a customer
  getCustomerBookings(customerId) {
    return Store.getWhere('bookings', b => b.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};


const WalletService = {
  // Get wallet balance for a customer
  getBalance(customerId) {
    const customer = Store.getById('customers', customerId);
    return customer?.walletBalance || { paid: 0, bonus: 0, total: 0 };
  },

  // Top up wallet
  topUp(customerId, paidAmount) {
    const settings = Store.getSettings();
    const slab = settings.wallet.topUpSlabs
      .filter(s => s.pay <= paidAmount)
      .sort((a, b) => b.pay - a.pay)[0];

    const bonus = slab ? slab.bonus : Math.floor(paidAmount * settings.wallet.bonusPercent / 100);
    const customer = Store.getById('customers', customerId);
    const currentBalance = customer.walletBalance || { paid: 0, bonus: 0, total: 0 };

    // Create paid credit transaction
    const newPaid = currentBalance.paid + paidAmount;
    const newBonus = currentBalance.bonus + bonus;
    const newTotal = newPaid + newBonus;

    Store.add('walletTransactions', {
      id: 'wtx_' + Utils.generateId(),
      customerId,
      type: 'TopUp-Paid',
      amount: paidAmount,
      creditType: 'Paid',
      balance: { paid: newPaid, bonus: currentBalance.bonus, total: newPaid + currentBalance.bonus },
      reference: { type: 'Manual', id: null },
      reason: `Top-up of ₹${paidAmount}`,
      createdAt: Utils.now(),
      reversedBy: null,
      reversalOf: null
    });

    // Create bonus credit transaction
    if (bonus > 0) {
      Store.add('walletTransactions', {
        id: 'wtx_' + Utils.generateId(),
        customerId,
        type: 'TopUp-Bonus',
        amount: bonus,
        creditType: 'Bonus',
        balance: { paid: newPaid, bonus: newBonus, total: newTotal },
        reference: { type: 'Manual', id: null },
        reason: `Bonus on ₹${paidAmount} top-up`,
        createdAt: Utils.now(),
        reversedBy: null,
        reversalOf: null
      });
    }

    // Update customer balance
    Store.update('customers', customerId, {
      walletBalance: { paid: newPaid, bonus: newBonus, total: newTotal }
    });

    return { paidAmount, bonus, newBalance: { paid: newPaid, bonus: newBonus, total: newTotal } };
  },

  // Debit from wallet
  debit(customerId, amount, bookingId) {
    const customer = Store.getById('customers', customerId);
    const balance = customer.walletBalance || { paid: 0, bonus: 0, total: 0 };

    if (balance.total < amount) {
      return { success: false, error: 'Insufficient wallet balance' };
    }

    // Debit from bonus first, then paid
    let remaining = amount;
    let bonusDebit = Math.min(remaining, balance.bonus);
    remaining -= bonusDebit;
    let paidDebit = remaining;

    const newPaid = balance.paid - paidDebit;
    const newBonus = balance.bonus - bonusDebit;
    const newTotal = newPaid + newBonus;

    Store.add('walletTransactions', {
      id: 'wtx_' + Utils.generateId(),
      customerId,
      type: 'Debit',
      amount: -amount,
      creditType: 'Paid',
      balance: { paid: newPaid, bonus: newBonus, total: newTotal },
      reference: { type: 'Booking', id: bookingId },
      reason: null,
      createdAt: Utils.now(),
      reversedBy: null,
      reversalOf: null
    });

    Store.update('customers', customerId, {
      walletBalance: { paid: newPaid, bonus: newBonus, total: newTotal }
    });

    return { success: true, newBalance: { paid: newPaid, bonus: newBonus, total: newTotal } };
  },

  // Refund to wallet (creates reversal entry)
  refund(customerId, amount, bookingId) {
    const customer = Store.getById('customers', customerId);
    const balance = customer.walletBalance || { paid: 0, bonus: 0, total: 0 };

    const newPaid = balance.paid + amount;
    const newTotal = newPaid + balance.bonus;

    const txn = {
      id: 'wtx_' + Utils.generateId(),
      customerId,
      type: 'Refund',
      amount: amount,
      creditType: 'Paid',
      balance: { paid: newPaid, bonus: balance.bonus, total: newTotal },
      reference: { type: 'Booking', id: bookingId },
      reason: 'Refund for cancelled booking',
      createdAt: Utils.now(),
      reversedBy: null,
      reversalOf: null
    };

    Store.add('walletTransactions', txn);
    Store.update('customers', customerId, {
      walletBalance: { paid: newPaid, bonus: balance.bonus, total: newTotal }
    });

    return { success: true, newBalance: { paid: newPaid, bonus: balance.bonus, total: newTotal } };
  },

  // Manual adjustment (requires reason)
  manualAdjust(customerId, amount, reason) {
    if (!reason || reason.trim().length < 3) {
      return { success: false, error: 'Reason is required for manual adjustments' };
    }

    const customer = Store.getById('customers', customerId);
    const balance = customer.walletBalance || { paid: 0, bonus: 0, total: 0 };

    const type = amount >= 0 ? 'TopUp-Paid' : 'Debit';
    const newPaid = balance.paid + amount;
    const newTotal = newPaid + balance.bonus;

    if (newTotal < 0) {
      return { success: false, error: 'Adjustment would result in negative balance' };
    }

    Store.add('walletTransactions', {
      id: 'wtx_' + Utils.generateId(),
      customerId,
      type: amount >= 0 ? 'TopUp-Paid' : 'Reversal',
      amount,
      creditType: 'Paid',
      balance: { paid: newPaid, bonus: balance.bonus, total: newTotal },
      reference: { type: 'Manual', id: null },
      reason,
      createdAt: Utils.now(),
      reversedBy: null,
      reversalOf: null
    });

    Store.update('customers', customerId, {
      walletBalance: { paid: newPaid, bonus: balance.bonus, total: newTotal }
    });

    return { success: true, newBalance: { paid: newPaid, bonus: balance.bonus, total: newTotal } };
  },

  // Get transaction history for a customer
  getHistory(customerId) {
    return Store.getWhere('walletTransactions', t => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};


const ReferralService = {
  // Create a referral
  create(referrerCustomerId, refereePhone) {
    const referrer = Store.getById('customers', referrerCustomerId);
    if (!referrer) return { success: false, error: 'Referrer not found' };

    // Check self-referral
    if (Utils.cleanPhone(refereePhone) === referrer.phone) {
      return { success: false, error: 'You cannot refer yourself' };
    }

    // Check if already referred
    const existing = Store.getWhere('referrals', r =>
      r.refereePhone === Utils.cleanPhone(refereePhone) &&
      r.status === 'Pending'
    );
    if (existing.length > 0) {
      return { success: false, error: 'This number has already been referred' };
    }

    const settings = Store.getSettings();
    const referral = {
      id: 'ref_' + Utils.generateId(),
      referrerCustomerId,
      refereePhone: Utils.cleanPhone(refereePhone),
      refereeCustomerId: null,
      referralCode: referrer.referralCode,
      status: 'Pending',
      referrerReward: { amount: settings.referral.referrerReward, creditedAt: null },
      refereeDiscount: { amount: settings.referral.refereeDiscount, usedAt: null },
      createdAt: Utils.now(),
      completedAt: null
    };

    Store.add('referrals', referral);
    return { success: true, referral };
  },

  // Complete a referral (when referee completes first paid visit)
  complete(referralId) {
    const referral = Store.getById('referrals', referralId);
    if (!referral || referral.status !== 'Pending') return { success: false };

    const settings = Store.getSettings();

    // Credit referrer
    const referrer = Store.getById('customers', referral.referrerCustomerId);
    if (referrer) {
      const balance = referrer.walletBalance || { paid: 0, bonus: 0, total: 0 };
      const newBonus = balance.bonus + settings.referral.referrerReward;
      const newTotal = balance.paid + newBonus;

      Store.add('walletTransactions', {
        id: 'wtx_' + Utils.generateId(),
        customerId: referrer.id,
        type: 'TopUp-Bonus',
        amount: settings.referral.referrerReward,
        creditType: 'Bonus',
        balance: { paid: balance.paid, bonus: newBonus, total: newTotal },
        reference: { type: 'Referral', id: referralId },
        reason: `Referral reward — ${referral.refereePhone} completed first visit`,
        createdAt: Utils.now(),
        reversedBy: null,
        reversalOf: null
      });

      Store.update('customers', referrer.id, {
        walletBalance: { paid: balance.paid, bonus: newBonus, total: newTotal }
      });
    }

    Store.update('referrals', referralId, {
      status: 'Completed',
      referrerReward: { ...referral.referrerReward, creditedAt: Utils.now() },
      completedAt: Utils.now()
    });

    return { success: true };
  },

  // Get referrals for a customer (as referrer)
  getForCustomer(customerId) {
    return Store.getWhere('referrals', r => r.referrerCustomerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};


const ReminderService = {
  // Create a reminder
  create(customerId, serviceId, dueDate) {
    const customer = Store.getById('customers', customerId);
    if (customer?.reminderOptOut) return null;

    // Check if a reminder already exists for this customer+service
    const existing = Store.getWhere('reminders', r =>
      r.customerId === customerId &&
      r.serviceId === serviceId &&
      (r.status === 'Scheduled' || r.status === 'Sent')
    );
    if (existing.length > 0) return existing[0];

    const reminder = {
      id: 'rem_' + Utils.generateId(),
      customerId,
      serviceId,
      bookingId: null,
      dueDate,
      status: 'Scheduled',
      createdAt: Utils.now(),
      sentAt: null,
      bookedAt: null
    };

    Store.add('reminders', reminder);
    return reminder;
  },

  // Mark reminders as booked for a customer+service
  markBooked(customerId, serviceId, bookingId) {
    const reminders = Store.getWhere('reminders', r =>
      r.customerId === customerId &&
      r.serviceId === serviceId &&
      (r.status === 'Scheduled' || r.status === 'Sent')
    );
    reminders.forEach(r => {
      Store.update('reminders', r.id, {
        status: 'Booked',
        bookingId,
        bookedAt: Utils.now()
      });
    });
  },

  // Opt out a customer from reminders
  optOut(customerId) {
    Store.update('customers', customerId, { reminderOptOut: true });
    const reminders = Store.getWhere('reminders', r =>
      r.customerId === customerId &&
      (r.status === 'Scheduled' || r.status === 'Sent')
    );
    reminders.forEach(r => {
      Store.update('reminders', r.id, { status: 'OptedOut' });
    });
  },

  // Get due reminders
  getDueReminders() {
    const today = Utils.today();
    const settings = Store.getSettings();
    const checkDate = Utils.addDays(today, settings.reminder.sendBeforeDays);
    return Store.getWhere('reminders', r =>
      r.status === 'Scheduled' &&
      r.dueDate <= checkDate
    );
  },

  // Get reminders for a customer
  getForCustomer(customerId) {
    return Store.getWhere('reminders', r => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};


// ── Automations Orchestrator ──
const Automations = {
  // A1: Booking completed → create visit, update customer, schedule reminder
  onBookingCompleted(bookingId) {
    const booking = Store.getById('bookings', bookingId);
    if (!booking) return;

    const services = booking.services.map(s => {
      const svc = Store.getById('services', s.serviceId);
      return { serviceId: s.serviceId, name: svc?.name || 'Unknown', price: s.price };
    });

    // Create visit
    const visit = {
      id: 'vis_' + Utils.generateId(),
      customerId: booking.customerId,
      bookingId,
      services,
      totalPaid: booking.totalAmount,
      paymentMethod: booking.walletDebit > 0 ? 'Wallet + Cash' : 'Cash',
      staffId: booking.staffId,
      date: booking.date,
      completedAt: Utils.now(),
      nextDueDate: null,
      feedbackRating: null
    };

    // Calculate next due date from primary service
    const primaryService = Store.getById('services', booking.services[0]?.serviceId);
    if (primaryService?.reminderDays > 0) {
      visit.nextDueDate = Utils.addDays(booking.date, primaryService.reminderDays);
    }

    Store.add('visits', visit);

    // Update customer stats
    const customer = Store.getById('customers', booking.customerId);
    if (customer) {
      Store.update('customers', booking.customerId, {
        lastVisitAt: Utils.now(),
        totalVisits: (customer.totalVisits || 0) + 1,
        totalSpent: (customer.totalSpent || 0) + booking.totalAmount
      });
    }

    // Schedule reminder
    if (visit.nextDueDate && primaryService) {
      ReminderService.create(booking.customerId, primaryService.id, visit.nextDueDate);
    }

    // Check if this is a referral's first paid visit
    this._checkReferralCompletion(booking.customerId);

    UI.showToast('Visit recorded! Next reminder set.', 'success');
  },

  // A3: Booking confirmed → reserve slot, stop duplicate reminders
  onBookingConfirmed(bookingId) {
    const booking = Store.getById('bookings', bookingId);
    if (!booking) return;

    // Mark any existing reminders for this customer+service as booked
    booking.services.forEach(s => {
      ReminderService.markBooked(booking.customerId, s.serviceId, bookingId);
    });

    UI.showToast('Booking confirmed!', 'success');
  },

  // A4: Check if this customer's first visit completes a referral
  _checkReferralCompletion(customerId) {
    const customer = Store.getById('customers', customerId);
    if (!customer) return;

    const visits = Store.getWhere('visits', v => v.customerId === customerId);
    if (visits.length !== 1) return; // Only trigger on first visit

    // Find pending referral where this customer is the referee
    const referral = Store.getWhere('referrals', r =>
      r.refereePhone === customer.phone &&
      r.status === 'Pending'
    )[0];

    if (referral) {
      Store.update('referrals', referral.id, { refereeCustomerId: customerId });
      ReferralService.complete(referral.id);
    }
  },

  // A5: Daily summary (computed on-demand for dashboard)
  getDailySummary() {
    const today = Utils.today();
    const todayBookings = Store.getWhere('bookings', b => b.date === today);
    const completed = todayBookings.filter(b => b.status === 'Completed');
    const missed = todayBookings.filter(b => b.status === 'No-show' || b.status === 'Cancelled');

    const revenue = completed.reduce((sum, b) => sum + b.totalAmount, 0);
    const addOnRevenue = completed.reduce((sum, b) => {
      return sum + b.services.filter(s => s.isAddOn).reduce((s2, s) => s2 + s.price, 0);
    }, 0);

    // New vs repeat
    const todayCustomerIds = [...new Set(completed.map(b => b.customerId))];
    let newCustomers = 0;
    let repeatCustomers = 0;
    todayCustomerIds.forEach(cid => {
      const customer = Store.getById('customers', cid);
      if (customer && customer.totalVisits <= 1) newCustomers++;
      else repeatCustomers++;
    });

    // Wallet collected today
    const walletCollected = Store.getWhere('walletTransactions', t =>
      t.createdAt.startsWith(today) && t.type === 'TopUp-Paid'
    ).reduce((sum, t) => sum + t.amount, 0);

    // Outstanding wallet balance
    const allCustomers = Store.getAll('customers');
    const outstandingCredit = allCustomers.reduce((sum, c) =>
      sum + (c.walletBalance?.total || 0), 0);

    // Tomorrow's bookings
    const tomorrow = Utils.addDays(today, 1);
    const tomorrowBookings = Store.getWhere('bookings', b =>
      b.date === tomorrow &&
      (b.status === 'Pending' || b.status === 'Confirmed')
    );

    // Reminder-generated bookings
    const reminderBookings = Store.getWhere('reminders', r =>
      r.status === 'Booked' && r.bookedAt?.startsWith(today)
    ).length;

    // Average bill value
    const avgBill = completed.length > 0 ? Math.round(revenue / completed.length) : 0;

    return {
      revenue,
      completedBookings: completed.length,
      totalBookings: todayBookings.length,
      missedBookings: missed.length,
      newCustomers,
      repeatCustomers,
      addOnRevenue,
      walletCollected,
      outstandingCredit,
      tomorrowBookings: tomorrowBookings.length,
      reminderBookings,
      avgBill
    };
  },

  // Reports data
  getReports() {
    const allVisits = Store.getAll('visits');
    const allBookings = Store.getAll('bookings');
    const allCustomers = Store.getAll('customers');
    const allServices = Store.getAll('services');
    const allStaff = Store.getAll('staff');
    const allReferrals = Store.getAll('referrals');
    const allReminders = Store.getAll('reminders');

    // Barber performance
    const barberPerf = allStaff.filter(s => s.role !== 'Manager').map(staff => {
      const staffVisits = allVisits.filter(v => v.staffId === staff.id);
      const staffRevenue = staffVisits.reduce((sum, v) => sum + v.totalPaid, 0);
      return {
        name: staff.name,
        visits: staffVisits.length,
        revenue: staffRevenue,
        avgBill: staffVisits.length > 0 ? Math.round(staffRevenue / staffVisits.length) : 0
      };
    });

    // Top customers
    const topCustomers = [...allCustomers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // Popular services
    const serviceCount = {};
    allVisits.forEach(v => {
      v.services.forEach(s => {
        serviceCount[s.serviceId] = (serviceCount[s.serviceId] || 0) + 1;
      });
    });
    const popularServices = Object.entries(serviceCount)
      .map(([svcId, count]) => {
        const svc = Store.getById('services', svcId);
        return { name: svc?.name || 'Unknown', count, revenue: count * (svc?.price || 0) };
      })
      .sort((a, b) => b.count - a.count);

    // Add-on revenue
    const addonRevenue = allVisits.reduce((sum, v) => {
      return sum + v.services
        .filter(s => Store.getById('services', s.serviceId)?.isAddOn)
        .reduce((s2, s) => s2 + s.price, 0);
    }, 0);

    // Referral stats
    const completedReferrals = allReferrals.filter(r => r.status === 'Completed').length;
    const pendingReferrals = allReferrals.filter(r => r.status === 'Pending').length;

    // Due reminders
    const dueReminders = allReminders.filter(r =>
      r.status === 'Scheduled' && r.dueDate <= Utils.addDays(Utils.today(), 7)
    ).length;

    // Cancellations and no-shows
    const cancellations = allBookings.filter(b => b.status === 'Cancelled').length;
    const noShows = allBookings.filter(b => b.status === 'No-show').length;

    return {
      barberPerf,
      topCustomers,
      popularServices,
      addonRevenue,
      completedReferrals,
      pendingReferrals,
      dueReminders,
      cancellations,
      noShows
    };
  }
};
