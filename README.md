# Salon App — Royal Cuts 💈

A mobile-first Web Application prototype built for local Indian neighbourhood salons. Designed to turn one-time walk-in customers into repeat customers, boost average bill value with relevant add-ons, manage store-credit wallets, generate trackable referrals, and provide the owner with a real-time business dashboard.

---

## 🌟 Key Features

### 👤 Customer App
- **Phone Lookup Login**: Quick access with mobile number.
- **My Salon Wallet**: Separate Paid Credit & Bonus Credit ledger (e.g. Pay ₹500, get ₹50 Bonus = ₹550 Total Balance).
- **4-Step Booking Wizard**: Service selection, optional non-preselected add-ons (Beard Trim +₹99, Head Massage +₹199), barber selection, date strip, and time slot selection.
- **Smart Reminders**: Automated service reminders (25 days for haircut) with one-tap booking and opt-out preferences.
- **Refer & Earn**: Unique referral codes (`RAH7K2M`) with ₹100 credit rewards released upon referee's first completed visit.
- **Visit History**: Transparent timeline of past visits and service breakdowns.

### 💈 Salon Owner / Manager Dashboard
- **Numerical Dashboard**: Today's Revenue, Completed Bookings, Average Bill Value, Repeat vs. New Customers, Wallet Credit Collected, Outstanding Balance, and Add-on Revenue.
- **Bookings Manager**: Filter Today/Upcoming/Past with status management (Pending, Confirmed, Completed, Cancelled, No-show).
- **Walk-in Booking**: Fast walk-in booking creation for new or existing customers.
- **Customer Directory**: Search customers, view visit histories, and perform manual wallet adjustments with mandatory reason logging.
- **Reports & Analytics**: Barber performance, Top 5 Customers, Popular Services, Add-on revenue, Referral tracking, and Cancellation logs.
- **Configurable Settings**: Wallet slabs, bonus percentages, credit expiry, referral rewards, and reminder cycles.

---

## 🚀 Live Deployment & Setup

### Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Go to your repository **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Choose `main` branch and `/ (root)` folder, then click **Save**.
5. Your app will be live at `https://<username>.github.io/salonplus/`!

---

## 📁 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox, Grid), JavaScript (ES6+)
- **Storage**: In-memory store with `localStorage` persistence
- **Icons**: Lucide Inline SVG icons
- **Fonts**: Google Fonts (`Inter` & `DM Sans`)
