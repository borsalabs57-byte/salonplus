// ============================================
// SALON APP — MAIN APPLICATION
// Router, Screen Renderers, Event Handlers
// ============================================

const App = {
  currentScreen: 'login',
  bookingState: {}, // tracks multi-step booking flow

  init() {
    Store.init();
    this.render();
  },

  // ── Router ──
  navigate(screen, params = {}) {
    this.currentScreen = screen;
    this.currentParams = params;
    this.render();
    window.scrollTo(0, 0);
  },

  render() {
    const app = document.getElementById('app');
    const role = Store.getCurrentRole();

    let html = '';
    html += '<div id="toast-container" class="toast-container"></div>';

    if (this.currentScreen === 'login') {
      html += this.renderLogin();
    } else if (role === 'customer') {
      html += this.renderCustomerApp();
    } else if (role === 'owner') {
      html += this.renderOwnerApp();
    }

    app.innerHTML = html;
    this.bindEvents();
  },

  bindEvents() {
    // Delegate all click events
    document.getElementById('app').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        e.preventDefault();
        const action = btn.dataset.action;
        const params = btn.dataset;
        this.handleAction(action, params);
      }
    });
  },

  handleAction(action, params) {
    switch (action) {
      // ── Auth ──
      case 'login-customer': this.loginCustomer(); break;
      case 'login-owner': this.loginOwner(); break;
      case 'logout': Store.logout(); this.navigate('login'); break;
      case 'reset-data': Store.reset(); this.navigate('login'); UI.showToast('Data reset to sample data', 'success'); break;

      // ── Navigation ──
      case 'nav': this.navigate(params.screen); break;
      case 'go-booking': this.startBooking(); break;
      case 'go-topup': this.navigate('c-topup'); break;

      // ── Booking Flow ──
      case 'select-service': this.selectService(params.id); break;
      case 'toggle-addon': this.toggleAddon(params.id); break;
      case 'select-date': this.selectDate(params.date); break;
      case 'select-slot': this.selectSlot(params.start, params.end); break;
      case 'select-staff': this.selectStaff(params.id); break;
      case 'booking-next': this.bookingNext(); break;
      case 'booking-back': this.bookingBack(); break;
      case 'confirm-booking': this.confirmBooking(); break;
      case 'use-wallet': this.toggleWalletPayment(); break;

      // ── Wallet ──
      case 'topup-select': this.selectTopUp(params.amount, params.bonus); break;
      case 'confirm-topup': this.confirmTopUp(); break;

      // ── Referral ──
      case 'copy-referral': this.copyReferralCode(); break;
      case 'share-referral': this.shareReferral(); break;

      // ── Profile ──
      case 'toggle-consent': this.toggleConsent(); break;
      case 'toggle-reminder-optout': this.toggleReminderOptOut(); break;

      // ── Owner Actions ──
      case 'owner-booking-status': this.ownerUpdateBookingStatus(params.id, params.status); break;
      case 'owner-create-walkin': this.navigate('o-walkin'); break;
      case 'owner-save-walkin': this.ownerSaveWalkin(); break;
      case 'owner-view-customer': this.navigate('o-customer-detail', { id: params.id }); break;
      case 'owner-edit-service': this.navigate('o-service-edit', { id: params.id }); break;
      case 'owner-wallet-adjust': this.ownerWalletAdjust(params.id); break;
      case 'owner-tab': this.ownerTab = params.tab; this.render(); break;
      case 'report-tab': this.reportTab = params.tab; this.render(); break;

      default:
        console.log('Unknown action:', action, params);
    }
  },

  // ============================================
  // LOGIN SCREEN
  // ============================================
  renderLogin() {
    return `
      <div class="screen login-screen active" id="screen-login">
        <div class="login-logo">${Icons.scissors}</div>
        <h1 class="login-title">Royal Cuts</h1>
        <p class="login-subtitle">Men's Salon — Andheri West</p>

        <div class="login-form">
          <div class="input-group">
            <label class="input-label">Mobile Number</label>
            <div class="input-field-with-prefix">
              <span class="input-prefix">+91</span>
              <input type="tel" id="login-phone" class="input-field" placeholder="Enter 10-digit number" maxlength="10" inputmode="numeric">
            </div>
          </div>

          <button class="btn btn-primary btn-block btn-lg" data-action="login-customer">
            Continue as Customer
          </button>

          <div class="login-divider">or</div>

          <button class="btn btn-outline btn-block" data-action="login-owner">
            ${Icons.settings} Owner / Manager Login
          </button>

          <p class="text-xs text-tertiary mt-4">
            Demo: Use any of these numbers: 9876543001 – 9876543010<br>
            Owner PIN: 1234
          </p>

          <button class="btn btn-ghost btn-sm mt-2" data-action="reset-data">
            ${Icons.refreshCw} Reset Demo Data
          </button>
        </div>
      </div>
    `;
  },

  loginCustomer() {
    const phone = document.getElementById('login-phone')?.value?.trim();
    if (!phone || !Utils.isValidPhone(phone)) {
      UI.showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    const cleaned = Utils.cleanPhone(phone);
    let customer = Store.getWhere('customers', c => c.phone === cleaned)[0];

    if (!customer) {
      // Create new customer
      customer = {
        id: 'cust_' + Utils.generateId(),
        name: '',
        phone: cleaned,
        email: '',
        gender: 'Male',
        createdAt: Utils.now(),
        lastVisitAt: null,
        totalVisits: 0,
        totalSpent: 0,
        communicationConsent: true,
        reminderOptOut: false,
        referralCode: Utils.generateReferralCode('NEW'),
        referredBy: null,
        walletBalance: { paid: 0, bonus: 0, total: 0 }
      };
      Store.add('customers', customer);
      Store.setCurrentUser(customer.id, 'customer');
      this.navigate('c-profile-edit');
      UI.showToast('Welcome! Please set up your profile.', 'success');
      return;
    }

    Store.setCurrentUser(customer.id, 'customer');
    this.navigate('c-home');
    UI.showToast(`Namaste, ${customer.name || 'there'}! 🙏`, 'success');
  },

  loginOwner() {
    const pin = prompt('Enter Owner PIN:');
    const settings = Store.getSettings();
    if (pin === settings.ownerPin) {
      Store.setCurrentUser(null, 'owner');
      this.navigate('o-dashboard');
      UI.showToast('Welcome back, Boss! 💈', 'success');
    } else {
      UI.showToast('Invalid PIN', 'error');
    }
  },

  // ============================================
  // CUSTOMER APP
  // ============================================
  renderCustomerApp() {
    const customer = Store.getCurrentUser();
    if (!customer) { this.navigate('login'); return ''; }

    let screenHtml = '';
    switch (this.currentScreen) {
      case 'c-home': screenHtml = this.renderCustomerHome(customer); break;
      case 'c-booking': screenHtml = this.renderCustomerBooking(customer); break;
      case 'c-wallet': screenHtml = this.renderCustomerWallet(customer); break;
      case 'c-topup': screenHtml = this.renderCustomerTopUp(customer); break;
      case 'c-visits': screenHtml = this.renderCustomerVisits(customer); break;
      case 'c-referral': screenHtml = this.renderCustomerReferral(customer); break;
      case 'c-profile': screenHtml = this.renderCustomerProfile(customer); break;
      case 'c-profile-edit': screenHtml = this.renderCustomerProfileEdit(customer); break;
      case 'c-booking-confirm': screenHtml = this.renderBookingConfirmation(); break;
      default: screenHtml = this.renderCustomerHome(customer);
    }

    const activeTab = this.currentScreen.startsWith('c-wallet') || this.currentScreen === 'c-topup' ? 'c-wallet' :
      this.currentScreen.startsWith('c-booking') ? 'c-booking' :
      this.currentScreen.startsWith('c-profile') || this.currentScreen === 'c-visits' || this.currentScreen === 'c-referral' ? 'c-profile' : 'c-home';

    return `
      ${this.renderHeader(customer)}
      ${screenHtml}
      ${this.renderCustomerNav(activeTab)}
    `;
  },

  renderHeader(customer) {
    const isHome = this.currentScreen === 'c-home' || this.currentScreen === 'o-dashboard';
    const title = {
      'c-home': `Namaste, ${(customer?.name || 'there').split(' ')[0]}! 🙏`,
      'c-booking': 'Book Appointment',
      'c-wallet': 'My Wallet',
      'c-topup': 'Top Up Wallet',
      'c-visits': 'My Visits',
      'c-referral': 'Refer & Earn',
      'c-profile': 'My Profile',
      'c-profile-edit': 'Edit Profile',
      'c-booking-confirm': 'Booking Confirmed',
      'o-dashboard': 'Dashboard',
      'o-bookings': "Today's Bookings",
      'o-customers': 'Customers',
      'o-services': 'Services',
      'o-staff': 'Staff',
      'o-wallet-mgr': 'Wallet & Transactions',
      'o-reports': 'Reports',
      'o-settings': 'Settings',
      'o-walkin': 'Create Walk-in',
      'o-customer-detail': 'Customer Details',
    }[this.currentScreen] || 'Royal Cuts';

    const showBack = !['c-home', 'o-dashboard', 'o-bookings', 'o-customers', 'o-more'].includes(this.currentScreen);
    const backScreen = Store.isOwner() ? 'o-dashboard' : 'c-home';
    const backMap = {
      'c-topup': 'c-wallet',
      'c-profile-edit': 'c-profile',
      'o-walkin': 'o-bookings',
      'o-customer-detail': 'o-customers',
      'o-service-edit': 'o-services',
      'o-services': 'o-more',
      'o-staff': 'o-more',
      'o-wallet-mgr': 'o-more',
      'o-reports': 'o-more',
      'o-settings': 'o-more',
    };

    return `
      <header class="header">
        ${showBack ? `<button class="btn-icon header-back" data-action="nav" data-screen="${backMap[this.currentScreen] || backScreen}">${Icons.arrowLeft}</button>` : ''}
        <div class="header-title">${title}</div>
      </header>
    `;
  },

  renderCustomerNav(active) {
    const tabs = [
      { id: 'c-home', icon: Icons.home, label: 'Home' },
      { id: 'c-booking', icon: Icons.calendar, label: 'Book' },
      { id: 'c-wallet', icon: Icons.wallet, label: 'Wallet' },
      { id: 'c-profile', icon: Icons.user, label: 'Profile' },
    ];
    return `
      <nav class="bottom-nav">
        ${tabs.map(t => `
          <button class="nav-item ${active === t.id ? 'active' : ''}" data-action="nav" data-screen="${t.id}">
            ${t.icon}
            <span>${t.label}</span>
          </button>
        `).join('')}
      </nav>
    `;
  },

  // ── Customer Home ──
  renderCustomerHome(customer) {
    const settings = Store.getSettings();
    const upcomingBookings = Store.getWhere('bookings', b =>
      b.customerId === customer.id &&
      (b.status === 'Pending' || b.status === 'Confirmed') &&
      b.date >= Utils.today()
    ).sort((a, b) => a.date.localeCompare(b.date));

    const nextBooking = upcomingBookings[0];
    const dueReminders = Store.getWhere('reminders', r =>
      r.customerId === customer.id &&
      r.status === 'Scheduled' &&
      r.dueDate <= Utils.addDays(Utils.today(), 7)
    );

    return `
      <div class="screen active" id="screen-c-home">
        <!-- Wallet Quick Card -->
        <div class="card card-gradient mb-4" data-action="nav" data-screen="c-wallet" style="cursor:pointer">
          <div style="position:relative;z-index:1">
            <div class="wallet-label">Salon Wallet Balance</div>
            <div class="wallet-balance">${Utils.formatCurrency(customer.walletBalance?.total || 0)}</div>
            <div class="flex gap-4 mt-2" style="font-size:var(--text-xs);opacity:0.75">
              <span>Paid: ${Utils.formatCurrency(customer.walletBalance?.paid || 0)}</span>
              <span>Bonus: ${Utils.formatCurrency(customer.walletBalance?.bonus || 0)}</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions mb-6">
          <div class="quick-action" data-action="go-booking">
            <div class="quick-action-icon" style="background:var(--color-primary-bg);color:var(--color-primary)">${Icons.scissors}</div>
            <span class="quick-action-label">Book Now</span>
          </div>
          <div class="quick-action" data-action="nav" data-screen="c-wallet">
            <div class="quick-action-icon" style="background:var(--color-accent-bg);color:var(--color-accent-dark)">${Icons.indianRupee}</div>
            <span class="quick-action-label">Top Up</span>
          </div>
          <div class="quick-action" data-action="nav" data-screen="c-referral">
            <div class="quick-action-icon" style="background:#F3E8FF;color:#7C3AED">${Icons.gift}</div>
            <span class="quick-action-label">Refer</span>
          </div>
          <div class="quick-action" data-action="nav" data-screen="c-visits">
            <div class="quick-action-icon" style="background:var(--color-success-bg);color:var(--color-success)">${Icons.clipboardList}</div>
            <span class="quick-action-label">History</span>
          </div>
        </div>

        <!-- Due Reminder -->
        ${dueReminders.length > 0 ? (() => {
          const rem = dueReminders[0];
          const svc = Store.getById('services', rem.serviceId);
          return `
            <div class="reminder-card mb-4">
              <div class="reminder-icon">${Icons.bell}</div>
              <div class="flex-1">
                <div class="font-medium">${svc?.name || 'Service'} due!</div>
                <div class="text-sm text-secondary mt-1">Your next ${svc?.name?.toLowerCase()} is due ${Utils.getRelativeDate(rem.dueDate)}. Book now to keep looking fresh! 💈</div>
                <button class="btn btn-primary btn-sm mt-3" data-action="go-booking">Book Now</button>
              </div>
            </div>
          `;
        })() : ''}

        <!-- Upcoming Booking -->
        ${nextBooking ? (() => {
          const staff = Store.getById('staff', nextBooking.staffId);
          const svcs = nextBooking.services.map(s => Store.getById('services', s.serviceId)?.name).join(', ');
          return `
            <h3 class="section-title">Upcoming Appointment</h3>
            <div class="card card-accent mb-4">
              <div class="flex items-center gap-3 mb-2">
                ${UI.renderStatusBadge(nextBooking.status)}
                <span class="text-sm text-secondary">${Utils.getRelativeDate(nextBooking.date)}</span>
              </div>
              <div class="font-semibold">${svcs}</div>
              <div class="text-sm text-secondary mt-1">
                ${Utils.formatDate(nextBooking.date)} · ${Utils.formatTime(nextBooking.slot.start)} · ${staff?.name || 'Any barber'}
              </div>
              <div class="font-semibold text-primary mt-2">${Utils.formatCurrency(nextBooking.totalAmount)}</div>
            </div>
          `;
        })() : `
          <h3 class="section-title">Upcoming Appointment</h3>
          ${UI.renderEmptyState(Icons.calendar, 'No upcoming appointments', 'Book your next visit and keep looking sharp!', 'Book Now', "App.handleAction('go-booking', {})")}
        `}

        <!-- Salon Info -->
        <h3 class="section-title">Salon Info</h3>
        <div class="card">
          <div class="flex items-center gap-3 mb-2">
            ${Icons.mapPin}
            <div>
              <div class="font-medium">${settings.salonName}</div>
              <div class="text-sm text-secondary">${settings.address}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 mt-3">
            ${Icons.clock}
            <div class="text-sm">
              ${settings.workingDays.join(', ')} · ${Utils.formatTime(settings.workingHours.start)} – ${Utils.formatTime(settings.workingHours.end)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── Customer Booking Flow ──
  startBooking() {
    this.bookingState = {
      step: 1, // 1=service, 2=addons, 3=date/slot/barber, 4=summary
      serviceId: null,
      addOns: [],
      date: Utils.today(),
      slot: null,
      staffId: null,
      useWallet: false,
      total: 0
    };
    this.navigate('c-booking');
  },

  renderCustomerBooking(customer) {
    if (!this.bookingState.step) this.startBooking();
    const step = this.bookingState.step || 1;
    const totalSteps = 4;

    return `
      <div class="screen active" id="screen-c-booking">
        <div class="stepper mb-6">
          ${Array(totalSteps).fill('').map((_, i) => `
            <div class="stepper-step ${i + 1 <= step ? 'active' : ''} ${i + 1 < step ? 'completed' : ''}"></div>
          `).join('')}
        </div>

        ${step === 1 ? this.renderBookingStep1() : ''}
        ${step === 2 ? this.renderBookingStep2() : ''}
        ${step === 3 ? this.renderBookingStep3() : ''}
        ${step === 4 ? this.renderBookingStep4(customer) : ''}
      </div>
    `;
  },

  renderBookingStep1() {
    const services = Store.getAll('services').filter(s => s.isActive && !s.isAddOn);
    const categories = [...new Set(services.map(s => s.category))];

    return `
      <div class="booking-step active">
        <h3 class="mb-1">Choose a Service</h3>
        <p class="text-sm text-secondary mb-4">Select the service you need</p>

        ${categories.map(cat => `
          <div class="mb-4">
            <div class="text-sm font-semibold text-secondary mb-2">${cat}</div>
            <div class="service-list">
              ${services.filter(s => s.category === cat).map(svc => `
                <div class="service-card ${this.bookingState.serviceId === svc.id ? 'selected' : ''}" data-action="select-service" data-id="${svc.id}">
                  <div class="service-card-radio"></div>
                  <div class="service-card-info">
                    <div class="service-card-name">${svc.name}</div>
                    <div class="service-card-meta">${Icons.clock} ${svc.duration} min${svc.description ? ' · ' + svc.description : ''}</div>
                  </div>
                  <div class="service-card-price">${Utils.formatCurrency(svc.price)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <div class="sticky-footer">
          <div class="sticky-footer-split">
            <div>
              <div class="sticky-footer-label">Total</div>
              <div class="sticky-footer-price">${Utils.formatCurrency(this.bookingState.serviceId ? Store.getById('services', this.bookingState.serviceId)?.price || 0 : 0)}</div>
            </div>
            <button class="btn btn-primary" data-action="booking-next" ${!this.bookingState.serviceId ? 'disabled' : ''}>
              Next ${Icons.arrowRight}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  selectService(serviceId) {
    this.bookingState.serviceId = serviceId;
    this.render();
  },

  renderBookingStep2() {
    const addons = Store.getAll('services').filter(s => s.isActive && s.isAddOn);
    const mainService = Store.getById('services', this.bookingState.serviceId);
    const selectedAddons = this.bookingState.addOns || [];
    const mainPrice = mainService?.price || 0;
    const addonTotal = selectedAddons.reduce((sum, id) => sum + (Store.getById('services', id)?.price || 0), 0);
    const total = mainPrice + addonTotal;
    const totalDuration = (mainService?.duration || 0) + selectedAddons.reduce((sum, id) => sum + (Store.getById('services', id)?.duration || 0), 0);

    return `
      <div class="booking-step active">
        <h3 class="mb-1">Add-ons (Optional)</h3>
        <p class="text-sm text-secondary mb-4">Enhance your visit — nothing is pre-selected</p>

        <div class="service-list">
          ${addons.map(addon => `
            <div class="addon-card ${selectedAddons.includes(addon.id) ? 'selected' : ''}" data-action="toggle-addon" data-id="${addon.id}">
              <div class="addon-checkbox"></div>
              <div class="service-card-info">
                <div class="service-card-name">${addon.name}</div>
                <div class="addon-extra">+${addon.duration} min extra</div>
              </div>
              <div class="service-card-price" style="color:var(--color-accent-dark)">+${Utils.formatCurrency(addon.price)}</div>
            </div>
          `).join('')}
        </div>

        ${selectedAddons.length > 0 ? `
          <div class="card mt-4" style="background:var(--color-accent-bg)">
            <div class="text-sm font-medium">Total duration: ${totalDuration} min</div>
          </div>
        ` : ''}

        <div class="sticky-footer">
          <div class="sticky-footer-split">
            <div>
              <div class="sticky-footer-label">Total</div>
              <div class="sticky-footer-price">${Utils.formatCurrency(total)}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost" data-action="booking-back">${Icons.arrowLeft}</button>
              <button class="btn btn-primary" data-action="booking-next">Next ${Icons.arrowRight}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  toggleAddon(addonId) {
    const idx = this.bookingState.addOns.indexOf(addonId);
    if (idx >= 0) this.bookingState.addOns.splice(idx, 1);
    else this.bookingState.addOns.push(addonId);
    this.render();
  },

  renderBookingStep3() {
    const dates = Utils.getNextDates(14);
    const settings = Store.getSettings();
    const selectedDate = this.bookingState.date;

    // Get available staff
    const barbers = Store.getAll('staff').filter(s => s.isActive && s.role !== 'Manager');
    const selectedStaffId = this.bookingState.staffId || barbers[0]?.id;

    // Get slots for selected staff + date
    const slots = selectedStaffId ? BookingService.getAvailableSlots(selectedStaffId, selectedDate) : [];

    return `
      <div class="booking-step active">
        <h3 class="mb-1">Pick Date & Time</h3>
        <p class="text-sm text-secondary mb-4">Choose your preferred date, barber & time slot</p>

        <!-- Date Strip -->
        <div class="text-sm font-medium mb-2">Date</div>
        <div class="date-strip mb-4">
          ${dates.map(d => {
            const dayName = Utils.getDayName(d);
            const isSunday = new Date(d).getDay() === 0;
            const isWorkDay = settings.workingDays.includes(dayName.substring(0, 3)) || settings.workingDays.includes(dayName);
            return `
              <div class="date-chip ${selectedDate === d ? 'selected' : ''} ${!isWorkDay || isSunday ? 'disabled' : ''}"
                   ${isWorkDay && !isSunday ? `data-action="select-date" data-date="${d}"` : ''}>
                <span class="date-chip-day">${dayName}</span>
                <span class="date-chip-num">${Utils.getDayNum(d)}</span>
                <span class="date-chip-month">${Utils.getMonthName(d)}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Barber Selection -->
        <div class="text-sm font-medium mb-2">Preferred Barber</div>
        <div class="chip-group mb-4">
          ${barbers.map(b => `
            <div class="chip ${selectedStaffId === b.id ? 'selected' : ''}" data-action="select-staff" data-id="${b.id}">
              ${b.name}
            </div>
          `).join('')}
        </div>

        <!-- Time Slots -->
        <div class="text-sm font-medium mb-2">Available Slots</div>
        ${slots.length === 0 ? `
          <div class="card text-center p-4">
            <div class="text-secondary text-sm">No slots available for this date</div>
          </div>
        ` : `
          <div class="slot-grid mb-4">
            ${slots.map(s => `
              <button class="slot-btn ${!s.available ? 'disabled' : ''} ${this.bookingState.slot?.start === s.start ? 'selected' : ''}"
                      ${s.available ? `data-action="select-slot" data-start="${s.start}" data-end="${s.end}"` : ''}>
                ${Utils.formatTime(s.start)}
              </button>
            `).join('')}
          </div>
        `}

        <div class="sticky-footer">
          <div class="sticky-footer-split">
            <div>
              <div class="sticky-footer-label">Total</div>
              <div class="sticky-footer-price">${Utils.formatCurrency(this._calcBookingTotal())}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost" data-action="booking-back">${Icons.arrowLeft}</button>
              <button class="btn btn-primary" data-action="booking-next" ${!this.bookingState.slot ? 'disabled' : ''}>Review ${Icons.arrowRight}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  selectDate(date) { this.bookingState.date = date; this.bookingState.slot = null; this.render(); },
  selectSlot(start, end) { this.bookingState.slot = { start, end }; this.render(); },
  selectStaff(id) { this.bookingState.staffId = id; this.bookingState.slot = null; this.render(); },

  _calcBookingTotal() {
    const main = Store.getById('services', this.bookingState.serviceId);
    const addonsTotal = (this.bookingState.addOns || []).reduce((s, id) => s + (Store.getById('services', id)?.price || 0), 0);
    return (main?.price || 0) + addonsTotal;
  },

  renderBookingStep4(customer) {
    const mainService = Store.getById('services', this.bookingState.serviceId);
    const addons = (this.bookingState.addOns || []).map(id => Store.getById('services', id)).filter(Boolean);
    const staff = Store.getById('staff', this.bookingState.staffId);
    const total = this._calcBookingTotal();
    const walletBalance = customer.walletBalance?.total || 0;
    const useWallet = this.bookingState.useWallet;
    const walletDebit = useWallet ? Math.min(walletBalance, total) : 0;
    const cashDue = total - walletDebit;

    return `
      <div class="booking-step active">
        <h3 class="mb-4">Review & Confirm</h3>

        <div class="booking-summary mb-4">
          <div class="booking-summary-row">
            <span>${mainService?.name}</span>
            <span class="font-medium">${Utils.formatCurrency(mainService?.price)}</span>
          </div>
          ${addons.map(a => `
            <div class="booking-summary-row text-sm text-secondary">
              <span>+ ${a.name} (add-on)</span>
              <span>${Utils.formatCurrency(a.price)}</span>
            </div>
          `).join('')}
          <div class="booking-summary-row total">
            <span>Total</span>
            <span>${Utils.formatCurrency(total)}</span>
          </div>
        </div>

        <!-- Appointment Details -->
        <div class="card mb-4">
          <div class="list-item" style="border:none;padding:var(--space-2) 0">
            <div style="color:var(--color-primary)">${Icons.calendar}</div>
            <div><span class="font-medium">${Utils.formatDate(this.bookingState.date)}</span> · ${Utils.formatTime(this.bookingState.slot?.start)}</div>
          </div>
          <div class="list-item" style="border:none;padding:var(--space-2) 0">
            <div style="color:var(--color-primary)">${Icons.user}</div>
            <div class="font-medium">${staff?.name || 'Any available barber'}</div>
          </div>
          <div class="list-item" style="border:none;padding:var(--space-2) 0">
            <div style="color:var(--color-primary)">${Icons.clock}</div>
            <div>${(mainService?.duration || 0) + addons.reduce((s, a) => s + a.duration, 0)} minutes total</div>
          </div>
        </div>

        <!-- Wallet Payment Option -->
        ${walletBalance > 0 ? `
          <div class="card mb-4 ${useWallet ? '' : ''}" style="border-color:${useWallet ? 'var(--color-primary)' : 'var(--color-border)'}">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Pay from Wallet</div>
                <div class="text-sm text-secondary">Balance: ${Utils.formatCurrency(walletBalance)}</div>
              </div>
              <label class="toggle">
                <input type="checkbox" class="toggle-input" ${useWallet ? 'checked' : ''} data-action="use-wallet">
                <span class="toggle-slider"></span>
              </label>
            </div>
            ${useWallet ? `
              <div class="divider"></div>
              <div class="flex justify-between text-sm">
                <span>Wallet debit</span>
                <span class="text-success font-medium">-${Utils.formatCurrency(walletDebit)}</span>
              </div>
              <div class="flex justify-between text-sm mt-1">
                <span>Cash to pay</span>
                <span class="font-semibold">${Utils.formatCurrency(cashDue)}</span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        <div class="sticky-footer">
          <div class="sticky-footer-split">
            <div>
              <div class="sticky-footer-label">${useWallet && cashDue < total ? 'Cash Due' : 'Total'}</div>
              <div class="sticky-footer-price">${Utils.formatCurrency(useWallet ? cashDue : total)}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn btn-ghost" data-action="booking-back">${Icons.arrowLeft}</button>
              <button class="btn btn-primary btn-lg" data-action="confirm-booking">
                ${Icons.check} Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  toggleWalletPayment() {
    this.bookingState.useWallet = !this.bookingState.useWallet;
    this.render();
  },

  bookingNext() {
    if (this.bookingState.step === 1 && !this.bookingState.serviceId) {
      UI.showToast('Please select a service', 'warning'); return;
    }
    if (this.bookingState.step === 3 && !this.bookingState.slot) {
      UI.showToast('Please select a time slot', 'warning'); return;
    }
    if (this.bookingState.step === 3 && !this.bookingState.staffId) {
      const barbers = Store.getAll('staff').filter(s => s.isActive && s.role !== 'Manager');
      this.bookingState.staffId = barbers[0]?.id;
    }
    this.bookingState.step = Math.min(4, (this.bookingState.step || 1) + 1);
    this.render();
  },

  bookingBack() {
    this.bookingState.step = Math.max(1, (this.bookingState.step || 1) - 1);
    this.render();
  },

  confirmBooking() {
    const customer = Store.getCurrentUser();
    const total = this._calcBookingTotal();
    const walletBalance = customer.walletBalance?.total || 0;
    const useWallet = this.bookingState.useWallet;
    const walletDebit = useWallet ? Math.min(walletBalance, total) : 0;

    // Build services array
    const services = [{ serviceId: this.bookingState.serviceId, price: Store.getById('services', this.bookingState.serviceId)?.price || 0, isAddOn: false }];
    (this.bookingState.addOns || []).forEach(id => {
      services.push({ serviceId: id, price: Store.getById('services', id)?.price || 0, isAddOn: true });
    });

    // Debit wallet if needed
    if (walletDebit > 0) {
      const debitResult = WalletService.debit(customer.id, walletDebit, 'pending');
      if (!debitResult.success) {
        UI.showToast(debitResult.error, 'error');
        return;
      }
    }

    // Create booking
    const result = BookingService.create({
      customerId: customer.id,
      staffId: this.bookingState.staffId,
      services,
      date: this.bookingState.date,
      slot: this.bookingState.slot,
      totalAmount: total,
      walletDebit,
      source: 'App'
    });

    if (!result.success) {
      UI.showToast(result.error, 'error');
      // Refund wallet if booking failed
      if (walletDebit > 0) {
        WalletService.refund(customer.id, walletDebit, 'failed-booking');
      }
      return;
    }

    // Auto-confirm the booking
    BookingService.updateStatus(result.booking.id, 'Confirmed');

    this.lastBooking = result.booking;
    this.navigate('c-booking-confirm');
  },

  renderBookingConfirmation() {
    const booking = this.lastBooking;
    if (!booking) return this.renderCustomerHome(Store.getCurrentUser());

    const staff = Store.getById('staff', booking.staffId);
    const svcs = booking.services.map(s => Store.getById('services', s.serviceId)?.name).filter(Boolean).join(' + ');

    return `
      <div class="screen active" id="screen-c-booking-confirm">
        <div class="confirmation-screen">
          <div class="confirmation-icon">${Icons.checkCircle}</div>
          <h2>Booking Confirmed!</h2>
          <p class="text-secondary">Your appointment is set. See you soon! 💈</p>

          <div class="card w-full mt-4">
            <div class="text-sm text-secondary">Services</div>
            <div class="font-semibold">${svcs}</div>
            <div class="divider"></div>
            <div class="flex justify-between">
              <div>
                <div class="text-sm text-secondary">Date & Time</div>
                <div class="font-medium">${Utils.formatDate(booking.date)}</div>
                <div class="text-sm">${Utils.formatTime(booking.slot.start)}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-secondary">Barber</div>
                <div class="font-medium">${staff?.name || '—'}</div>
              </div>
            </div>
            <div class="divider"></div>
            <div class="flex justify-between font-semibold">
              <span>Total</span>
              <span class="text-primary">${Utils.formatCurrency(booking.totalAmount)}</span>
            </div>
            ${booking.walletDebit > 0 ? `
              <div class="flex justify-between text-sm mt-1">
                <span class="text-secondary">Wallet</span>
                <span class="text-success">-${Utils.formatCurrency(booking.walletDebit)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-secondary">Cash due</span>
                <span>${Utils.formatCurrency(booking.cashPaid)}</span>
              </div>
            ` : ''}
          </div>

          <button class="btn btn-primary btn-block mt-6" data-action="nav" data-screen="c-home">
            ${Icons.home} Back to Home
          </button>
        </div>
      </div>
    `;
  },

  // ── Customer Wallet ──
  renderCustomerWallet(customer) {
    const balance = customer.walletBalance || { paid: 0, bonus: 0, total: 0 };
    const transactions = WalletService.getHistory(customer.id);

    return `
      <div class="screen active" id="screen-c-wallet">
        <div class="wallet-card mb-6">
          <div style="position:relative;z-index:1">
            <div class="wallet-label">Total Balance</div>
            <div class="wallet-balance">${Utils.formatCurrency(balance.total)}</div>
            <div class="wallet-breakdown">
              <div>
                <div class="wallet-type-label">Paid Credit</div>
                <div class="wallet-type-value">${Utils.formatCurrency(balance.paid)}</div>
              </div>
              <div>
                <div class="wallet-type-label">Bonus Credit</div>
                <div class="wallet-type-value">${Utils.formatCurrency(balance.bonus)}</div>
              </div>
            </div>
          </div>
        </div>

        <button class="btn btn-accent btn-block mb-6" data-action="go-topup">
          ${Icons.plus} Top Up Wallet
        </button>

        <p class="text-xs text-tertiary mb-4">Credit is usable only at Royal Cuts. Cannot be withdrawn as cash.</p>

        <h3 class="section-title">Transaction History</h3>
        ${transactions.length === 0 ? UI.renderEmptyState(Icons.wallet, 'No transactions yet', 'Top up your wallet to see transactions here') : ''}

        ${transactions.map(txn => {
          const isCredit = txn.amount > 0;
          const iconClass = txn.type.startsWith('TopUp-Bonus') ? 'bonus' : isCredit ? 'credit' : 'debit';
          const iconSvg = txn.type.startsWith('TopUp-Bonus') ? Icons.gift : isCredit ? Icons.arrowDownRight : Icons.arrowUpRight;
          const label = {
            'TopUp-Paid': 'Top-up',
            'TopUp-Bonus': 'Bonus Credit',
            'Debit': 'Payment',
            'Refund': 'Refund',
            'Reversal': 'Reversal',
            'Expired': 'Expired'
          }[txn.type] || txn.type;

          return `
            <div class="txn-item">
              <div class="txn-icon ${iconClass}">${iconSvg}</div>
              <div class="flex-1">
                <div class="font-medium text-sm">${label}</div>
                <div class="text-xs text-tertiary">${Utils.formatDateTime(txn.createdAt)}</div>
                ${txn.reason ? `<div class="text-xs text-secondary mt-1">${txn.reason}</div>` : ''}
              </div>
              <div class="txn-amount ${isCredit ? 'credit' : 'debit'}">
                ${Utils.formatCurrencySign(txn.amount)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderCustomerTopUp(customer) {
    const settings = Store.getSettings();
    const slabs = settings.wallet.topUpSlabs;

    return `
      <div class="screen active" id="screen-c-topup">
        <h3 class="mb-1">Top Up Wallet</h3>
        <p class="text-sm text-secondary mb-4">Add credit to your salon wallet & get bonus!</p>

        <div class="flex flex-col gap-3 mb-6">
          ${slabs.map(slab => `
            <div class="card card-interactive ${this.bookingState.topUpAmount === slab.pay ? 'card-elevated' : ''}"
                 style="cursor:pointer;${this.bookingState.topUpAmount === slab.pay ? 'border-color:var(--color-primary)' : ''}"
                 data-action="topup-select" data-amount="${slab.pay}" data-bonus="${slab.bonus}">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-semibold text-lg">Pay ${Utils.formatCurrency(slab.pay)}</div>
                  <div class="text-sm text-success font-medium">Get ${Utils.formatCurrency(slab.bonus)} bonus free!</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-secondary">Total credit</div>
                  <div class="font-bold text-xl text-primary">${Utils.formatCurrency(slab.pay + slab.bonus)}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="card" style="background:var(--color-info-bg);border-color:var(--color-info-border)">
          <div class="text-sm">
            <strong>How it works:</strong> Pay ${Utils.formatCurrency(slabs[0].pay)}, salon adds ${Utils.formatCurrency(slabs[0].bonus)} bonus.
            Total balance = ${Utils.formatCurrency(slabs[0].pay + slabs[0].bonus)}. Use it for any service at Royal Cuts!
          </div>
        </div>

        ${this.bookingState.topUpAmount ? `
          <div class="sticky-footer">
            <button class="btn btn-primary btn-block btn-lg" data-action="confirm-topup">
              ${Icons.wallet} Pay ${Utils.formatCurrency(this.bookingState.topUpAmount)} (Simulated)
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  selectTopUp(amount, bonus) {
    this.bookingState.topUpAmount = parseInt(amount);
    this.bookingState.topUpBonus = parseInt(bonus);
    this.render();
  },

  confirmTopUp() {
    const customer = Store.getCurrentUser();
    const result = WalletService.topUp(customer.id, this.bookingState.topUpAmount);

    UI.showModal('Top-up Successful! 🎉', `
      <div class="text-center">
        <div class="confirmation-icon mx-auto mb-4" style="margin:0 auto">${Icons.checkCircle}</div>
        <p class="text-secondary mb-4">Your wallet has been topped up!</p>
        <div class="booking-summary">
          <div class="booking-summary-row">
            <span>Paid</span>
            <span class="font-medium">${Utils.formatCurrency(result.paidAmount)}</span>
          </div>
          <div class="booking-summary-row text-success">
            <span>Bonus Added</span>
            <span class="font-medium">+${Utils.formatCurrency(result.bonus)}</span>
          </div>
          <div class="booking-summary-row total">
            <span>New Balance</span>
            <span>${Utils.formatCurrency(result.newBalance.total)}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-block mt-4" onclick="UI.closeModal();App.navigate('c-wallet')">
          Done
        </button>
      </div>
    `);
  },

  // ── Customer Visits ──
  renderCustomerVisits(customer) {
    const visits = Store.getWhere('visits', v => v.customerId === customer.id)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return `
      <div class="screen active" id="screen-c-visits">
        ${visits.length === 0 ? UI.renderEmptyState(Icons.clipboardList, 'No visits yet', 'Your visit history will appear here after your first appointment') : `
          <div class="visit-timeline">
            ${visits.map(visit => {
              const staff = Store.getById('staff', visit.staffId);
              return `
                <div class="visit-item">
                  <div class="card mb-2">
                    <div class="flex justify-between items-start mb-2">
                      <div class="text-sm text-secondary">${Utils.formatDate(visit.date)}</div>
                      <span class="badge badge-success">Completed</span>
                    </div>
                    <div class="font-medium">${visit.services.map(s => s.name).join(' + ')}</div>
                    <div class="text-sm text-secondary mt-1">by ${staff?.name || '—'} · ${visit.paymentMethod}</div>
                    <div class="flex justify-between items-center mt-2">
                      <span class="font-semibold text-primary">${Utils.formatCurrency(visit.totalPaid)}</span>
                      ${visit.feedbackRating ? `<span class="text-accent text-sm">${'★'.repeat(visit.feedbackRating)}${'☆'.repeat(5 - visit.feedbackRating)}</span>` : ''}
                    </div>
                    ${visit.nextDueDate ? `<div class="text-xs text-secondary mt-2">Next visit due: ${Utils.formatDate(visit.nextDueDate)}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // ── Customer Referral ──
  renderCustomerReferral(customer) {
    const settings = Store.getSettings();
    const referrals = ReferralService.getForCustomer(customer.id);
    const totalEarned = referrals.filter(r => r.status === 'Completed').length * settings.referral.referrerReward;

    return `
      <div class="screen active" id="screen-c-referral">
        <div class="card card-primary mb-4">
          <div style="position:relative;z-index:1">
            <div class="flex items-center gap-2 mb-2">${Icons.gift} <span class="font-semibold">Refer & Earn</span></div>
            <p class="text-sm" style="opacity:0.85">Refer a friend and you both get rewarded!</p>
            <div class="flex gap-4 mt-3">
              <div>
                <div style="font-size:var(--text-xs);opacity:0.7">You get</div>
                <div class="font-bold text-lg">${Utils.formatCurrency(settings.referral.referrerReward)} credit</div>
              </div>
              <div>
                <div style="font-size:var(--text-xs);opacity:0.7">Friend gets</div>
                <div class="font-bold text-lg">${Utils.formatCurrency(settings.referral.refereeDiscount)} off</div>
              </div>
            </div>
          </div>
        </div>

        <div class="referral-code-box mb-4">
          <div class="text-sm text-secondary">Your Referral Code</div>
          <div class="referral-code">${customer.referralCode}</div>
          <div class="flex gap-2 justify-center">
            <button class="btn btn-primary btn-sm" data-action="copy-referral">${Icons.copy} Copy Code</button>
            <button class="btn btn-outline btn-sm" data-action="share-referral">${Icons.share} Share</button>
          </div>
        </div>

        <div class="card mb-4" style="background:var(--color-success-bg)">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">Total Earned from Referrals</span>
            <span class="font-bold text-success text-lg">${Utils.formatCurrency(totalEarned)}</span>
          </div>
        </div>

        <h3 class="section-title">Referral History</h3>
        ${referrals.length === 0 ? `<p class="text-sm text-secondary">Share your code to see referrals here</p>` : ''}
        ${referrals.map(ref => `
          <div class="list-item">
            <div class="avatar avatar-sm" style="background:${ref.status === 'Completed' ? 'var(--color-success)' : 'var(--color-status-pending)'}">
              ${ref.refereeCustomerId ? Utils.getInitials(Store.getById('customers', ref.refereeCustomerId)?.name || '?') : '?'}
            </div>
            <div class="list-item-content">
              <div class="list-item-title">${ref.refereeCustomerId ? Store.getById('customers', ref.refereeCustomerId)?.name : ref.refereePhone}</div>
              <div class="list-item-subtitle">${Utils.formatDate(ref.createdAt)}</div>
            </div>
            <div class="list-item-trailing">
              ${UI.renderStatusBadge(ref.status)}
              ${ref.status === 'Completed' ? `<div class="text-xs text-success font-medium mt-1">+${Utils.formatCurrency(ref.referrerReward.amount)}</div>` : ''}
            </div>
          </div>
        `).join('')}

        <div class="card mt-6" style="background:var(--color-bg-subtle)">
          <div class="text-sm text-secondary">
            <strong>How it works:</strong><br>
            1. Share your code with a friend<br>
            2. They visit Royal Cuts & use your code<br>
            3. They get ${Utils.formatCurrency(settings.referral.refereeDiscount)} off their first visit<br>
            4. You get ${Utils.formatCurrency(settings.referral.referrerReward)} credit after they complete their visit
          </div>
        </div>
      </div>
    `;
  },

  copyReferralCode() {
    const customer = Store.getCurrentUser();
    navigator.clipboard?.writeText(customer.referralCode).then(() => {
      UI.showToast('Code copied!', 'success');
    }).catch(() => {
      UI.showToast(`Code: ${customer.referralCode}`, 'default');
    });
  },

  shareReferral() {
    const customer = Store.getCurrentUser();
    const settings = Store.getSettings();
    const text = `Hey! Visit Royal Cuts and use my code ${customer.referralCode} to get ${Utils.formatCurrency(settings.referral.refereeDiscount)} off your first visit! 💈`;
    if (navigator.share) {
      navigator.share({ title: 'Royal Cuts Referral', text });
    } else {
      navigator.clipboard?.writeText(text);
      UI.showToast('Share text copied!', 'success');
    }
  },

  // ── Customer Profile ──
  renderCustomerProfile(customer) {
    const visits = Store.getWhere('visits', v => v.customerId === customer.id);

    return `
      <div class="screen active" id="screen-c-profile">
        <div class="flex flex-col items-center mb-6">
          ${UI.renderAvatar(customer.name, 'lg')}
          <h2 class="mt-3">${customer.name || 'Set Your Name'}</h2>
          <p class="text-secondary">${customer.phone ? '+91 ' + customer.phone : ''}</p>
          <button class="btn btn-outline btn-sm mt-2" data-action="nav" data-screen="c-profile-edit">${Icons.edit} Edit Profile</button>
        </div>

        <div class="grid grid-3 gap-3 mb-6">
          <div class="card text-center">
            <div class="kpi-value text-primary">${customer.totalVisits}</div>
            <div class="kpi-label">Visits</div>
          </div>
          <div class="card text-center">
            <div class="kpi-value text-primary">${Utils.formatCurrency(customer.totalSpent)}</div>
            <div class="kpi-label">Spent</div>
          </div>
          <div class="card text-center">
            <div class="kpi-value text-accent">${Utils.formatCurrency(customer.walletBalance?.total || 0)}</div>
            <div class="kpi-label">Wallet</div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="list-item" style="border:none">
            <div>${Icons.calendar}</div>
            <div class="list-item-content">
              <div class="list-item-title">My Visits</div>
              <div class="list-item-subtitle">${visits.length} visits recorded</div>
            </div>
            <button class="btn btn-ghost btn-sm" data-action="nav" data-screen="c-visits">${Icons.arrowRight}</button>
          </div>
          <div class="list-item">
            <div>${Icons.gift}</div>
            <div class="list-item-content">
              <div class="list-item-title">Refer & Earn</div>
              <div class="list-item-subtitle">Share & earn salon credit</div>
            </div>
            <button class="btn btn-ghost btn-sm" data-action="nav" data-screen="c-referral">${Icons.arrowRight}</button>
          </div>
        </div>

        <!-- Consent & Reminders -->
        <h3 class="section-title">Preferences</h3>
        <div class="card mb-4">
          <div class="flex items-center justify-between py-2">
            <div>
              <div class="font-medium">Promotional Messages</div>
              <div class="text-sm text-secondary">Receive offers & updates</div>
            </div>
            <label class="toggle">
              <input type="checkbox" class="toggle-input" ${customer.communicationConsent ? 'checked' : ''} data-action="toggle-consent">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="divider"></div>
          <div class="flex items-center justify-between py-2">
            <div>
              <div class="font-medium">Service Reminders</div>
              <div class="text-sm text-secondary">Get notified when service is due</div>
            </div>
            <label class="toggle">
              <input type="checkbox" class="toggle-input" ${!customer.reminderOptOut ? 'checked' : ''} data-action="toggle-reminder-optout">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <button class="btn btn-ghost btn-block text-error" data-action="logout">
          ${Icons.logout} Logout
        </button>
      </div>
    `;
  },

  renderCustomerProfileEdit(customer) {
    return `
      <div class="screen active" id="screen-c-profile-edit">
        <div class="flex flex-col gap-4">
          <div class="input-group">
            <label class="input-label">Full Name <span class="required">*</span></label>
            <input type="text" id="edit-name" class="input-field" value="${customer.name || ''}" placeholder="Enter your full name">
          </div>
          <div class="input-group">
            <label class="input-label">Mobile Number</label>
            <input type="tel" class="input-field" value="+91 ${customer.phone}" disabled>
          </div>
          <div class="input-group">
            <label class="input-label">Email (optional)</label>
            <input type="email" id="edit-email" class="input-field" value="${customer.email || ''}" placeholder="email@example.com">
          </div>

          <button class="btn btn-primary btn-block btn-lg mt-4" onclick="App.saveProfile()">
            Save Profile
          </button>
        </div>
      </div>
    `;
  },

  saveProfile() {
    const name = document.getElementById('edit-name')?.value?.trim();
    const email = document.getElementById('edit-email')?.value?.trim();
    if (!Utils.isValidName(name)) {
      UI.showToast('Please enter your name', 'error'); return;
    }
    const customer = Store.getCurrentUser();
    Store.update('customers', customer.id, { name, email });
    UI.showToast('Profile updated!', 'success');
    this.navigate('c-home');
  },

  toggleConsent() {
    const customer = Store.getCurrentUser();
    Store.update('customers', customer.id, { communicationConsent: !customer.communicationConsent });
    UI.showToast(customer.communicationConsent ? 'Promotional messages disabled' : 'Promotional messages enabled', 'default');
    this.render();
  },

  toggleReminderOptOut() {
    const customer = Store.getCurrentUser();
    if (!customer.reminderOptOut) {
      ReminderService.optOut(customer.id);
      UI.showToast('Reminders disabled', 'default');
    } else {
      Store.update('customers', customer.id, { reminderOptOut: false });
      UI.showToast('Reminders enabled', 'success');
    }
    this.render();
  },

  // ============================================
  // OWNER APP
  // ============================================
  renderOwnerApp() {
    let screenHtml = '';
    switch (this.currentScreen) {
      case 'o-dashboard': screenHtml = this.renderOwnerDashboard(); break;
      case 'o-bookings': screenHtml = this.renderOwnerBookings(); break;
      case 'o-customers': screenHtml = this.renderOwnerCustomers(); break;
      case 'o-more': screenHtml = this.renderOwnerMore(); break;
      case 'o-services': screenHtml = this.renderOwnerServices(); break;
      case 'o-staff': screenHtml = this.renderOwnerStaff(); break;
      case 'o-wallet-mgr': screenHtml = this.renderOwnerWalletMgr(); break;
      case 'o-reports': screenHtml = this.renderOwnerReports(); break;
      case 'o-settings': screenHtml = this.renderOwnerSettings(); break;
      case 'o-walkin': screenHtml = this.renderOwnerWalkIn(); break;
      case 'o-customer-detail': screenHtml = this.renderOwnerCustomerDetail(); break;
      default: screenHtml = this.renderOwnerDashboard();
    }

    const activeTab = ['o-services', 'o-staff', 'o-wallet-mgr', 'o-reports', 'o-settings'].includes(this.currentScreen) ? 'o-more' :
      this.currentScreen === 'o-customer-detail' ? 'o-customers' :
      this.currentScreen === 'o-walkin' ? 'o-bookings' :
      this.currentScreen;

    return `
      ${this.renderHeader(null)}
      ${screenHtml}
      ${this.renderOwnerNav(activeTab)}
    `;
  },

  renderOwnerNav(active) {
    const tabs = [
      { id: 'o-dashboard', icon: Icons.grid, label: 'Dashboard' },
      { id: 'o-bookings', icon: Icons.calendar, label: 'Bookings' },
      { id: 'o-customers', icon: Icons.users, label: 'Customers' },
      { id: 'o-more', icon: Icons.menu, label: 'More' },
    ];
    return `
      <nav class="bottom-nav">
        ${tabs.map(t => `
          <button class="nav-item ${active === t.id ? 'active' : ''}" data-action="nav" data-screen="${t.id}">
            ${t.icon}
            <span>${t.label}</span>
          </button>
        `).join('')}
      </nav>
    `;
  },

  // ── Owner Dashboard ──
  renderOwnerDashboard() {
    const summary = Automations.getDailySummary();

    return `
      <div class="screen active" id="screen-o-dashboard">
        <h3 class="mb-4">Today's Overview</h3>

        <div class="dashboard-grid mb-6">
          <div class="kpi-card">
            <div class="kpi-label">Revenue</div>
            <div class="kpi-value">${Utils.formatCurrency(summary.revenue)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Bookings</div>
            <div class="kpi-value">${summary.completedBookings}<span class="text-sm text-secondary font-regular">/${summary.totalBookings}</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Avg Bill</div>
            <div class="kpi-value">${Utils.formatCurrency(summary.avgBill)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Repeat</div>
            <div class="kpi-value">${summary.repeatCustomers}</div>
            <div class="text-xs text-secondary">${summary.newCustomers} new</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Wallet Collected</div>
            <div class="kpi-value">${Utils.formatCurrency(summary.walletCollected)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Outstanding Credit</div>
            <div class="kpi-value">${Utils.formatCurrency(summary.outstandingCredit)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Reminder Bookings</div>
            <div class="kpi-value">${summary.reminderBookings}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Add-on Revenue</div>
            <div class="kpi-value">${Utils.formatCurrency(summary.addOnRevenue)}</div>
          </div>
        </div>

        ${summary.missedBookings > 0 ? `
          <div class="card mb-4" style="background:var(--color-error-bg);border-color:var(--color-error-border)">
            <div class="flex items-center gap-2">
              ${Icons.alertCircle}
              <span class="font-medium text-error">${summary.missedBookings} missed booking(s) today</span>
            </div>
          </div>
        ` : ''}

        <div class="card mb-4" style="background:var(--color-info-bg);border-color:var(--color-info-border)">
          <div class="font-medium mb-1">Tomorrow's Bookings</div>
          <div class="text-2xl font-bold text-primary">${summary.tomorrowBookings}</div>
        </div>

        <!-- Quick Actions -->
        <h3 class="section-title">Quick Actions</h3>
        <div class="grid grid-2 gap-3">
          <button class="btn btn-primary btn-block" data-action="owner-create-walkin">
            ${Icons.plus} Walk-in Booking
          </button>
          <button class="btn btn-outline btn-block" data-action="nav" data-screen="o-reports">
            ${Icons.barChart} View Reports
          </button>
        </div>
      </div>
    `;
  },

  // ── Owner Bookings ──
  renderOwnerBookings() {
    const tab = this.ownerTab || 'today';
    const today = Utils.today();
    let bookings;

    if (tab === 'today') {
      bookings = BookingService.getTodayBookings();
    } else if (tab === 'upcoming') {
      bookings = Store.getWhere('bookings', b => b.date > today && (b.status === 'Pending' || b.status === 'Confirmed'))
        .sort((a, b) => a.date.localeCompare(b.date) || a.slot.start.localeCompare(b.slot.start));
    } else {
      bookings = Store.getWhere('bookings', b => b.status === 'Completed' || b.status === 'Cancelled' || b.status === 'No-show')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 20);
    }

    return `
      <div class="screen active" id="screen-o-bookings">
        <div class="tab-bar mb-4">
          <div class="tab-item ${tab === 'today' ? 'active' : ''}" data-action="owner-tab" data-tab="today">Today</div>
          <div class="tab-item ${tab === 'upcoming' ? 'active' : ''}" data-action="owner-tab" data-tab="upcoming">Upcoming</div>
          <div class="tab-item ${tab === 'past' ? 'active' : ''}" data-action="owner-tab" data-tab="past">Past</div>
        </div>

        <button class="btn btn-accent btn-block mb-4" data-action="owner-create-walkin">
          ${Icons.plus} Create Walk-in Booking
        </button>

        ${bookings.length === 0 ? UI.renderEmptyState(Icons.calendar, 'No bookings', tab === 'today' ? 'No bookings for today yet' : 'No bookings found') : ''}

        ${bookings.map(booking => {
          const customer = Store.getById('customers', booking.customerId);
          const staff = Store.getById('staff', booking.staffId);
          const svcs = booking.services.map(s => Store.getById('services', s.serviceId)?.name).filter(Boolean).join(', ');

          return `
            <div class="booking-list-item">
              <div class="booking-time">${Utils.formatTime(booking.slot.start)}</div>
              <div class="booking-details">
                <div class="booking-customer-name">${customer?.name || 'Unknown'}</div>
                <div class="booking-services-list">${svcs}</div>
                <div class="flex items-center gap-2 mt-1">
                  ${UI.renderStatusBadge(booking.status)}
                  ${booking.source === 'Walk-in' ? '<span class="badge badge-neutral">Walk-in</span>' : ''}
                  <span class="text-sm font-medium">${Utils.formatCurrency(booking.totalAmount)}</span>
                </div>
                ${booking.date !== today ? `<div class="text-xs text-secondary mt-1">${Utils.formatDate(booking.date)}</div>` : ''}

                ${booking.status === 'Pending' ? `
                  <div class="booking-actions">
                    <button class="btn btn-primary btn-sm" data-action="owner-booking-status" data-id="${booking.id}" data-status="Confirmed">${Icons.check} Confirm</button>
                    <button class="btn btn-ghost btn-sm text-error" data-action="owner-booking-status" data-id="${booking.id}" data-status="Cancelled">${Icons.x} Cancel</button>
                  </div>
                ` : booking.status === 'Confirmed' ? `
                  <div class="booking-actions">
                    <button class="btn btn-success btn-sm" data-action="owner-booking-status" data-id="${booking.id}" data-status="Completed">${Icons.checkCircle} Complete</button>
                    <button class="btn btn-ghost btn-sm" data-action="owner-booking-status" data-id="${booking.id}" data-status="No-show">No-show</button>
                  </div>
                ` : ''}
              </div>
              <div class="text-sm text-secondary">${staff?.name?.split(' ')[0] || '—'}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  ownerUpdateBookingStatus(bookingId, status) {
    let reason = null;
    if (status === 'Cancelled') {
      reason = prompt('Reason for cancellation:');
      if (!reason) return;
    }
    const result = BookingService.updateStatus(bookingId, status, reason);
    if (!result.success) {
      UI.showToast(result.error, 'error');
    }
    this.render();
  },

  // ── Owner Walk-in ──
  renderOwnerWalkIn() {
    const customers = Store.getAll('customers');
    const services = Store.getAll('services').filter(s => s.isActive);
    const staff = Store.getAll('staff').filter(s => s.isActive && s.role !== 'Manager');
    const slots = staff[0] ? BookingService.getAvailableSlots(staff[0].id, Utils.today()) : [];

    return `
      <div class="screen active" id="screen-o-walkin">
        <div class="flex flex-col gap-4">
          <div class="input-group">
            <label class="input-label">Customer Phone <span class="required">*</span></label>
            <input type="tel" id="walkin-phone" class="input-field" placeholder="10-digit mobile" maxlength="10" inputmode="numeric">
          </div>
          <div class="input-group">
            <label class="input-label">Customer Name</label>
            <input type="text" id="walkin-name" class="input-field" placeholder="Name (optional for walk-in)">
          </div>
          <div class="input-group">
            <label class="input-label">Service <span class="required">*</span></label>
            <select id="walkin-service" class="input-field select-field">
              <option value="">Select service</option>
              ${services.map(s => `<option value="${s.id}">${s.name} — ${Utils.formatCurrency(s.price)}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Barber</label>
            <select id="walkin-staff" class="input-field select-field">
              ${staff.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Time Slot</label>
            <select id="walkin-slot" class="input-field select-field">
              ${slots.filter(s => s.available).map(s => `<option value="${s.start}|${s.end}">${Utils.formatTime(s.start)} – ${Utils.formatTime(s.end)}</option>`).join('')}
            </select>
          </div>

          <button class="btn btn-primary btn-block btn-lg" data-action="owner-save-walkin">
            ${Icons.check} Create Walk-in Booking
          </button>
        </div>
      </div>
    `;
  },

  ownerSaveWalkin() {
    const phone = document.getElementById('walkin-phone')?.value?.trim();
    const name = document.getElementById('walkin-name')?.value?.trim();
    const serviceId = document.getElementById('walkin-service')?.value;
    const staffId = document.getElementById('walkin-staff')?.value;
    const slotVal = document.getElementById('walkin-slot')?.value;

    if (!phone || !Utils.isValidPhone(phone)) { UI.showToast('Enter valid phone number', 'error'); return; }
    if (!serviceId) { UI.showToast('Select a service', 'error'); return; }
    if (!slotVal) { UI.showToast('Select a time slot', 'error'); return; }

    const cleaned = Utils.cleanPhone(phone);
    let customer = Store.getWhere('customers', c => c.phone === cleaned)[0];
    if (!customer) {
      customer = {
        id: 'cust_' + Utils.generateId(),
        name: name || 'Walk-in Customer',
        phone: cleaned,
        email: '',
        gender: 'Male',
        createdAt: Utils.now(),
        lastVisitAt: null,
        totalVisits: 0,
        totalSpent: 0,
        communicationConsent: true,
        reminderOptOut: false,
        referralCode: Utils.generateReferralCode(name || 'WAL'),
        referredBy: null,
        walletBalance: { paid: 0, bonus: 0, total: 0 }
      };
      Store.add('customers', customer);
    }

    const svc = Store.getById('services', serviceId);
    const [slotStart, slotEnd] = slotVal.split('|');

    const result = BookingService.create({
      customerId: customer.id,
      staffId,
      services: [{ serviceId, price: svc.price, isAddOn: false }],
      date: Utils.today(),
      slot: { start: slotStart, end: slotEnd },
      totalAmount: svc.price,
      source: 'Walk-in'
    });

    if (!result.success) { UI.showToast(result.error, 'error'); return; }

    BookingService.updateStatus(result.booking.id, 'Confirmed');
    UI.showToast('Walk-in booking created!', 'success');
    this.navigate('o-bookings');
  },

  // ── Owner Customers ──
  renderOwnerCustomers() {
    const customers = Store.getAll('customers').sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return `
      <div class="screen active" id="screen-o-customers">
        <div class="search-bar mb-4">
          ${Icons.search}
          <input type="text" id="customer-search" class="input-field" placeholder="Search by name or phone..." oninput="App.filterCustomers(this.value)">
        </div>

        <div id="customer-list">
          ${customers.map(c => `
            <div class="list-item" data-action="owner-view-customer" data-id="${c.id}">
              ${UI.renderAvatar(c.name)}
              <div class="list-item-content">
                <div class="list-item-title">${c.name || 'Unnamed'}</div>
                <div class="list-item-subtitle">${c.phone} · ${c.totalVisits} visits</div>
              </div>
              <div class="list-item-trailing">
                <div class="font-medium text-sm">${Utils.formatCurrency(c.totalSpent)}</div>
                <div class="text-xs text-secondary">${c.lastVisitAt ? Utils.getRelativeDate(c.lastVisitAt.split('T')[0]) : 'Never'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  filterCustomers(query) {
    const q = query.toLowerCase();
    const customers = Store.getAll('customers')
      .filter(c => (c.name || '').toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    document.getElementById('customer-list').innerHTML = customers.map(c => `
      <div class="list-item" data-action="owner-view-customer" data-id="${c.id}">
        ${UI.renderAvatar(c.name)}
        <div class="list-item-content">
          <div class="list-item-title">${c.name || 'Unnamed'}</div>
          <div class="list-item-subtitle">${c.phone} · ${c.totalVisits} visits</div>
        </div>
        <div class="list-item-trailing">
          <div class="font-medium text-sm">${Utils.formatCurrency(c.totalSpent)}</div>
        </div>
      </div>
    `).join('');
  },

  renderOwnerCustomerDetail() {
    const id = this.currentParams?.id;
    const customer = Store.getById('customers', id);
    if (!customer) return '<div class="screen active"><p>Customer not found</p></div>';

    const visits = Store.getWhere('visits', v => v.customerId === id).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const txns = WalletService.getHistory(id);

    return `
      <div class="screen active" id="screen-o-customer-detail">
        <div class="flex items-center gap-4 mb-6">
          ${UI.renderAvatar(customer.name, 'lg')}
          <div>
            <h2>${customer.name || 'Unnamed'}</h2>
            <p class="text-secondary">+91 ${customer.phone}</p>
            <p class="text-sm text-secondary">Customer since ${Utils.formatDate(customer.createdAt)}</p>
          </div>
        </div>

        <div class="grid grid-3 gap-3 mb-6">
          <div class="kpi-card text-center">
            <div class="kpi-value">${customer.totalVisits}</div>
            <div class="kpi-label">Visits</div>
          </div>
          <div class="kpi-card text-center">
            <div class="kpi-value">${Utils.formatCurrency(customer.totalSpent)}</div>
            <div class="kpi-label">Spent</div>
          </div>
          <div class="kpi-card text-center">
            <div class="kpi-value" style="color:var(--color-accent)">${Utils.formatCurrency(customer.walletBalance?.total || 0)}</div>
            <div class="kpi-label">Wallet</div>
          </div>
        </div>

        <div class="flex gap-2 mb-4">
          <button class="btn btn-primary btn-sm flex-1" data-action="owner-wallet-adjust" data-id="${id}">${Icons.indianRupee} Wallet Adjust</button>
        </div>

        <h3 class="section-title">Visit History</h3>
        ${visits.length === 0 ? '<p class="text-sm text-secondary mb-4">No visits yet</p>' : ''}
        ${visits.slice(0, 5).map(v => `
          <div class="card mb-2">
            <div class="flex justify-between text-sm">
              <span>${Utils.formatDate(v.date)}</span>
              <span class="font-medium">${Utils.formatCurrency(v.totalPaid)}</span>
            </div>
            <div class="text-sm text-secondary">${v.services.map(s => s.name).join(', ')}</div>
          </div>
        `).join('')}

        <h3 class="section-title">Wallet Transactions</h3>
        ${txns.length === 0 ? '<p class="text-sm text-secondary">No transactions</p>' : ''}
        ${txns.slice(0, 5).map(txn => `
          <div class="txn-item">
            <div class="txn-icon ${txn.amount > 0 ? 'credit' : 'debit'}">${txn.amount > 0 ? Icons.arrowDownRight : Icons.arrowUpRight}</div>
            <div class="flex-1">
              <div class="text-sm font-medium">${txn.type}</div>
              <div class="text-xs text-tertiary">${Utils.formatDateTime(txn.createdAt)}</div>
              ${txn.reason ? `<div class="text-xs text-secondary">${txn.reason}</div>` : ''}
            </div>
            <div class="txn-amount ${txn.amount > 0 ? 'credit' : 'debit'}">${Utils.formatCurrencySign(txn.amount)}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  ownerWalletAdjust(customerId) {
    const html = `
      <div class="flex flex-col gap-4">
        <div class="input-group">
          <label class="input-label">Amount (₹)</label>
          <input type="number" id="adjust-amount" class="input-field" placeholder="Positive to add, negative to deduct">
        </div>
        <div class="input-group">
          <label class="input-label">Reason <span class="required">*</span></label>
          <input type="text" id="adjust-reason" class="input-field" placeholder="Reason is required">
        </div>
        <button class="btn btn-primary btn-block" onclick="App.confirmWalletAdjust('${customerId}')">Confirm Adjustment</button>
      </div>
    `;
    UI.showModal('Manual Wallet Adjustment', html);
  },

  confirmWalletAdjust(customerId) {
    const amount = parseFloat(document.getElementById('adjust-amount')?.value);
    const reason = document.getElementById('adjust-reason')?.value?.trim();

    if (isNaN(amount) || amount === 0) { UI.showToast('Enter a valid amount', 'error'); return; }
    const result = WalletService.manualAdjust(customerId, amount, reason);
    if (!result.success) { UI.showToast(result.error, 'error'); return; }

    UI.closeModal();
    UI.showToast('Wallet adjusted successfully', 'success');
    this.render();
  },

  // ── Owner More Menu ──
  renderOwnerMore() {
    const menuItems = [
      { id: 'o-services', icon: Icons.scissors, label: 'Services & Add-ons', subtitle: 'Manage services, prices, durations' },
      { id: 'o-staff', icon: Icons.users, label: 'Staff', subtitle: 'Manage barbers & working hours' },
      { id: 'o-wallet-mgr', icon: Icons.wallet, label: 'Wallet & Transactions', subtitle: 'View all wallet activity' },
      { id: 'o-reports', icon: Icons.barChart, label: 'Reports', subtitle: 'Performance, revenue, analytics' },
      { id: 'o-settings', icon: Icons.settings, label: 'Settings', subtitle: 'Wallet config, referrals, reminders' },
    ];

    return `
      <div class="screen active" id="screen-o-more">
        <div class="card">
          ${menuItems.map(item => `
            <div class="list-item" data-action="nav" data-screen="${item.id}">
              <div style="color:var(--color-primary)">${item.icon}</div>
              <div class="list-item-content">
                <div class="list-item-title">${item.label}</div>
                <div class="list-item-subtitle">${item.subtitle}</div>
              </div>
              <div>${Icons.arrowRight}</div>
            </div>
          `).join('')}
        </div>

        <div class="mt-6">
          <button class="btn btn-ghost btn-block" data-action="reset-data">${Icons.refreshCw} Reset Demo Data</button>
          <button class="btn btn-ghost btn-block text-error mt-2" data-action="logout">${Icons.logout} Logout</button>
        </div>
      </div>
    `;
  },

  // ── Owner Services ──
  renderOwnerServices() {
    const services = Store.getAll('services');
    const categories = [...new Set(services.map(s => s.category))];

    return `
      <div class="screen active" id="screen-o-services">
        ${categories.map(cat => `
          <h3 class="section-title">${cat}</h3>
          ${services.filter(s => s.category === cat).map(svc => `
            <div class="card mb-2">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium">${svc.name} ${svc.isAddOn ? '<span class="badge badge-accent">Add-on</span>' : ''}</div>
                  <div class="text-sm text-secondary">${svc.duration} min · ${svc.description || ''}</div>
                  ${svc.reminderDays > 0 ? `<div class="text-xs text-tertiary mt-1">Reminder: ${svc.reminderDays} days</div>` : ''}
                </div>
                <div class="text-right">
                  <div class="font-semibold text-primary">${Utils.formatCurrency(svc.price)}</div>
                  <span class="badge ${svc.isActive ? 'badge-success' : 'badge-neutral'} mt-1">${svc.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          `).join('')}
        `).join('')}
      </div>
    `;
  },

  // ── Owner Staff ──
  renderOwnerStaff() {
    const staff = Store.getAll('staff');

    return `
      <div class="screen active" id="screen-o-staff">
        ${staff.map(s => `
          <div class="card mb-3">
            <div class="flex items-center gap-3 mb-2">
              ${UI.renderAvatar(s.name)}
              <div class="flex-1">
                <div class="font-medium">${s.name}</div>
                <div class="text-sm text-secondary">${s.role} · ${s.specialization || ''}</div>
              </div>
              <span class="badge ${s.isActive ? 'badge-success' : 'badge-neutral'}">${s.isActive ? 'Active' : 'Off'}</span>
            </div>
            <div class="text-xs text-secondary">
              ${Object.entries(s.workingHours).map(([day, h]) =>
                `${day}: ${Utils.formatTime(h.start)}-${Utils.formatTime(h.end)}`
              ).join(' · ')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ── Owner Wallet Manager ──
  renderOwnerWalletMgr() {
    const allTxns = Store.getAll('walletTransactions')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalPaid = allTxns.filter(t => t.type === 'TopUp-Paid').reduce((s, t) => s + t.amount, 0);
    const totalBonus = allTxns.filter(t => t.type === 'TopUp-Bonus').reduce((s, t) => s + t.amount, 0);
    const totalDebited = Math.abs(allTxns.filter(t => t.type === 'Debit').reduce((s, t) => s + t.amount, 0));

    return `
      <div class="screen active" id="screen-o-wallet-mgr">
        <div class="grid grid-3 gap-3 mb-4">
          <div class="kpi-card text-center">
            <div class="kpi-label">Collected</div>
            <div class="kpi-value text-primary" style="font-size:var(--text-lg)">${Utils.formatCurrency(totalPaid)}</div>
          </div>
          <div class="kpi-card text-center">
            <div class="kpi-label">Bonus Given</div>
            <div class="kpi-value text-accent" style="font-size:var(--text-lg)">${Utils.formatCurrency(totalBonus)}</div>
          </div>
          <div class="kpi-card text-center">
            <div class="kpi-label">Debited</div>
            <div class="kpi-value text-error" style="font-size:var(--text-lg)">${Utils.formatCurrency(totalDebited)}</div>
          </div>
        </div>

        <h3 class="section-title">All Transactions</h3>
        ${allTxns.map(txn => {
          const customer = Store.getById('customers', txn.customerId);
          return `
            <div class="txn-item">
              <div class="txn-icon ${txn.amount > 0 ? 'credit' : 'debit'}">${txn.amount > 0 ? Icons.arrowDownRight : Icons.arrowUpRight}</div>
              <div class="flex-1">
                <div class="text-sm font-medium">${customer?.name || 'Unknown'}</div>
                <div class="text-xs text-secondary">${txn.type}${txn.reason ? ' — ' + txn.reason : ''}</div>
                <div class="text-xs text-tertiary">${Utils.formatDateTime(txn.createdAt)}</div>
              </div>
              <div class="txn-amount ${txn.amount > 0 ? 'credit' : 'debit'}">${Utils.formatCurrencySign(txn.amount)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ── Owner Reports ──
  reportTab: 'barbers',
  renderOwnerReports() {
    const reports = Automations.getReports();
    const tab = this.reportTab || 'barbers';

    return `
      <div class="screen active" id="screen-o-reports">
        <div class="tab-bar mb-4" style="overflow-x:auto">
          <div class="tab-item ${tab === 'barbers' ? 'active' : ''}" data-action="report-tab" data-tab="barbers">Barbers</div>
          <div class="tab-item ${tab === 'customers' ? 'active' : ''}" data-action="report-tab" data-tab="customers">Top Customers</div>
          <div class="tab-item ${tab === 'services' ? 'active' : ''}" data-action="report-tab" data-tab="services">Services</div>
          <div class="tab-item ${tab === 'referrals' ? 'active' : ''}" data-action="report-tab" data-tab="referrals">Referrals</div>
          <div class="tab-item ${tab === 'other' ? 'active' : ''}" data-action="report-tab" data-tab="other">Other</div>
        </div>

        ${tab === 'barbers' ? `
          <h3 class="mb-3">Barber Performance</h3>
          ${reports.barberPerf.map(b => {
            const maxRevenue = Math.max(...reports.barberPerf.map(bp => bp.revenue), 1);
            return `
              <div class="card mb-3">
                <div class="flex justify-between items-center mb-2">
                  <div class="font-medium">${b.name}</div>
                  <div class="text-sm font-semibold text-primary">${Utils.formatCurrency(b.revenue)}</div>
                </div>
                <div class="report-bar-track">
                  <div class="report-bar-fill" style="width:${(b.revenue / maxRevenue) * 100}%"></div>
                </div>
                <div class="flex justify-between text-xs text-secondary mt-2">
                  <span>${b.visits} visits</span>
                  <span>Avg ${Utils.formatCurrency(b.avgBill)}/visit</span>
                </div>
              </div>
            `;
          }).join('')}
        ` : ''}

        ${tab === 'customers' ? `
          <h3 class="mb-3">Top Customers</h3>
          ${reports.topCustomers.map((c, i) => `
            <div class="list-item">
              <div class="avatar avatar-sm" style="background:${i === 0 ? 'var(--color-accent)' : 'var(--color-primary)'}">${i + 1}</div>
              <div class="list-item-content">
                <div class="list-item-title">${c.name}</div>
                <div class="list-item-subtitle">${c.totalVisits} visits · Last: ${c.lastVisitAt ? Utils.formatDateShort(c.lastVisitAt) : 'Never'}</div>
              </div>
              <div class="font-semibold">${Utils.formatCurrency(c.totalSpent)}</div>
            </div>
          `).join('')}
        ` : ''}

        ${tab === 'services' ? `
          <h3 class="mb-3">Popular Services</h3>
          ${reports.popularServices.map(s => {
            const maxCount = Math.max(...reports.popularServices.map(sp => sp.count), 1);
            return `
              <div class="card mb-2">
                <div class="flex justify-between mb-1">
                  <span class="font-medium">${s.name}</span>
                  <span class="text-sm">${s.count} bookings</span>
                </div>
                <div class="report-bar-track">
                  <div class="report-bar-fill" style="width:${(s.count / maxCount) * 100}%;background:var(--color-accent)"></div>
                </div>
                <div class="text-xs text-secondary text-right mt-1">Revenue: ${Utils.formatCurrency(s.revenue)}</div>
              </div>
            `;
          }).join('')}
          <div class="card mt-4" style="background:var(--color-accent-bg)">
            <div class="flex justify-between">
              <span class="font-medium">Add-on Revenue</span>
              <span class="font-bold text-accent-dark">${Utils.formatCurrency(reports.addonRevenue)}</span>
            </div>
          </div>
        ` : ''}

        ${tab === 'referrals' ? `
          <h3 class="mb-3">Referral Stats</h3>
          <div class="grid grid-2 gap-3 mb-4">
            <div class="kpi-card text-center">
              <div class="kpi-value text-success">${reports.completedReferrals}</div>
              <div class="kpi-label">Completed</div>
            </div>
            <div class="kpi-card text-center">
              <div class="kpi-value text-warning">${reports.pendingReferrals}</div>
              <div class="kpi-label">Pending</div>
            </div>
          </div>
        ` : ''}

        ${tab === 'other' ? `
          <div class="grid grid-2 gap-3 mb-4">
            <div class="kpi-card text-center">
              <div class="kpi-value text-error">${reports.cancellations}</div>
              <div class="kpi-label">Cancellations</div>
            </div>
            <div class="kpi-card text-center">
              <div class="kpi-value" style="color:var(--color-status-noshow)">${reports.noShows}</div>
              <div class="kpi-label">No-shows</div>
            </div>
            <div class="kpi-card text-center">
              <div class="kpi-value text-primary">${reports.dueReminders}</div>
              <div class="kpi-label">Due Reminders</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // ── Owner Settings ──
  renderOwnerSettings() {
    const settings = Store.getSettings();

    return `
      <div class="screen active" id="screen-o-settings">
        <!-- Salon Info -->
        <h3 class="section-title" style="margin-top:0">Salon Info</h3>
        <div class="card mb-4">
          <div class="font-medium">${settings.salonName}</div>
          <div class="text-sm text-secondary">${settings.address}</div>
          <div class="text-sm text-secondary mt-1">${settings.workingDays.join(', ')} · ${Utils.formatTime(settings.workingHours.start)} – ${Utils.formatTime(settings.workingHours.end)}</div>
        </div>

        <!-- Wallet Config -->
        <h3 class="section-title">Wallet Configuration</h3>
        <div class="card mb-4">
          <div class="flex justify-between items-center mb-3">
            <span class="font-medium">Wallet Enabled</span>
            <span class="badge ${settings.wallet.enabled ? 'badge-success' : 'badge-neutral'}">${settings.wallet.enabled ? 'Yes' : 'No'}</span>
          </div>
          <div class="text-sm text-secondary mb-2"><strong>Top-up Slabs:</strong></div>
          ${settings.wallet.topUpSlabs.map(s => `
            <div class="flex justify-between text-sm py-1">
              <span>Pay ${Utils.formatCurrency(s.pay)}</span>
              <span class="text-success font-medium">+ ${Utils.formatCurrency(s.bonus)} bonus</span>
            </div>
          `).join('')}
          <div class="divider"></div>
          <div class="flex justify-between text-sm">
            <span>Credit Expiry</span>
            <span>${settings.wallet.expiryDays} days</span>
          </div>
        </div>

        <!-- Referral Config -->
        <h3 class="section-title">Referral Configuration</h3>
        <div class="card mb-4">
          <div class="flex justify-between text-sm py-1">
            <span>Referrer Reward</span>
            <span class="font-medium">${Utils.formatCurrency(settings.referral.referrerReward)} credit</span>
          </div>
          <div class="flex justify-between text-sm py-1">
            <span>Referee Discount</span>
            <span class="font-medium">${Utils.formatCurrency(settings.referral.refereeDiscount)} off</span>
          </div>
          <div class="flex justify-between text-sm py-1">
            <span>Expiry</span>
            <span>${settings.referral.expiryDays} days</span>
          </div>
        </div>

        <!-- Reminder Config -->
        <h3 class="section-title">Reminder Configuration</h3>
        <div class="card mb-4">
          <div class="flex justify-between text-sm py-1">
            <span>Default Cycle</span>
            <span class="font-medium">${settings.reminder.defaultCycleDays} days</span>
          </div>
          <div class="flex justify-between text-sm py-1">
            <span>Send Before</span>
            <span>${settings.reminder.sendBeforeDays} days</span>
          </div>
        </div>
      </div>
    `;
  }
};

// ── Initialize on DOM ready ──
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
