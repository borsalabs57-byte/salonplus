// ============================================
// SALON APP — UTILITY FUNCTIONS
// Date helpers, currency formatting, validators
// ============================================

const Utils = {
  // ── ID Generation ──
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // ── Date Helpers ──
  today() {
    return new Date().toISOString().split('T')[0];
  },

  now() {
    return new Date().toISOString();
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatDateShort(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  },

  formatDateTime(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  },

  getRelativeDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    if (diff > 0 && diff <= 7) return `In ${diff} days`;
    if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`;
    return Utils.formatDate(dateStr);
  },

  addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  getDayName(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });
  },

  getMonthName(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short' });
  },

  getDayNum(dateStr) {
    return new Date(dateStr).getDate();
  },

  // Generate next N dates from today
  getNextDates(count = 14) {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  },

  // Generate time slots
  generateSlots(startTime = '09:00', endTime = '21:00', durationMin = 30) {
    const slots = [];
    let [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    while (sh < eh || (sh === eh && sm < em)) {
      const start = `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
      sm += durationMin;
      if (sm >= 60) { sh += Math.floor(sm / 60); sm = sm % 60; }
      const end = `${sh.toString().padStart(2, '0')}:${sm.toString().padStart(2, '0')}`;
      if (sh < eh || (sh === eh && sm <= em)) {
        slots.push({ start, end });
      }
    }
    return slots;
  },

  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  },

  isPast(dateStr) {
    return new Date(dateStr) < new Date(Utils.today());
  },

  // ── Currency ──
  formatCurrency(amount) {
    if (amount == null || isNaN(amount)) return '₹0';
    return '₹' + Math.abs(amount).toLocaleString('en-IN');
  },

  formatCurrencySign(amount) {
    if (amount == null || isNaN(amount)) return '₹0';
    const sign = amount >= 0 ? '+' : '-';
    return sign + '₹' + Math.abs(amount).toLocaleString('en-IN');
  },

  // ── Validators ──
  isValidPhone(phone) {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
  },

  cleanPhone(phone) {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91')) cleaned = cleaned.substring(3);
    return cleaned;
  },

  isValidName(name) {
    return name && name.trim().length >= 2;
  },

  // ── String Helpers ──
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  },

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  truncate(str, len = 30) {
    if (!str || str.length <= len) return str;
    return str.substring(0, len) + '…';
  },

  // ── Referral Code ──
  generateReferralCode(name) {
    const prefix = name.substring(0, 3).toUpperCase();
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  },

  // ── Status Badge Class ──
  getStatusBadgeClass(status) {
    const map = {
      'Pending': 'badge-warning',
      'Confirmed': 'badge-primary',
      'Completed': 'badge-success',
      'Cancelled': 'badge-error',
      'No-show': 'badge-purple',
      'Scheduled': 'badge-primary',
      'Sent': 'badge-accent',
      'Booked': 'badge-success',
      'Dismissed': 'badge-neutral',
      'OptedOut': 'badge-neutral',
      'Expired': 'badge-neutral'
    };
    return map[status] || 'badge-neutral';
  },

  // ── Debounce ──
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  },

  // ── Deep clone ──
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
};
