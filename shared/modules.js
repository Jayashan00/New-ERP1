// =====================================================================
//  MODULES & NAVIGATION
//  Each module groups menu entries. An entry is either a data screen
//  (entity) or a purpose-built page (page). Permission keys:
//    entity screens -> the entity key   |   pages -> "page:<key>"
// =====================================================================

const en = (entity, label) => ({ type: 'entity', entity, label });
const pg = (page, label, icon) => ({ type: 'page', page, label, icon });

export const MODULES = [
  {
    key: 'overview', label: 'Overview', icon: 'LayoutDashboard', always: true,
    items: [pg('dashboard', 'Dashboard', 'LayoutDashboard'), pg('calendar', 'Calendar', 'CalendarDays'), pg('messenger', 'Team messages', 'MessagesSquare'), pg('reports', 'Reports centre', 'BarChart3')],
  },
  {
    key: 'me', label: 'My space', icon: 'UserCircle', always: true,
    items: [pg('my-attendance', 'My attendance', 'Clock'), pg('my-leaves', 'My leave', 'Plane'), pg('my-payslips', 'My payslips', 'Wallet'), pg('my-bookings', 'My stays', 'BedDouble'), pg('my-orders', 'My orders & points', 'ShoppingBag')],
  },
  {
    key: 'hotel', label: 'Front office', icon: 'ConciergeBell',
    items: [
      pg('front-desk', 'Front desk', 'ConciergeBell'), pg('room-chart', 'Room chart', 'CalendarRange'), pg('new-booking', 'New booking / walk-in', 'CalendarPlus'),
      en('reservations', 'Reservations'), en('customers', 'Guests'), pg('guest-billing', 'Guest billing & invoices', 'Receipt'),
      en('folio_charges', 'Room bill charges'), en('folio_payments', 'Guest payments'), en('registration_cards', 'Registration cards'),
      pg('night-audit', 'Night audit', 'MoonStar'), en('night_audits', 'Night audit history'),
    ],
  },
  {
    key: 'distribution', label: 'Online & channels', icon: 'Globe', needs: 'hotel',
    items: [pg('booking-engine', 'Website booking engine', 'Globe'), pg('channel-manager', 'Channel manager', 'Share2'), en('channels', 'Connected channels (OTAs)'), en('channel_sync_logs', 'Channel sync log'), en('travel_agents', 'Travel agents & corporate'), en('rate_plans', 'Rate plans & seasons'), en('meal_plans', 'Meal plans & packages')],
  },
  {
    key: 'rooms', label: 'Rooms & housekeeping', icon: 'BedDouble', needs: 'hotel',
    items: [pg('housekeeping-board', 'Housekeeping board', 'Sparkles'), en('rooms', 'Rooms'), en('room_types', 'Room types'), pg('room-qr', 'Room QR codes', 'QrCode'), en('housekeeping', 'Housekeeping tasks'), en('maintenance', 'Maintenance & repairs'), en('laundry', 'Laundry'), en('minibar_items', 'Minibar'), en('lost_found', 'Lost & found')],
  },
  {
    key: 'guestservices', label: 'Guest services', icon: 'Car', needs: 'hotel',
    items: [en('guest_requests', 'Guest requests'), en('transport_bookings', 'Taxi & transfers'), en('transport_vendors', 'Drivers & taxi partners'), pg('parking', 'Parking', 'ParkingSquare'), en('parking_slots', 'Parking slots'), en('parking_logs', 'Parking log'), en('extra_services', 'Spa, tours & extras'), en('service_calls', 'Table & room calls')],
  },
  {
    key: 'restaurant', label: 'Restaurant', icon: 'UtensilsCrossed',
    items: [
      pg('restaurant-pos', 'Restaurant POS', 'MonitorSmartphone'), pg('floor-plan', 'Tables — 3D floor', 'LayoutGrid'), pg('service-board', 'Waiter service board', 'BellRing'), pg('kitchen-display', 'Kitchen display (KDS)', 'ChefHat'),
      en('restaurant_orders', 'Orders'), en('kots', 'KOT history'), en('table_reservations', 'Table bookings'), en('waitlist', 'Waitlist'),
      en('menu_items', 'Menu items'), en('menu_categories', 'Menu categories'), en('modifiers', 'Modifiers'), en('combos', 'Set menus & combos'),
      en('recipes', 'Recipes & food cost'), en('ingredients', 'Kitchen stock'), en('bar_stock', 'Bar stock'), en('tables', 'Tables'), en('areas', 'Dining areas'),
      en('riders', 'Delivery riders'), en('aggregators', 'Delivery apps'), pg('qr-codes', 'Table QR codes', 'QrCode'), pg('restaurant-reports', 'Restaurant reports', 'PieChart'),
    ],
  },
  {
    key: 'customers', label: 'Loyalty & feedback', icon: 'HeartHandshake', requires: ['hotel', 'restaurant'],
    items: [en('loyalty_tiers', 'Loyalty program'), en('gift_cards', 'Gift vouchers'), en('promotions', 'Offers & discounts'), en('feedback', 'Guest feedback'), en('campaigns', 'SMS & email campaigns')],
  },
  {
    key: 'purchase', label: 'Purchasing & stores', icon: 'Truck',
    items: [en('vendors', 'Suppliers'), en('purchase_orders', 'Purchase orders'), en('grns', 'Goods received (GRN)'), en('purchase_invoices', 'Supplier bills'), en('purchase_returns', 'Returns to suppliers'), en('items', 'Store items & supplies'), en('warehouses', 'Stores'), en('transfers', 'Store transfers'), pg('stock-levels', 'Stock levels & alerts', 'PackageSearch')],
  },
  {
    key: 'accounting', label: 'Accounts & finance', icon: 'Landmark',
    items: [
      pg('accounting-dashboard', 'Finance overview', 'TrendingUp'), en('revenues', 'Other income'), en('expenses', 'Expenses'), en('vendor_payments', 'Supplier payments'),
      en('bank_accounts', 'Bank & cash accounts'), en('bank_transactions', 'Bank transactions'), en('bank_transfers_internal', 'Bank transfers'), en('accounts', 'Chart of accounts'), en('journal_entries', 'Journal entries'),
      pg('profit-loss', 'Profit & loss', 'TrendingUp'), pg('balance-sheet', 'Balance sheet', 'FileSpreadsheet'), pg('trial-balance', 'Trial balance', 'Scale'), pg('ledger', 'Ledger', 'BookOpen'), pg('tax-report', 'Tax report (VAT)', 'Percent'),
      en('budgets', 'Budgets'), pg('budget-monitor', 'Budget monitoring', 'Gauge'),
    ],
  },
  {
    key: 'hrm', label: 'HR & payroll', icon: 'Users',
    items: [
      pg('hrm-dashboard', 'HR overview', 'Users'), en('employees', 'Staff'), en('departments', 'Departments'), en('designations', 'Job titles'),
      en('attendance', 'Attendance'), en('shifts', 'Shifts'), en('rosters', 'Duty roster'), en('leave_applications', 'Leave requests'), pg('leave-balance', 'Leave balance', 'CalendarCheck'), en('leave_types', 'Leave types'),
      pg('run-payroll', 'Run payroll', 'Banknote'), en('payslips', 'Payslips'), en('salary_components', 'Allowances & deductions'),
      en('holidays', 'Holidays'), en('announcements', 'Announcements'), en('events', 'Staff events'), en('documents', 'HR documents'),
      en('trainings', 'Training'), en('trainers', 'Trainers'), en('reviews', 'Performance reviews'), en('awards', 'Awards'), en('warnings', 'Warnings'), en('resignations', 'Resignations'),
      en('jobs', 'Job vacancies'), en('candidates', 'Job applicants'),
    ],
  },
  {
    key: 'admin', label: 'Administration', icon: 'Settings', always: true,
    items: [
      pg('users', 'Users & logins', 'UserCog'), pg('roles', 'Roles & permissions', 'ShieldCheck'), pg('settings', 'Hotel settings', 'Settings'), pg('website', 'Website & photos', 'Image'),
      pg('payment-gateways', 'Payment gateways', 'CreditCard'), pg('integrations', 'Integrations', 'Plug'), en('taxes', 'Taxes'), en('payment_methods', 'Payment methods'), en('printers', 'Printers'),
      en('audit_log', 'Activity log'), en('login_history', 'Login history'),
    ],
  },
];

