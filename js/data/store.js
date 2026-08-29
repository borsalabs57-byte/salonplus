// ============================================
// SALON APP — DATA STORE
// In-memory store with localStorage persistence
// ============================================

const Store = {
  _data: {},
  _listeners: {},
  STORAGE_KEY: 'salon_app_data',

  // Initialize store with seed data or from localStorage
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this._data = JSON.parse(saved);
        console.log('📦 Store loaded from localStorage');
      } catch (e) {
        console.warn('⚠️ Failed to parse saved data, using seed');
        this._loadSeed();
      }
    } else {
      this._loadSeed();
    }
  },

  _loadSeed() {
    this._data = {
      settings: Utils.clone(SeedData.settings),
      staff: Utils.clone(SeedData.staff),
      services: Utils.clone(SeedData.services),
      customers: Utils.clone(SeedData.customers),
      bookings: Utils.clone(SeedData.bookings),
      visits: Utils.clone(SeedData.visits),
      walletTransactions: Utils.clone(SeedData.walletTransactions),
      referrals: Utils.clone(SeedData.referrals),
      reminders: Utils.clone(SeedData.reminders),
      currentUser: null,
      currentRole: null // 'customer' | 'owner'
    };
    this._save();
    console.log('🌱 Store initialized with seed data');
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._loadSeed();
    this._notifyAll();
  },

  _save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('⚠️ Failed to save to localStorage');
    }
  },

  // ── Generic CRUD ──
  getAll(collection) {
    return this._data[collection] || [];
  },

  getById(collection, id) {
    return (this._data[collection] || []).find(item => item.id === id);
  },

  getWhere(collection, predicate) {
    return (this._data[collection] || []).filter(predicate);
  },

  add(collection, item) {
    if (!this._data[collection]) this._data[collection] = [];
    this._data[collection].push(item);
    this._save();
    this._notify(collection);
    return item;
  },

  update(collection, id, updates) {
    const items = this._data[collection] || [];
    const idx = items.findIndex(item => item.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    this._save();
    this._notify(collection);
    return items[idx];
  },

  remove(collection, id) {
    const items = this._data[collection] || [];
    this._data[collection] = items.filter(item => item.id !== id);
    this._save();
    this._notify(collection);
  },

  // ── Settings ──
  getSettings() {
    return this._data.settings;
  },

  updateSettings(updates) {
    this._data.settings = { ...this._data.settings, ...updates };
    this._save();
    this._notify('settings');
    return this._data.settings;
  },

  // ── Session ──
  setCurrentUser(userId, role) {
    this._data.currentUser = userId;
    this._data.currentRole = role;
    this._save();
  },

  getCurrentUser() {
    if (!this._data.currentUser) return null;
    return this.getById('customers', this._data.currentUser);
  },

  getCurrentRole() {
    return this._data.currentRole;
  },

  isOwner() {
    return this._data.currentRole === 'owner';
  },

  logout() {
    this._data.currentUser = null;
    this._data.currentRole = null;
    this._save();
  },

  // ── Listeners (simple pub/sub) ──
  on(collection, callback) {
    if (!this._listeners[collection]) this._listeners[collection] = [];
    this._listeners[collection].push(callback);
    return () => {
      this._listeners[collection] = this._listeners[collection].filter(cb => cb !== callback);
    };
  },

  _notify(collection) {
    (this._listeners[collection] || []).forEach(cb => cb(this._data[collection]));
  },

  _notifyAll() {
    Object.keys(this._listeners).forEach(col => this._notify(col));
  }
};