export const BUSINESS_MODULE_KEYS = ['hotel', 'restaurant', 'purchase', 'inventory', 'accounting', 'hrm', 'recruitment'];

export const permKeyOf = (item) => (item.type === 'entity' ? item.entity : 'page:' + item.page);
export const pathOf = (item) => (item.type === 'entity' ? '/app/e/' + item.entity : '/app/' + item.page);

// module for an entity or page key
export const MODULE_OF = {};
for (const m of MODULES) for (const it of m.items) MODULE_OF[permKeyOf(it)] = m.key;

export const PAYMENT_GATEWAYS = ['PayHere', 'Stripe', 'PayPal', 'Sampath Bank IPG', 'Commercial Bank IPG', 'HNB IPG', 'LankaQR', 'Visa / Mastercard POS terminal', 'Amex', 'Bank transfer'];
export const INTEGRATIONS = [
  { key: 'slack', name: 'Slack', desc: 'Post alerts (new booking, low stock, big sale) into a Slack channel.', fields: ['Webhook URL'] },
  { key: 'telegram', name: 'Telegram', desc: 'Send the same alerts to a Telegram group.', fields: ['Bot token', 'Chat ID'] },
  { key: 'twilio', name: 'Twilio SMS & WhatsApp', desc: 'Booking confirmations, OTPs and campaign messages by SMS/WhatsApp.', fields: ['Account SID', 'Auth token', 'From number'] },
  { key: 'zoom', name: 'Zoom', desc: 'Create meeting links automatically from the Zoom meetings screen.', fields: ['Account ID', 'Client ID', 'Client secret'] },
  { key: 'webhook', name: 'Webhooks', desc: 'Send events (order paid, guest checked in…) to your own systems.', fields: ['Endpoint URL', 'Secret'] },
  { key: 'recaptcha', name: 'Google reCAPTCHA', desc: 'Stop spam on login, booking and contact forms.', fields: ['Site key', 'Secret key'] },
  { key: 'ai', name: 'AI assistant', desc: 'Write descriptions, replies and summaries with AI.', fields: ['API key', 'Model'] },
  { key: 'google_calendar', name: 'Google Calendar', desc: 'Sync bookings, meetings and leave to Google Calendar.', fields: ['Client ID', 'Client secret'] },
  { key: 'mailchimp', name: 'Mailchimp', desc: 'Sync customers to your Mailchimp audience.', fields: ['API key', 'Audience ID'] },
  { key: 'pusher', name: 'Pusher (real-time)', desc: 'Live updates for KDS, messages and notifications.', fields: ['App ID', 'Key', 'Secret', 'Cluster'] },
  { key: 's3', name: 'Amazon S3 storage', desc: 'Store uploaded files on S3 instead of the server.', fields: ['Key', 'Secret', 'Bucket', 'Region'] },
  { key: 'smtp', name: 'Email (SMTP)', desc: 'Send invoices, confirmations and payslips by email.', fields: ['Host', 'Port', 'Username', 'Password', 'From address'] },
];
