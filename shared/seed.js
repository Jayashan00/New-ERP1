// =====================================================================
//  DEMO DATA — deterministic, relative to "today", so dashboards look
//  alive whenever the client opens the demo.
// =====================================================================
import { ENTITIES } from './entities.js';
import { DEFAULT_ROLES, DEMO_USERS, DEMO_PASSWORD } from './roles.js';
import { PAYMENT_GATEWAYS, INTEGRATIONS } from './modules.js';

let seed = 42;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const ri = (a, b) => Math.floor(rnd() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pickN = (arr, n) => { const c = [...arr]; const out = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]); return out; };
let idc = 1000;
const nid = () => 'r' + (idc++).toString(36);

const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOff = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const dateOff = (n) => iso(dayOff(n));
const dtOff = (n, h = ri(8, 21), m = ri(0, 59)) => `${dateOff(n)}T${pad(h)}:${pad(m)}`;
const monthName = (offset) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toLocaleString('en', { month: 'long', year: 'numeric' }); };

const FIRST = ['Nimal', 'Kamal', 'Sunil', 'Priya', 'Anjali', 'Ruwan', 'Sanduni', 'Tharindu', 'Dilshan', 'Kavindi', 'Hasitha', 'Nethmi', 'Ahmed', 'Fathima', 'John', 'Sarah', 'Michael', 'Olivia', 'Liam', 'Sophie', 'Raj', 'Meera', 'Chen', 'Yuki', 'Lucas', 'Hannah', 'Mohamed', 'Isuru', 'Gayan', 'Ruvini'];
const LAST = ['Perera', 'Silva', 'Fernando', 'Jayasuriya', 'Wijesinghe', 'Bandara', 'Kumara', 'Rathnayake', 'Hameed', 'Smith', 'Brown', 'Wilson', 'Taylor', 'Müller', 'Sharma', 'Patel', 'Wang', 'Tanaka', 'Dubois', 'Rossi', 'Karunaratne', 'Ekanayake'];
const person = () => `${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `+94 7${ri(0, 8)} ${ri(100, 999)} ${ri(1000, 9999)}`;
const COMPANIES = ['Ceylon Traders', 'Blue Ocean Tours', 'Serendib Foods', 'Kandy Spice Co.', 'Island Fresh Supplies', 'Lanka Linen', 'Pearl Beverages', 'Galle Fort Tours', 'Asia Pacific Travels', 'Colombo Office Mart', 'Royal Dairy', 'Green Leaf Organics', 'Sunrise Electricals', 'TechNova Solutions', 'Hill Country Tea'];

// ------------------------------------------------ curated catalogues
const CURATED = {
  room_types: [
    { name: 'Deluxe Double — Garden View', base_rate: 16500, max_adults: 2, max_children: 1, bed: 'Double', size: 300, amenities: ['AC', 'Wi-Fi', 'TV', 'Hair dryer'] },
    { name: 'Superior King — Pool View', base_rate: 21500, max_adults: 2, max_children: 2, bed: 'King', size: 360, amenities: ['AC', 'Wi-Fi', 'TV', 'Minibar', 'Balcony'] },
    { name: 'Deluxe Triple', base_rate: 24000, max_adults: 3, max_children: 1, bed: 'Twin', size: 380, amenities: ['AC', 'Wi-Fi', 'TV', 'Minibar', 'Safe'] },
    { name: 'Family Suite', base_rate: 32000, max_adults: 4, max_children: 2, bed: 'King', size: 520, amenities: ['AC', 'Wi-Fi', 'TV', 'Minibar', 'Balcony', 'Safe', 'Bathtub'] },
    { name: 'Ayu Signature Suite (four-poster)', base_rate: 45000, max_adults: 2, max_children: 2, bed: 'King', size: 650, amenities: ['AC', 'Wi-Fi', 'TV', 'Minibar', 'Balcony', 'Bathtub', 'Safe', 'Hair dryer'] },
  ],
  meal_plans: [
    { code: 'RO', name: 'Room only', price_per_person: 0, includes: 'Accommodation only' },
    { code: 'BB', name: 'Bed & breakfast', price_per_person: 2500, includes: 'Buffet breakfast' },
    { code: 'HB', name: 'Half board', price_per_person: 6000, includes: 'Breakfast and dinner' },
    { code: 'FB', name: 'Full board', price_per_person: 9000, includes: 'Breakfast, lunch and dinner' },
    { code: 'AI', name: 'All inclusive', price_per_person: 15000, includes: 'All meals, snacks and selected drinks' },
  ],
  extra_services: [
    { name: 'Airport transfer — Colombo (BIA)', category: 'Transport', price: 18500, unit: 'trip' }, { name: 'Ayurvedic full-body massage (60 min)', category: 'Spa', price: 9500, unit: 'person' },
    { name: 'Temple of the Tooth evening visit', category: 'Tour', price: 4500, unit: 'person' }, { name: 'Kandyan cultural dance show tickets', category: 'Activity', price: 3500, unit: 'person' },
    { name: 'Peradeniya Botanical Gardens tour', category: 'Tour', price: 6500, unit: 'person' }, { name: 'Tea estate & factory day tour', category: 'Tour', price: 14500, unit: 'person' },
    { name: 'Candle-light poolside dinner for two', category: 'Dining', price: 22000, unit: 'item' }, { name: 'Herbal steam bath', category: 'Spa', price: 4000, unit: 'person' },
  ],
  minibar_items: [{ name: 'Mineral water 500ml', price: 300 }, { name: 'Coca-Cola can', price: 450 }, { name: 'Lion lager', price: 950 }, { name: 'Cashew nuts', price: 1200 }, { name: 'Chocolate bar', price: 650 }, { name: 'Orange juice', price: 550 }],
  menu_categories: [
    { name: 'Starters', icon: '🥗', order: 1, station: 'Cold kitchen' }, { name: 'Rice & curry', icon: '🍛', order: 2, station: 'Hot kitchen' },
    { name: 'Kottu & noodles', icon: '🍜', order: 3, station: 'Hot kitchen' }, { name: 'Grill & seafood', icon: '🦐', order: 4, station: 'Grill' },
    { name: 'Irish & western', icon: '🍀', order: 5, station: 'Hot kitchen' }, { name: 'Desserts', icon: '🍨', order: 6, station: 'Bakery' },
    { name: 'Hot drinks', icon: '☕', order: 7, station: 'Bar' }, { name: 'Juices & mocktails', icon: '🥤', order: 8, station: 'Bar' }, { name: 'Beer & cocktails', icon: '🍹', order: 9, station: 'Bar' },
  ],
  menu_items: [
    ['Devilled chicken', 0, 1650, '🍗'], ['Garden salad with passion dressing', 0, 1250, '🥗', true], ['Hot butter cuttlefish', 0, 1950, '🦑'], ['Vegetable spring rolls', 0, 950, '🥟', true],
    ['Kandyan chicken rice & curry', 1, 1450, '🍛'], ['Fish ambul thiyal with rice', 1, 1650, '🍛'], ['Vegetable rice & curry (7 curries)', 1, 1150, '🍛', true], ['Egg hoppers with lunu miris (3)', 1, 850, '🥞', true], ['String hoppers with kiri hodi', 1, 950, '🍜', true], ['Lamprais', 1, 1850, '🍱'],
    ['Chicken kottu', 2, 1350, '🍜'], ['Cheese kottu', 2, 1550, '🧀'], ['Seafood fried rice', 2, 1850, '🍚'],
    ['Grilled tiger prawns', 3, 4200, '🦐'], ['Seer fish steak with lemon butter', 3, 3600, '🐟'], ['Lagoon crab curry', 3, 4800, '🦀'], ['Seafood platter for two', 3, 8900, '🦞'], ['Calamari rings', 3, 2400, '🦑'],
    ['Irish beef stew with soda bread', 4, 2950, '🍀'], ['Beef & Guinness pie', 4, 3200, '🥧'], ['Fish & chips', 4, 2600, '🐟'], ['Full Irish breakfast', 4, 2800, '🍳'], ['Shepherd’s pie', 4, 2700, '🥘'], ['Club sandwich', 4, 1900, '🥪'],
    ['Watalappan', 5, 750, '🍮', true], ['Chocolate biscuit pudding', 5, 850, '🍫', true], ['Fruit salad with ice cream', 5, 850, '🍨', true], ['Kithul treacle & curd', 5, 900, '🍯', true],
    ['Ceylon tea (pot)', 6, 450, '🍵', true], ['Cappuccino', 6, 750, '☕', true], ['Irish coffee', 6, 1650, '☕'],
    ['King coconut', 7, 450, '🥥', true], ['Fresh lime juice', 7, 500, '🍋', true], ['Mango lassi', 7, 850, '🥭', true], ['Virgin mojito', 7, 950, '🍹', true],
    ['Lion lager', 8, 1100, '🍺'], ['Guinness stout', 8, 1450, '🍺'], ['Arrack sour', 8, 1450, '🍸'], ['Pina colada', 8, 1650, '🍹'],
  ],
  modifiers: [{ name: 'Spice level', options: 'Mild, Medium, Hot, Extra hot', price: 0, required: true }, { name: 'Extra cheese', options: 'Yes', price: 300 }, { name: 'Add egg', options: 'Fried, Boiled', price: 150 }, { name: 'Sugar', options: 'No sugar, Less sugar, Normal', price: 0 }, { name: 'Size', options: 'Regular, Large', price: 400 }],
  areas: [{ name: 'Main dining hall', service_charge: 10 }, { name: 'Garden terrace', service_charge: 10 }, { name: 'Poolside', service_charge: 10 }, { name: 'Bar & lounge', service_charge: 10 }],
  ingredients: [['Basmati rice', 'kg', 120, 20, 650], ['Chicken', 'kg', 45, 10, 1450], ['Prawns', 'kg', 12, 5, 4200], ['Seer fish', 'kg', 9, 4, 3800], ['Coconut milk', 'l', 30, 8, 520], ['Onions', 'kg', 25, 8, 280], ['Cheese', 'kg', 6, 3, 3200], ['Flour', 'kg', 40, 10, 240], ['Eggs', 'pcs', 180, 60, 55], ['Tea leaves', 'kg', 8, 2, 2600], ['Coffee beans', 'kg', 5, 2, 5200], ['Fresh milk', 'l', 22, 10, 420], ['Beef patty', 'pcs', 40, 15, 480], ['Cuttlefish', 'kg', 7, 3, 2900], ['Vegetable oil', 'l', 35, 10, 760], ['Sugar', 'kg', 30, 10, 300]],
  product_categories: [{ name: 'Groceries', icon: '🛒' }, { name: 'Beverages', icon: '🥤' }, { name: 'Snacks', icon: '🍪' }, { name: 'Personal care', icon: '🧴' }, { name: 'Souvenirs', icon: '🎁' }, { name: 'Electronics', icon: '🔌' }, { name: 'Clothing', icon: '👕' }, { name: 'Household', icon: '🧽' }],
  brands: [{ name: 'Anchor', country: 'New Zealand' }, { name: 'Munchee', country: 'Sri Lanka' }, { name: 'Dilmah', country: 'Sri Lanka' }, { name: 'Elephant House', country: 'Sri Lanka' }, { name: 'Sunsilk', country: 'UK' }, { name: 'Samsung', country: 'South Korea' }, { name: 'Odel', country: 'Sri Lanka' }, { name: 'Prima', country: 'Sri Lanka' }],
  products: [
    ['Dilmah Ceylon tea 100 bags', 0, 2, 1450, '🍵'], ['Anchor full cream milk powder 400g', 0, 0, 1290, '🥛'], ['Prima kottu mee 400g', 0, 7, 320, '🍜'], ['Basmati rice 5kg', 0, 7, 3250, '🍚', true],
    ['Elephant House ginger beer 1.5l', 1, 3, 480, '🥤'], ['Mineral water 1.5l', 1, 3, 180, '💧'], ['Fresh orange juice 1l', 1, 3, 890, '🧃'], ['King coconut water 330ml', 1, 3, 350, '🥥'],
    ['Munchee Super Cream Cracker', 2, 1, 290, '🍘'], ['Chocolate cookies 200g', 2, 1, 520, '🍪'], ['Spicy cashew pack', 2, 1, 950, '🥜'], ['Potato chips 150g', 2, 1, 480, '🥔'],
    ['Sunsilk shampoo 400ml', 3, 4, 1150, '🧴'], ['Sunscreen SPF50', 3, 4, 2850, '🧴'], ['Herbal soap 3-pack', 3, 4, 690, '🧼'], ['Toothpaste 120g', 3, 4, 420, '🪥'],
    ['Wooden elephant carving', 4, 6, 4500, '🐘'], ['Batik wall hanging', 4, 6, 6800, '🖼️'], ['Ceylon spice gift box', 4, 2, 3900, '🎁'], ['Handloom sarong', 6, 6, 3500, '👘'],
    ['Samsung fast charger 25W', 5, 5, 6500, '🔌'], ['Power bank 10000mAh', 5, 5, 8900, '🔋'], ['Bluetooth earbuds', 5, 5, 12500, '🎧'],
    ['Cotton T-shirt "Sri Lanka"', 6, 6, 2400, '👕'], ['Beach hat', 6, 6, 1800, '👒'], ['Dishwash liquid 500ml', 7, 7, 560, '🧽'], ['Mosquito coil pack', 7, 7, 380, '🌀'],
  ],
  departments: ['Front office', 'Housekeeping', 'Food & beverage', 'Kitchen', 'Retail', 'Finance', 'Human resources', 'Sales & marketing', 'Engineering', 'IT & projects', 'Customer support', 'Management'],
  designations: [['Front office manager', 0], ['Receptionist', 0], ['Executive housekeeper', 1], ['Room attendant', 1], ['Restaurant manager', 2], ['Steward', 2], ['Cashier', 2], ['Executive chef', 3], ['Commis chef', 3], ['Shop manager', 4], ['Storekeeper', 4], ['Accountant', 5], ['HR manager', 6], ['Sales executive', 7], ['Maintenance technician', 8], ['Project manager', 9], ['Support agent', 10], ['General manager', 11], ['Hotel manager', 11]],
  shifts: [{ name: 'Morning', start: '06:00', end: '14:00', break_minutes: 30, grace_minutes: 10 }, { name: 'Day', start: '09:00', end: '17:30', break_minutes: 60, grace_minutes: 15 }, { name: 'Evening', start: '14:00', end: '22:00', break_minutes: 30, grace_minutes: 10 }, { name: 'Night', start: '22:00', end: '06:00', break_minutes: 30, grace_minutes: 10 }],
  leave_types: [{ name: 'Annual leave', days: 14, paid: true, carry_forward: true }, { name: 'Casual leave', days: 7, paid: true }, { name: 'Sick leave', days: 7, paid: true }, { name: 'Maternity leave', days: 84, paid: true }, { name: 'No-pay leave', days: 30, paid: false }],
  accounts: [['1000', 'Cash in hand', 'Asset', 'Current asset'], ['1010', 'Bank — Commercial Bank', 'Asset', 'Current asset'], ['1100', 'Accounts receivable', 'Asset', 'Current asset'], ['1200', 'Inventory', 'Asset', 'Current asset'], ['1500', 'Furniture & equipment', 'Asset', 'Fixed asset'], ['1510', 'Buildings', 'Asset', 'Fixed asset'], ['2000', 'Accounts payable', 'Liability', 'Current liability'], ['2100', 'VAT payable', 'Liability', 'Current liability'], ['2200', 'Service charge payable', 'Liability', 'Current liability'], ['2500', 'Bank loan', 'Liability', 'Long-term liability'], ['3000', 'Owner capital', 'Equity', 'Capital'], ['3100', 'Retained earnings', 'Equity', 'Reserves'], ['4000', 'Room revenue', 'Income', 'Operating income'], ['4100', 'Food & beverage revenue', 'Income', 'Operating income'], ['4200', 'Retail sales', 'Income', 'Operating income'], ['4300', 'Other income', 'Income', 'Other income'], ['5000', 'Cost of goods sold', 'Expense', 'Direct cost'], ['5100', 'Salaries & wages', 'Expense', 'Operating expense'], ['5200', 'Utilities', 'Expense', 'Operating expense'], ['5300', 'Repairs & maintenance', 'Expense', 'Operating expense'], ['5400', 'Marketing', 'Expense', 'Operating expense'], ['5500', 'OTA commissions', 'Expense', 'Operating expense']],
  taxes: [{ name: 'VAT', rate: 18, type: 'exclusive', applies_to: ['rooms', 'food', 'beverages', 'products', 'services'] }, { name: 'Service charge', rate: 10, type: 'exclusive', applies_to: ['rooms', 'food', 'beverages'] }, { name: 'Tourism development levy', rate: 1, type: 'exclusive', applies_to: ['rooms'] }],
  payment_methods: [{ name: 'Cash', type: 'cash', fee: 0 }, { name: 'Visa / Mastercard', type: 'card', fee: 2.5 }, { name: 'Amex', type: 'card', fee: 3.5 }, { name: 'LankaQR', type: 'wallet', fee: 0.5 }, { name: 'Bank transfer', type: 'bank', fee: 0 }, { name: 'Online gateway', type: 'online', fee: 3 }, { name: 'Room charge / City ledger', type: 'credit', fee: 0 }],
  loyalty_tiers: [{ name: 'Silver', min_points: 0, earn_rate: 1, discount: 0, color: '#94A3B8', perks: 'Points on every spend' }, { name: 'Gold', min_points: 2000, earn_rate: 2, discount: 5, color: '#E8A33D', perks: '5% off, late checkout' }, { name: 'Platinum', min_points: 8000, earn_rate: 3, discount: 10, color: '#475569', perks: '10% off, free upgrade when available, welcome drink' }],
  lead_sources: ['Website', 'Walk-in', 'Referral', 'Facebook', 'Instagram', 'Trade fair', 'Cold call'],
  pipelines: ['Corporate stays', 'Weddings & events', 'Wholesale supply'],
  training_types: ['Customer service', 'Food safety', 'Fire & safety', 'Software training', 'Leadership'],
  interview_rounds: ['Phone screening', 'Technical / skills test', 'Manager interview', 'Final HR interview'],
  checklist_items: ['Sign contract', 'Submit NIC copy & bank details', 'Uniform issued', 'System login created', 'Safety induction', 'Meet the team'],
  contract_types: ['Supplier agreement', 'Corporate rate agreement', 'Event contract', 'Lease', 'Service contract'],
  goal_categories: ['Revenue', 'Guest satisfaction', 'Cost control', 'People', 'Growth'],
  helpdesk_categories: ['Billing', 'Technical issue', 'Feature request', 'Account'],
  job_locations: ['Galle — Lagoon Bay', 'Colombo office', 'Kandy branch'],
  plans: [
    { name: 'Starter', price_monthly: 4900, price_yearly: 49000, max_users: 5, max_branches: 1, storage_gb: 2, trial_days: 14, modules: ['shop', 'sales', 'inventory', 'accounting'], description: 'For a single small shop or café.' },
    { name: 'Business', price_monthly: 14900, price_yearly: 149000, max_users: 25, max_branches: 3, storage_gb: 20, trial_days: 14, modules: ['restaurant', 'shop', 'sales', 'purchase', 'inventory', 'accounting', 'hrm', 'crm', 'support'], description: 'Restaurants and growing retail.' },
    { name: 'Hospitality Pro', price_monthly: 34900, price_yearly: 349000, max_users: 100, max_branches: 10, storage_gb: 100, trial_days: 30, modules: ['hotel', 'restaurant', 'shop', 'sales', 'purchase', 'inventory', 'accounting', 'hrm', 'recruitment', 'crm', 'projects', 'goals', 'contracts', 'support', 'workspace'], description: 'Hotels and resorts with restaurants and shops.' },
    { name: 'Enterprise', price_monthly: 79900, price_yearly: 799000, max_users: 1000, max_branches: 100, storage_gb: 1000, trial_days: 30, modules: ['hotel', 'restaurant', 'shop', 'sales', 'purchase', 'inventory', 'accounting', 'hrm', 'recruitment', 'crm', 'projects', 'goals', 'contracts', 'support', 'workspace'], description: 'Chains and groups with many businesses.' },
  ],
  addons: [['Hotel management', 'Hospitality'], ['Restaurant & KOT', 'Hospitality'], ['Retail POS', 'Retail'], ['Accounting', 'Finance'], ['Double entry', 'Finance'], ['Budget planner', 'Finance'], ['HRM & payroll', 'People'], ['Recruitment', 'People'], ['Performance', 'People'], ['Training', 'People'], ['CRM', 'Sales'], ['Quotation', 'Sales'], ['Projects (Taskly)', 'Productivity'], ['Timesheet', 'Productivity'], ['Goals', 'Productivity'], ['Contracts', 'Productivity'], ['Support tickets', 'Productivity'], ['Form builder', 'Productivity'], ['Calendar', 'Productivity'], ['Zoom meetings', 'Integrations'], ['Slack', 'Integrations'], ['Telegram', 'Integrations'], ['Twilio', 'Integrations'], ['Webhooks', 'Integrations'], ['AI assistant', 'Integrations'], ['Google reCAPTCHA', 'Integrations'], ['Landing page', 'Productivity'], ...PAYMENT_GATEWAYS.filter((g) => g !== 'Bank transfer').map((g) => [g, 'Payments'])],
  email_templates: [['New user welcome', 'Welcome to {company_name}'], ['Booking confirmation', 'Your booking {booking_no} is confirmed'], ['Check-out invoice', 'Your invoice from {hotel_name}'], ['Sales invoice', 'Invoice {invoice_no} from {company_name}'], ['Payment received', 'We received your payment of {amount}'], ['Payslip', 'Your payslip for {month}'], ['Leave approved', 'Your leave request was approved'], ['Password reset', 'Reset your password'], ['Order ready', 'Your order {order_no} is ready'], ['Plan expiring', 'Your {plan} plan expires on {date}']],
  landing_sections: [
    { section: 'hero', title: 'Run your hotel, restaurant and shop from one place', subtitle: 'Bookings, kitchen tickets, POS, stock, staff and accounts — connected, live and simple enough for every team member.', button_text: 'Start free trial', order: 1 },
    { section: 'features', title: 'Built for hospitality and retail', subtitle: 'Front desk, QR ordering, kitchen display, retail POS, payroll and double-entry accounting in one system.', order: 2 },
    { section: 'pricing', title: 'Simple plans that grow with you', subtitle: 'Start small, switch on modules as you grow.', order: 3 },
    { section: 'testimonials', title: 'Trusted by hotels and restaurants', subtitle: '“Check-in now takes two minutes and the kitchen never loses an order.”', order: 4 },
    { section: 'cta', title: 'See it with your own data', subtitle: 'Free 30-day trial. No card needed.', button_text: 'Book a demo', order: 5 },
  ],
};

const TITLES = {
  rate_plans: ['Peak season (Dec–Mar)', 'Off season saver', 'Weekend special', 'Long stay 7+ nights', 'Honeymoon package', 'Corporate rate'],
  housekeeping: null, maintenance: ['AC not cooling', 'Leaking tap in bathroom', 'TV remote broken', 'Door lock battery low', 'Wi-Fi weak signal', 'Shower drain blocked', 'Light bulb out'],
  laundry: ['2 shirts, 1 trouser', 'Suit dry clean', 'Bed sheets (house)', '3 dresses', 'Swimwear wash'],
  lost_found: ['Sunglasses', 'Phone charger', 'Gold bracelet', 'Kids teddy bear', 'Passport wallet', 'Kindle'],
  combos: ['Lunch set (rice & curry + drink)', 'Family kottu feast', 'Burger meal', 'Seafood platter for two'],
  bar_stock: [['Old Arrack', 'Spirit'], ['Johnnie Walker Black', 'Spirit'], ['Bombay Sapphire', 'Spirit'], ['House red wine', 'Wine'], ['Lion lager keg', 'Beer'], ['Tonic water', 'Mixer']],
  price_lists: [['Retail', 'retail', 0], ['Wholesale', 'wholesale', -12], ['Members', 'member', -5], ['Staff', 'staff', -15]],
  stock_counts: ['Monthly count — shop floor', 'Quarter-end kitchen store', 'Souvenir corner spot check'],
  items: [['Room cleaning service', 'service', 'hour', 2500], ['Event hall rental', 'service', 'day', 150000], ['Conference package', 'service', 'day', 6500], ['Linen set', 'product', 'pcs', 4800], ['Bath towels', 'product', 'pcs', 1800], ['Printer paper A4', 'product', 'box', 1650], ['Cleaning chemicals', 'product', 'l', 950], ['Toiletry kit', 'product', 'pcs', 650], ['Website maintenance', 'service', 'hour', 5000], ['Consulting', 'service', 'hour', 12000]],
  warehouses: ['Main store', 'Kitchen store', 'Shop floor', 'Bar store'],
  branches: [['Head office', 'HO'], ['Galle resort', 'GAL'], ['Colombo city outlet', 'CMB']],
  bank_accounts: [['Main current account', 'Commercial Bank'], ['Savings', 'Sampath Bank'], ['USD account', 'HNB'], ['Petty cash', 'Cash']],
  budget_periods: ['FY 2026/27', 'Q3 2026', 'Q4 2026'],
  budgets: ['Kitchen supplies', 'Marketing — peak season', 'Staff training', 'Room refurbishment', 'IT & software', 'Utilities'],
  budget_allocations: ['Social media ads', 'Print brochures', 'OTA promotions', 'Kitchen equipment', 'Linen replacement'],
  announcements: ['Peak season starts next month — leave freeze', 'New uniform distribution on Friday', 'Fire drill at 3 pm Thursday', 'Staff party this Saturday'],
  events: ['Monthly staff meeting', 'Food safety training', 'Sports day', 'Christmas party', 'Vesak lantern competition'],
  documents: ['Employee handbook', 'Code of conduct', 'Fire safety policy', 'Leave policy', 'Grooming standards'],
  holidays: [['Vesak Poya', 'Poya'], ['Christmas Day', 'Public'], ['Sinhala & Tamil New Year', 'Public'], ['Independence Day', 'Public'], ['Company anniversary', 'Company'], ['Deepavali', 'Public']],
  warnings: ['Late arrival — 3rd time', 'Uniform policy breach', 'Cash shortage at counter'],
  complaints: ['Shift swap not honoured', 'Rude behaviour from colleague', 'Overtime not recorded'],
  trainings: ['Guest service excellence', 'HACCP food safety', 'New POS system training', 'Fire safety & first aid', 'Supervisor leadership'],
  trainers: ['Dr. Kumari Fonseka', 'Chef Trainer Ranil', 'SafeLanka Institute', 'IT team'],
  review_cycles: ['Mid-year review 2026', 'Annual review 2026', 'Probation reviews'],
  indicators: ['Guest satisfaction score', 'Upselling', 'Punctuality', 'Teamwork', 'Hygiene standards', 'Sales target'],
  employee_goals: ['Complete supervisor course', 'Reduce check-in time to 3 min', 'Upsell 10 spa packages / month', 'Zero cash variance', 'Learn new POS'],
  jobs: [['Front office associate', 'Full time'], ['Commis chef', 'Full time'], ['Bartender', 'Full time'], ['Housekeeping attendant', 'Full time'], ['Accounts intern', 'Internship'], ['Night auditor', 'Full time']],
  custom_questions: ['Do you have hotel experience?', 'Expected salary', 'Can you work night shifts?', 'Languages spoken'],
  assessments: ['English test', 'Cooking practical', 'Excel test', 'Personality test'],
  leads: null, deals: ['Annual corporate stay — Dialog', 'Wedding reception — Fernando family', 'Conference — SLASSCOM', 'Airline crew contract', 'Tour operator allotment 2027', 'Supermarket supply deal'],
  activities: ['Follow-up call', 'Site visit with client', 'Send revised proposal', 'Tasting session', 'Contract negotiation meeting'],
  projects: ['Website redesign', 'New spa wing opening', 'POS rollout — city outlet', 'ISO 22000 certification', 'Staff app launch'],
  milestones: ['Design approved', 'Phase 1 complete', 'Go-live', 'Training finished'],
  tasks: ['Prepare budget sheet', 'Collect supplier quotes', 'Design new menu cards', 'Update room photos', 'Configure printers', 'Train cashiers', 'Write SOP for check-in', 'Fix booking form bug', 'Order uniforms', 'Plan launch event'],
  bugs: ['Receipt prints twice', 'Wrong tax on discount', 'Booking email not sent', 'Slow report loading'],
  goals: [['Reach 85% occupancy', 85, '%'], ['Guest rating 4.7+', 4.7, '★'], ['Food cost under 32%', 32, '%'], ['Monthly revenue LKR 25M', 25000000, 'LKR'], ['Hire 10 new staff', 10, 'people']],
  contracts: ['Fresh seafood supply 2026', 'Corporate rates — John Keells', 'Laundry outsourcing', 'Shop space lease', 'Annual AC maintenance'],
  tickets: ['Refund not received', 'Booking date change', 'Wrong item delivered', 'Wi-Fi not working in room', 'Invoice copy needed', 'Gift card not accepted'],
  kb_articles: ['How to check in a guest', 'How to split a bill', 'How to process a return', 'Running the night audit', 'Adding a new menu item', 'Applying for leave'],
  faqs: [['What time is check-in and check-out?', 'Check-in from 2 pm and check-out until 12 noon.'], ['Do you offer airport transfers?', 'Yes, book at the front desk or online.'], ['Can I order food to my room?', 'Yes — scan the QR code in your room.'], ['Are pets allowed?', 'Sorry, pets are not allowed.']],
  meetings: ['Weekly managers sync', 'Supplier review', 'Budget planning', 'Interview — commis chef', 'Owner monthly review'],
  forms: ['Guest satisfaction survey', 'Event enquiry form', 'Staff suggestion box'],
  media: ['hotel-front.jpg', 'menu-2026.pdf', 'logo.png', 'pool-sunset.jpg', 'staff-handbook.pdf', 'promo-video.mp4'],
  notes: ['Supplier phone numbers', 'Ideas for menu', 'Things to fix before peak season'],
  campaigns: ['Weekend getaway 20% off', 'Birthday treat', 'New menu launch', 'We miss you — come back'],
  promotions: [['Happy hour 5–7 pm', 'HAPPY50', 'happy_hour', 50], ['Weekend stay 15% off', 'WEEKEND15', 'percentage', 15], ['Buy 1 get 1 burgers', 'BOGO', 'bogo', 0], ['Member flat 1000 off', 'MEM1000', 'flat', 1000]],
  coupons: [['WELCOME20', 'percentage', 20], ['HOTEL50', 'percentage', 50], ['FLAT5000', 'flat', 5000], ['ANNUAL10', 'percentage', 10]],
  custom_pages: [['Privacy policy', 'privacy-policy'], ['Terms of service', 'terms'], ['Refund policy', 'refund-policy'], ['About us', 'about']],
  notification_templates: [['New booking alert', 'Slack', 'Booking created'], ['Booking confirmation SMS', 'SMS', 'Booking confirmed'], ['Order ready', 'WhatsApp', 'KOT marked ready'], ['Low stock alert', 'Telegram', 'Stock below reorder level'], ['Payment received', 'SMS', 'Invoice paid']],
};

// ------------------------------------------------ generic value generator
function genValue(f, ent, i, ctx) {
  const k = f.k;
  switch (f.t) {
    case 'text':
      if (k === 'number' && ent.prefix) return ent.prefix + String(1001 + i);
      if (k === 'name' || k === 'customer_name' || k === 'user_name' || k === 'contact' || k === 'owner' || k === 'manager' || k === 'host' || k === 'reviewer' || k === 'interviewer' || k === 'buddy' || k === 'by' || k === 'counted_by' || k === 'received_by' || k === 'approved_by' || k === 'cashier' || k === 'waiter' || k === 'posted_by' || k === 'closed_by' || k === 'found_by' || k === 'submitted_by' || k === 'head' || k === 'responsible' || k === 'sold_to' || k === 'party' || k === 'owner_name') return k === 'party' ? pick(COMPANIES) : person();
      if (k === 'company') return pick(COMPANIES);
      if (k === 'reference') return 'REF-' + ri(10000, 99999);
      if (k === 'code') return 'C' + ri(100, 999);
      if (k === 'sku') return 'SKU-' + ri(10000, 99999);
      if (k === 'barcode') return '479' + ri(1000000000, 9999999999);
      if (k === 'batch_no') return 'B' + ri(2400, 2699) + '-' + ri(10, 99);
      if (k === 'serial') return 'SN' + ri(100000000, 999999999);
      if (k === 'month') return monthName(-ri(0, 2));
      if (k === 'ip') return `112.134.${ri(1, 254)}.${ri(1, 254)}`;
      if (k === 'device') return pick(['Chrome on Windows', 'Safari on iPhone', 'Chrome on Android', 'Edge on Windows', 'Safari on Mac']);
      if (k === 'salary_range') return `LKR ${ri(4, 8) * 10}k–${ri(9, 15) * 10}k`;
      if (k === 'items') return pick(['2 shirts, 1 trouser', 'Suit dry clean', 'Bed sheets', '3 dresses']);
      if (k === 'test') return pick(TITLES.assessments);
      if (k === 'country' || k === 'nationality') return pick(['Sri Lanka', 'United Kingdom', 'Germany', 'India', 'China', 'Australia', 'France', 'Russia']);
      if (k === 'city') return pick(['Colombo', 'Galle', 'Kandy', 'Negombo', 'Ella']);
      if (k === 'id_number' || k === 'nic') return ri(195000000, 200599999) + 'V';
      if (k === 'property_id' || k === 'store_id') return 'P' + ri(100000, 999999);
      if (k === 'options') return 'Option A, Option B';
      return ent.singular + ' ' + (i + 1);
    case 'textarea': return pick(['Handled by the day team.', 'Please follow up this week.', 'Approved by management.', 'Priority for the season.', 'See attached details.', 'Customer requested a call back.']);
    case 'email': return (ctx.lastName || person()).toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.com';
    case 'phone': return phone();
    case 'url': return 'https://example.com/' + ent.key + '/' + (i + 1);
    case 'color': return pick(['#0F6E66', '#E8A33D', '#2F6FB0', '#C2413B', '#7C3AED', '#16A34A']);
    case 'rating': return ri(3, 5);
    case 'bool': return rnd() > 0.35;
    case 'percent': return k.includes('tax') ? 18 : k === 'commission' ? ri(10, 18) : ri(10, 95);
    case 'number':
      if (k.includes('minutes')) return k === 'late_minutes' ? (rnd() > 0.7 ? ri(5, 40) : 0) : ri(0, 90);
      if (['adults'].includes(k)) return ri(1, 3);
      if (['children'].includes(k)) return ri(0, 2);
      if (['guests', 'seats'].includes(k)) return ri(2, 8);
      if (k === 'hours') return ri(1, 8);
      if (k === 'days') return ri(1, 5);
      if (k === 'order' || k === 'floor') return i + 1;
      return ri(1, 120);
    case 'money': return ri(5, 250) * 100;
    case 'date': return dateOff(ri(-25, 20));
    case 'datetime': return dtOff(-ri(0, 20));
    case 'time': return `${pad(ri(8, 20))}:${pick(['00', '15', '30', '45'])}`;
    case 'select': return pick(f.opts);
    case 'multi': return pickN(f.opts, ri(1, 3));
    default: return null;
  }
}

const dueOrPast = () => dateOff(ri(-20, 10));

export function buildSeed() {
  seed = 42; idc = 1000;
  const db = { users: [], roles: [], settings: [], notifications: [], messages: [] };
  for (const e of Object.values(ENTITIES)) db[e.key] = [];
  const add = (key, rec, biz) => { const r = { id: nid(), ...(biz ? { businessId: biz } : {}), created_at: dtOff(-ri(1, 60)), ...rec }; db[key].push(r); return r; };
  const of = (key, biz) => db[key].filter((r) => r.businessId === biz);

  // ---------- platform
  const plans = CURATED.plans.map((p) => add('plans', { ...p, status: 'active' }));
  const BIZ = [
    { id: 'b1', name: 'Ceylon Ayu Resort Kandy', type: 'mixed', owner_name: 'Resort Owner', email: 'info@ceylonayu.lk', city: 'Kandy', slug: 'ceylon-ayu', plan: 2, modules: ['hotel', 'restaurant', 'purchase', 'inventory', 'accounting', 'hrm', 'recruitment'] },
  ];
  for (const b of BIZ) db.businesses.push({ id: b.id, name: b.name, type: b.type, owner_name: b.owner_name, email: b.email, phone: phone(), city: b.city, country: 'Sri Lanka', currency: 'LKR', modules: b.modules, plan_id: plans[b.plan].id, status: 'active', slug: b.slug, address: '294 George E. de Silva Mawatha, Kandy 20000, Sri Lanka', created_at: dtOff(-ri(90, 400)) });
  for (let m = 11; m >= 0; m--) for (let j = 0; j < ri(3, 7); j++) { const b = pick(BIZ); const pl = plans[ri(0, 3)]; add('subscriptions', { number: 'ORD-' + (5000 + db.subscriptions.length), business_id: b.id, plan_id: pl.id, cycle: rnd() > 0.7 ? 'yearly' : 'monthly', amount: pl.price_monthly, gateway: pick(['Stripe', 'PayPal', 'PayHere', 'Bank transfer']), date: dateOff(-m * 30 - ri(0, 25)), status: rnd() > 0.1 ? 'paid' : 'pending' }); }
  TITLES.coupons.forEach(([code, type, value]) => add('coupons', { code, type, value, limit: 100, used: ri(0, 60), expires: dateOff(ri(20, 200)), status: 'active' }));
  for (let i = 0; i < 4; i++) add('bank_transfers', { business_id: pick(BIZ).id, plan_id: pick(plans).id, amount: pick(plans).price_monthly, reference: 'BT' + ri(100000, 999999), date: dateOff(-ri(0, 10)), status: pick(['pending', 'pending', 'approved', 'rejected']) });
  CURATED.addons.forEach(([name, category]) => add('addons', { name, category, version: '2.' + ri(0, 6) + '.' + ri(0, 9), price: category === 'Payments' ? 0 : ri(0, 30) * 1000, description: name + ' module', status: 'enabled' }));
  CURATED.email_templates.forEach(([name, subject]) => add('email_templates', { name, subject, from_name: '{company_name}', body: 'Hello {customer_name},\n\n' + subject + '.\n\nThank you,\n{company_name}', module: 'Core', status: 'active' }));
  TITLES.notification_templates.forEach(([name, channel, event]) => add('notification_templates', { name, channel, event, message: `${event}: {details}`, status: 'active' }));
  CURATED.landing_sections.forEach((s) => add('landing_sections', { ...s, status: 'visible' }));
  TITLES.custom_pages.forEach(([title, slug]) => add('custom_pages', { title, slug, content: title + ' content goes here.', in_footer: true, status: 'published' }));
  for (let i = 0; i < 12; i++) add('newsletter', { email: person().toLowerCase().replace(' ', '.') + '@gmail.com', source: pick(['Landing page', 'Footer', 'Popup']), date: dateOff(-ri(0, 90)), status: 'subscribed' });
  const hdc = CURATED.helpdesk_categories.map((n) => add('helpdesk_categories', { name: n, color: pick(['#2F6FB0', '#E8A33D', '#0F6E66', '#C2413B']), status: 'active' }));
  ['Cannot print KOT on second printer', 'Need extra user licences', 'How to export payroll?', 'Invoice template change', 'Booking.com sync delay'].forEach((s, i) => add('helpdesk_tickets', { number: 'HD-' + (101 + i), subject: s, business_id: pick(BIZ).id, category_id: pick(hdc).id, priority: pick(['low', 'medium', 'high']), message: s + '. Please help.', status: pick(['open', 'in_progress', 'resolved']) }));

  // ---------- roles
  db.roles = DEFAULT_ROLES.map((r) => ({ id: 'role_' + r.key, ...JSON.parse(JSON.stringify(r)) }));

  // ---------- per business
  for (const b of BIZ) {
    const small = b.id !== 'b1';
    const N = small ? 6 : 10;
    const has = (m) => b.modules.includes(m) || m === 'admin' || (m === 'customers' && b.modules.some((x) => ['hotel', 'restaurant', 'shop', 'sales', 'crm'].includes(x)));
    const A = (key, rec) => add(key, rec, b.id);

    // admin basics
    TITLES.branches.slice(0, small ? 1 : 3).forEach(([name, code]) => A('branches', { name: small && name === 'Head office' ? b.name : name, code, address: b.city, phone: phone(), manager: person(), status: 'active' }));
    CURATED.taxes.forEach((t) => A('taxes', { ...t, status: 'active' }));
    CURATED.payment_methods.forEach((p) => A('payment_methods', { ...p, status: 'active' }));
    [['Front desk receipt', 'receipt', 'Front desk'], ['Hot kitchen KOT', 'kot', 'Hot kitchen'], ['Bar KOT', 'kot', 'Bar'], ['Shop counter', 'receipt', 'Shop'], ['Label printer', 'label', 'Store']].forEach(([name, type, station]) => A('printers', { name, type, station, connection: 'Network', ip: '192.168.1.' + ri(20, 90), status: rnd() > 0.15 ? 'online' : 'offline' }));
    TITLES.warehouses.forEach((w) => A('warehouses', { name: w, branch_id: of('branches', b.id)[0].id, manager: person(), address: b.city, status: 'active' }));

    // HR base (always – every business has staff)
    const deps = CURATED.departments.map((d) => A('departments', { name: d, branch_id: of('branches', b.id)[0].id, head: person(), status: 'active' }));
    const desigs = CURATED.designations.map(([n, d]) => A('designations', { name: n, department_id: deps[d].id, status: 'active' }));
    const shifts = CURATED.shifts.map((s) => A('shifts', { ...s, status: 'active' }));
    const staffNames = DEMO_USERS.filter((u) => u.business === b.id && u.employee).map((u) => [u.name, u.role]);
    const roleDesig = { reservations_agent: 1, concierge: 1, hotel_manager: 18, front_office: 1, housekeeping: 3, restaurant_manager: 4, cashier: 6, waiter: 5, chef: 7, shop_manager: 9, storekeeper: 10, accountant: 11, hr_manager: 12, sales_executive: 13, project_manager: 15, support_agent: 16, employee: 14 };
    const emps = [];
    const empCount = small ? 10 : 24;
    for (let i = 0; i < empCount; i++) {
      const [name, role] = staffNames[i] || [person(), null];
      const dg = role ? desigs[roleDesig[role]] : pick(desigs);
      emps.push(A('employees', { name, employee_id: 'EMP' + String(i + 1).padStart(3, '0'), email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@' + b.slug + '.lk', phone: phone(), department_id: dg.department_id, designation_id: dg.id, branch_id: of('branches', b.id)[0].id, joined: dateOff(-ri(60, 1500)), dob: `19${ri(75, 99)}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`, gender: pick(['Male', 'Female']), nic: ri(195000000, 200099999) + 'V', address: b.city, bank_name: pick(['Commercial Bank', 'Sampath Bank', 'BOC', 'HNB']), bank_account: String(ri(10000000, 99999999)), basic_salary: ri(6, 25) * 5000, shift_id: pick(shifts).id, emergency_contact: phone(), status: i < 20 || rnd() > 0.2 ? 'active' : 'on_leave' }));
    }
    const leaveTypes = CURATED.leave_types.map((l) => A('leave_types', l));
    for (const e of emps) for (let d = -13; d <= 0; d++) {
      const dt = dayOff(d); if (dt.getDay() === 0) continue;
      if (d === 0 && (rnd() > 0.85 || e.name === 'Chamara Herath')) continue;
      const late = rnd() > 0.82 ? ri(5, 35) : 0; const absent = rnd() > 0.95;
      A('attendance', { employee_id: e.id, date: iso(dt), clock_in: absent ? '' : `0${8 + (late > 25 ? 1 : 0)}:${pad(late % 60)}`, clock_out: d === 0 || absent ? '' : `17:${pad(ri(0, 50))}`, late_minutes: absent ? 0 : late, overtime_minutes: rnd() > 0.7 ? ri(30, 120) : 0, status: absent ? 'absent' : late ? 'late' : 'present' });
    }
    for (let i = 0; i < (small ? 5 : 12); i++) { const s = ri(-20, 25); const days = ri(1, 4); A('leave_applications', { employee_id: (i < 2 ? emps[emps.length > 14 ? 14 : 0] : pick(emps)).id, leave_type_id: pick(leaveTypes).id, start: dateOff(s), end: dateOff(s + days - 1), days, reason: pick(['Family function', 'Medical appointment', 'Travel', 'Personal matter']), status: s > 0 ? pick(['pending', 'pending', 'approved']) : pick(['approved', 'approved', 'rejected']) }); }
    for (const e of emps) {
      A('salary_components', { employee_id: e.id, name: 'Transport allowance', type: 'allowance', amount: 7500, recurring: true });
      if (rnd() > 0.5) A('salary_components', { employee_id: e.id, name: 'EPF (8%)', type: 'deduction', amount: Math.round(e.basic_salary * 0.08), recurring: true });
      for (const mo of [-2, -1]) { const al = 7500 + ri(0, 5) * 1000; const de = Math.round(e.basic_salary * 0.08); const ot = ri(0, 8) * 1000; const sc = has('hotel') || has('restaurant') ? ri(8, 18) * 1000 : 0; A('payslips', { employee_id: e.id, month: monthName(mo), basic: e.basic_salary, allowances: al, deductions: de, overtime: ot, service_charge: sc, net: e.basic_salary + al - de + ot + sc, status: 'paid' }); }
    }
    for (let d = 0; d < 7; d++) for (const e of emps.slice(0, 12)) A('rosters', { employee_id: e.id, shift_id: e.shift_id, date: dateOff(d), notes: '' });
    TITLES.holidays.forEach(([name, type], i) => A('holidays', { name, type, date: dateOff(ri(-30, 120)) }));
    TITLES.announcements.forEach((t) => A('announcements', { title: t, start: dateOff(-ri(0, 5)), end: dateOff(ri(5, 20)), message: t + '. Please plan accordingly.' }));
    TITLES.events.forEach((t) => A('events', { title: t, date: dateOff(ri(-10, 40)), time: '15:00', location: pick(['Conference hall', 'Staff canteen', 'Beach lawn']), color: pick(['#0F6E66', '#E8A33D', '#2F6FB0']), description: t }));
    const docs = TITLES.documents.map((t) => A('documents', { name: t, type: 'Policy', expiry: dateOff(ri(60, 400)), link: 'https://example.com/docs/' + t.toLowerCase().replace(/ /g, '-') }));
    emps.slice(0, 8).forEach((e) => A('acknowledgments', { employee_id: e.id, document_id: pick(docs).id, date: dateOff(-ri(0, 30)), status: pick(['acknowledged', 'pending']) }));
    emps.slice(0, 4).forEach((e) => A('awards', { employee_id: e.id, award: pick(['Employee of the month', 'Best service', 'Perfect attendance', 'Top seller']), date: dateOff(-ri(0, 90)), gift: 'Gift voucher LKR 10,000', description: 'Outstanding work' }));
    emps.slice(4, 6).forEach((e) => A('promotions_hr', { employee_id: e.id, designation_id: pick(desigs).id, date: dateOff(-ri(0, 60)), new_salary: e.basic_salary + 15000, description: 'Promoted after annual review' }));
    A('hr_transfers', { employee_id: emps[7].id, branch_id: of('branches', b.id)[0].id, department_id: pick(deps).id, date: dateOff(-12), description: 'Moved to support the new outlet' });
    TITLES.warnings.forEach((s) => A('warnings', { employee_id: pick(emps).id, subject: s, date: dateOff(-ri(0, 60)), description: s }));
    TITLES.complaints.forEach((s) => A('complaints', { from_id: pick(emps).id, against_id: pick(emps).id, title: s, date: dateOff(-ri(0, 30)), description: s, status: pick(['open', 'investigating', 'resolved']) }));
    A('resignations', { employee_id: emps[emps.length - 1].id, notice_date: dateOff(-10), last_day: dateOff(20), reason: 'Moving abroad', status: 'pending' });
    A('terminations', { employee_id: emps[emps.length - 2].id, type: 'End of contract', notice_date: dateOff(-40), date: dateOff(-10), description: 'Seasonal contract ended' });
    const ttypes = CURATED.training_types.map((n) => A('training_types', { name: n }));
    const trainers = TITLES.trainers.map((n) => A('trainers', { name: n, email: 'trainer@mail.com', phone: phone(), expertise: pick(CURATED.training_types), type: pick(['Internal', 'External']) }));
    TITLES.trainings.forEach((t) => A('trainings', { title: t, type_id: pick(ttypes).id, trainer_id: pick(trainers).id, employee_ids: pickN(emps, 4).map((e) => e.id), start: dateOff(ri(-30, 30)), end: dateOff(ri(31, 40)), cost: ri(2, 20) * 5000, status: pick(['planned', 'ongoing', 'completed']) }));
    const cycles = TITLES.review_cycles.map((n, i) => A('review_cycles', { name: n, start: dateOff(-60 + i * 30), end: dateOff(i * 30), status: ['closed', 'active', 'upcoming'][i] }));
    TITLES.indicators.forEach((n) => A('indicators', { name: n, designation_id: pick(desigs).id, weight: ri(10, 30), description: 'Measured monthly' }));
    emps.slice(0, 16).forEach((e) => A('reviews', { employee_id: e.id, cycle_id: cycles[1].id, reviewer: person(), rating: ri(3, 5), strengths: 'Reliable and friendly with guests.', improvements: 'Speed during peak hours.', status: pick(['submitted', 'acknowledged', 'draft']) }));
    emps.slice(0, 16).forEach((e) => A('employee_goals', { employee_id: e.id, goal: pick(TITLES.employee_goals), target_date: dateOff(ri(20, 120)), progress: ri(10, 90), status: pick(['in_progress', 'in_progress', 'achieved', 'not_started']) }));

    // customers
    let custs = [];
    if (has('customers')) {
      const named = [{ name: 'Emma Thompson', email: 'guest@ceylonayu.lk', nationality: 'United Kingdom', type: 'vip' }];
      for (let i = 0; i < (small ? 14 : 30); i++) { const n = named[i] || { name: person(), type: pick(['individual', 'individual', 'company', 'vip', 'walk_in']) }; const [fn, ...ln] = n.name.split(' '); custs.push(A('customers', { title: pick(['Mr', 'Ms', 'Mrs']), first_name: fn, last_name: ln.join(' '), name: n.name, gender: pick(['Male', 'Female']), country: n.nationality || 'Sri Lanka', id_type: rnd() > 0.5 ? 'Passport' : 'NIC', purpose: pick(['Leisure', 'Leisure', 'Business', 'Pilgrimage', 'Medical / Ayurveda']), vehicle_no: rnd() > 0.6 ? `${pick(['CAB', 'CAR', 'KX', 'WP'])}-${ri(1000, 9999)}` : '', marketing: rnd() > 0.4, phone: phone(), email: n.email || n.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.com', type: n.type, nationality: n.nationality || pick(['Sri Lanka', 'United Kingdom', 'Germany', 'India', 'Australia', 'France']), id_number: ri(195000000, 200099999) + 'V', address: pick(['Colombo 07', 'Galle', 'London', 'Berlin', 'Mumbai']), loyalty_points: ri(0, 9000), credit_limit: ri(0, 10) * 10000, balance: rnd() > 0.7 ? ri(1, 40) * 1000 : 0, birthday: `19${ri(70, 99)}-${pad(ri(1, 12))}-${pad(ri(1, 28))}`, status: 'active' })); }
      CURATED.loyalty_tiers.forEach((t) => A('loyalty_tiers', t));
      for (let i = 0; i < 6; i++) { const v = ri(2, 20) * 1000; A('gift_cards', { code: 'GC-' + ri(100000, 999999), customer_id: pick(custs).id, value: v, balance: Math.round(v * rnd()), expires: dateOff(ri(30, 300)), status: pick(['active', 'active', 'used']) }); }
      TITLES.promotions.forEach(([name, code, type, value]) => A('promotions', { name, code, type, value, applies_to: pickN(['hotel', 'restaurant', 'shop'], 2), min_spend: ri(0, 5) * 1000, start: dateOff(-10), end: dateOff(30), status: 'active' }));
      for (let i = 0; i < 12; i++) A('feedback', { customer_name: pick(custs).name, source: pick(b.id === 'b1' ? ['hotel', 'restaurant', 'shop', 'online'] : b.type === 'restaurant' ? ['restaurant', 'online'] : ['shop', 'online']), rating: pick([5, 5, 4, 4, 3, 5, 2]), comment: pick(['Lovely stay, friendly staff!', 'Food was excellent, a bit slow.', 'Great value for money.', 'Room was not cleaned on time.', 'Best kottu in town!', 'Checkout was quick and easy.']), date: dateOff(-ri(0, 30)), status: pick(['new', 'responded', 'closed']) });
      TITLES.campaigns.forEach((n) => A('campaigns', { name: n, channel: pick(['SMS', 'Email', 'WhatsApp']), audience: pick(['All customers', 'VIP', 'Loyalty members', 'Birthdays this month']), message: n + ' — reply STOP to opt out.', send_at: dtOff(ri(-10, 10)), sent: ri(0, 900), status: pick(['draft', 'scheduled', 'sent']) }));
    }

    // vendors & items (purchase/inventory)
    const vendors = COMPANIES.slice(0, small ? 6 : 10).map((n) => A('vendors', { name: n, contact: person(), email: 'sales@' + n.toLowerCase().replace(/[^a-z]+/g, '') + '.lk', phone: phone(), tax_number: 'VAT' + ri(100000, 999999), address: 'Colombo', payment_terms: pick(['Cash', '15 days', '30 days']), balance: ri(0, 30) * 5000, status: 'active' }));
    const items = TITLES.items.map(([name, type, unit, price]) => A('items', { name, sku: 'IT-' + ri(1000, 9999), type, category: type === 'service' ? 'Services' : 'Supplies', unit, sale_price: price, purchase_price: Math.round(price * 0.65), tax_rate: 18, quantity: type === 'product' ? ri(10, 200) : 0, description: name, status: 'active' }));
    const whs = of('warehouses', b.id);
    for (let i = 0; i < 5; i++) A('transfers', { number: 'TR-' + (1001 + i), from_id: whs[0].id, to_id: pick(whs.slice(1)).id, item_id: pick(items.filter((x) => x.type === 'product')).id, quantity: ri(2, 30), date: dateOff(-ri(0, 20)), status: pick(['pending', 'in_transit', 'received']) });

    const lineItems = (src, n = ri(1, 4)) => pickN(src, n).map((p) => { const qty = ri(1, 4); const price = p.price ?? p.sale_price ?? p.base_rate; return { ref: p.id, name: p.name, qty, price, tax: 18, total: qty * price }; });
    const sumItems = (its) => its.reduce((s, x) => s + x.total, 0);

    // ---------- HOTEL
    if (has('hotel')) {
      const RT_DESC = ['A calm double room opening onto the garden — ideal for couples exploring Kandy.', 'A spacious king room with a private balcony overlooking the outdoor pool.', 'Three comfortable beds for friends or a small family, with plenty of room to unwind.', 'Two connected spaces with a king bed, sitting area and balcony — made for families.', 'Our finest room: a hand-carved four-poster bed, bathtub and quiet garden views.'];
      const rts = CURATED.room_types.map((r, i) => A('room_types', { ...r, description: RT_DESC[i] }));
      const rooms = [];
      const layout = [[0, 101, 6], [2, 107, 2], [1, 201, 6], [3, 207, 2], [4, 301, 2]];
      for (const [t, start, count] of layout) for (let i = 0; i < count; i++) rooms.push(A('rooms', { number: String(start + i), room_type_id: rts[t].id, floor: Math.floor(start / 100), view: t === 1 ? 'Pool' : t === 4 ? 'Garden' : pick(['Garden', 'Pool', 'City']), smoking: false, status: 'available', notes: '' }));
      CURATED.meal_plans.forEach((m) => A('meal_plans', { ...m, status: 'active' }));
      TITLES.rate_plans.forEach((n, i) => A('rate_plans', { name: n, room_type_id: rts[i % rts.length].id, meal_plan: pick(['BB', 'HB', 'FB']), rate: Math.round(rts[i % rts.length].base_rate * (0.85 + rnd() * 0.4)), start: dateOff(-30), end: dateOff(120), min_nights: ri(1, 7), refundable: rnd() > 0.4, status: 'active' }));
      const agents = ['Jetwing Travels', 'Aitken Spence Travels', 'Walkers Tours', 'Dialog Axiata (corporate)', 'Booking.com', 'Agoda'].map((n, i) => A('travel_agents', { name: n, type: i < 3 ? 'Travel agent' : i === 3 ? 'Corporate' : 'OTA', contact: person(), email: 'res@' + n.split(' ')[0].toLowerCase() + '.com', phone: phone(), commission: i === 3 ? 0 : ri(10, 18), credit_limit: 500000, balance: ri(0, 20) * 10000, status: 'active' }));
      CURATED.extra_services.forEach((s) => A('extra_services', { ...s, status: 'active' }));
      CURATED.minibar_items.forEach((m) => A('minibar_items', { ...m, stock: ri(40, 200), par_level: 2, status: 'active' }));
      ['Booking.com', 'Agoda', 'Expedia', 'Airbnb', 'Google Hotels', 'TripAdvisor'].forEach((n, i) => A('channels', { name: n, property_id: 'P' + ri(100000, 999999), commission: ri(12, 18), last_sync: dtOff(0, ri(6, 11)), auto_sync: true, status: i === 3 ? 'error' : 'connected' }));

      // reservations — occupy ~60% now, plus history & future
      const SRC = ['Walk-in', 'Phone', 'Website', 'Booking.com', 'Agoda', 'Expedia', 'Travel agent', 'Corporate'];
      const mkRes = (room, ci, nights, status, guest) => {
        const rt = rts.find((r) => r.id === room.room_type_id); const rate = rt.base_rate; const src = pick(SRC);
        return A('reservations', { number: 'BK-' + (1001 + of('reservations', b.id).length), guest_id: (guest || pick(custs.slice(1))).id, room_id: room.id, room_type_id: rt.id, check_in: dateOff(ci), check_out: dateOff(ci + nights), adults: ri(1, 2), children: ri(0, 1), meal_plan: pick(['BB', 'HB', 'FB']), rate, source: src, agent_id: src === 'Travel agent' || src === 'Corporate' ? pick(agents).id : '', advance: status === 'confirmed' ? Math.round(rate * 0.3) : rate, total: rate * nights, special_requests: pick(['', '', 'Late check-in', 'Honeymoon setup', 'Extra pillows', 'Airport pickup']), status });
      };
      rooms.forEach((room, idx) => {
        // past stay
        if (rnd() > 0.3) mkRes(room, -ri(12, 25), ri(2, 5), 'checked_out');
        if (rnd() > 0.4) mkRes(room, -ri(6, 10), ri(1, 4), 'checked_out');
        const r = rnd();
        if (idx === 0) { const res = mkRes(room, -2, 5, 'checked_in', custs[0]); room.status = 'occupied'; void res; }
        else if (r < 0.55) { mkRes(room, -ri(0, 3), ri(2, 6), 'checked_in'); room.status = 'occupied'; }
        else if (r < 0.68) { mkRes(room, 0, ri(2, 4), 'confirmed'); room.status = 'reserved'; }
        else if (r < 0.78) room.status = 'dirty';
        else if (r < 0.82) room.status = 'cleaning';
        else if (r < 0.85) room.status = 'out_of_order';
        if (rnd() > 0.35) mkRes(room, ri(4, 18), ri(2, 5), pick(['confirmed', 'confirmed', 'tentative']));
      });
      // guaranteed arrivals today for the demo
      rooms.filter((rm) => ['available', 'dirty'].includes(rm.status)).slice(0, 3).forEach((rm) => { if (!of('reservations', b.id).some((r) => r.room_id === rm.id && r.check_in <= dateOff(0) && r.check_out > dateOff(0) && !['cancelled', 'checked_out'].includes(r.status))) { mkRes(rm, 0, ri(2, 4), 'confirmed'); if (rm.status === 'available') rm.status = 'reserved'; } });
      // checked-in guests leaving today
      of('reservations', b.id).filter((r) => r.status === 'checked_in').slice(0, 3).forEach((r) => { r.check_out = dateOff(0); r.total = r.rate * Math.max(1, Math.round((new Date(r.check_out) - new Date(r.check_in)) / 864e5)); });
      for (const res of of('reservations', b.id).filter((r) => ['checked_in', 'checked_out'].includes(r.status))) {
        const nights = Math.max(1, Math.round((new Date(res.check_out) - new Date(res.check_in)) / 864e5));
        const posted = res.status === 'checked_out' ? nights : Math.max(0, Math.min(nights, Math.round((dayOff(0) - new Date(res.check_in)) / 864e5)));
        for (let n = 0; n < posted; n++) { const d = new Date(res.check_in); d.setDate(d.getDate() + n); A('folio_charges', { reservation_id: res.id, description: 'Room charge — night ' + (n + 1), category: 'Room', amount: res.rate, date: iso(d), posted_by: 'Night audit' }); }
        for (let x = 0; x < ri(0, 3); x++) { const c = pick([['Restaurant dinner', 'Restaurant', ri(4, 15) * 1000], ['Minibar', 'Minibar', ri(1, 4) * 500], ['Laundry', 'Laundry', ri(1, 5) * 600], ['Ayurvedic massage', 'Spa', 12000], ['Airport transfer', 'Transport', 9500], ['Bar', 'Bar', ri(2, 8) * 900]]); A('folio_charges', { reservation_id: res.id, description: c[0], category: c[1], amount: c[2], date: res.check_in, posted_by: 'Front office' }); }
        A('folio_payments', { reservation_id: res.id, amount: res.advance || Math.round(res.total * 0.3), method: pick(['Card', 'Cash', 'Online', 'Bank transfer']), reference: 'PAY' + ri(10000, 99999), date: res.check_in, type: 'advance' });
        if (res.status === 'checked_out') { const due = of('folio_charges', b.id).filter((c) => c.reservation_id === res.id).reduce((s, c) => s + c.amount, 0) - (res.advance || 0); if (due > 0) A('folio_payments', { reservation_id: res.id, amount: due, method: pick(['Card', 'Cash']), reference: 'SET' + ri(10000, 99999), date: res.check_out, type: 'settlement' }); }
      }
      const hkStaff = emps.filter((e) => e.designation_id === desigs[3].id || e.name === 'Malini Jayawardena');
      rooms.filter((r) => ['dirty', 'cleaning', 'occupied'].includes(r.status)).forEach((room) => A('housekeeping', { room_id: room.id, task: room.status === 'occupied' ? 'Stay-over clean' : 'Checkout clean', assigned_to: (hkStaff.length ? pick(hkStaff) : pick(emps)).id, priority: room.status === 'dirty' ? 'high' : 'normal', date: dateOff(0), notes: '', status: room.status === 'cleaning' ? 'in_progress' : room.status === 'dirty' ? 'pending' : pick(['pending', 'done', 'inspected']) }));
      TITLES.maintenance.forEach((issue, i) => { const room = rooms.find((r) => r.status === 'out_of_order' && i === 0) || pick(rooms); A('maintenance', { room_id: room.id, issue, category: pick(['Electrical', 'Plumbing', 'AC', 'Furniture', 'IT']), priority: pick(['normal', 'high', 'urgent', 'low']), assigned_to: pick(emps).id, reported: dateOff(-ri(0, 10)), cost: ri(0, 20) * 1000, status: pick(['open', 'in_progress', 'resolved']) }); });
      const inHouse = of('reservations', b.id).filter((r) => r.status === 'checked_in');
      TITLES.laundry.forEach((it) => A('laundry', { reservation_id: pick(inHouse).id, items: it, pieces: ri(1, 6), service: pick(['Wash', 'Dry clean', 'Iron', 'Express']), amount: ri(2, 10) * 400, date: dateOff(-ri(0, 3)), status: pick(['received', 'processing', 'ready', 'delivered']) }));
      TITLES.lost_found.forEach((it) => A('lost_found', { item: it, found_at: 'Room ' + pick(rooms).number, found_by: person(), date: dateOff(-ri(0, 40)), owner: rnd() > 0.5 ? person() : '', status: pick(['stored', 'returned']) }));
      for (let d = 30; d >= 1; d--) { const occ = ri(14, 26); const rr = occ * ri(26, 34) * 1000; A('night_audits', { date: dateOff(-d), occupied: occ, occupancy: Math.round((occ / rooms.length) * 100), room_revenue: rr, other_revenue: Math.round(rr * (0.2 + rnd() * 0.2)), closed_by: 'Kasun Silva', status: 'closed' }); }
      // guest services: parking, transport, requests, registration cards, channel sync
      const ih = of('reservations', b.id).filter((r) => r.status === 'checked_in');
      const gname = (r) => db.customers.find((c) => c.id === r.guest_id)?.name || 'Guest';
      const slots = [];
      [['P', 'Main car park', 'Car', 12], ['C', 'Covered', 'Car', 4], ['E', 'Covered', 'EV charging', 2], ['B', 'Coach bay', 'Coach / bus', 2], ['M', 'Motorbike', 'Motorbike', 4]].forEach(([p0, zone, type, n]) => { for (let i = 1; i <= n; i++) slots.push(A('parking_slots', { code: p0 + String(i).padStart(2, '0'), zone, type, status: 'free', vehicle_no: '', notes: '' })); });
      ih.slice(0, 9).forEach((r, i) => { const sl = slots[i]; const v = `${pick(['CAB', 'CAR', 'KX', 'WP', 'CP'])}-${ri(1000, 9999)}`; sl.status = 'occupied'; sl.vehicle_no = v; r.vehicle_no = v; r.parking_slot_id = sl.id; A('parking_logs', { slot_id: sl.id, vehicle_no: v, vehicle_type: 'Car', driver: gname(r), reservation_id: r.id, purpose: 'Hotel guest', time_in: dtOff(-ri(0, 2), ri(12, 18)), time_out: '', fee: 0, status: 'parked' }); });
      slots[16].status = 'occupied'; slots[16].vehicle_no = 'NC-4521'; A('parking_logs', { slot_id: slots[16].id, vehicle_no: 'NC-4521', vehicle_type: 'Coach / bus', driver: 'Walkers Tours coach', purpose: 'Taxi / driver', time_in: dtOff(0, 9), time_out: '', fee: 0, status: 'parked' });
      slots[12].status = 'reserved'; slots[13].status = 'reserved'; slots[11].status = 'out_of_service'; slots[11].notes = 'Drain repair';
      for (let i = 0; i < 14; i++) { const sl = pick(slots.slice(0, 12)); A('parking_logs', { slot_id: sl.id, vehicle_no: `${pick(['CAB', 'CAR', 'KX', 'WP'])}-${ri(1000, 9999)}`, vehicle_type: pick(['Car', 'Car', 'Van', 'Tuk-tuk']), driver: person(), purpose: pick(['Restaurant guest', 'Visitor', 'Hotel guest', 'Supplier']), time_in: dtOff(-ri(1, 10), ri(8, 19)), time_out: dtOff(-ri(0, 1), ri(19, 22)), fee: pick([0, 0, 200, 300]), status: 'left' }); }
      const tv = [['Ceylon Ayu resort van', 'Own vehicle', 'Van', 'WP PH-4471', 0], ['Kandy City Cabs', 'Taxi company', 'Car', 'CAR-2210', 10], ['Sunil — tuk-tuk', 'Tuk-tuk', 'Tuk-tuk', 'QA-8823', 10], ['Hill Country Tours', 'Coach operator', 'Mini coach', 'NB-6602', 12], ['PickMe (app)', 'App (PickMe / Uber)', 'Car', '', 0]].map(([name, type, vehicle, vno, com]) => A('transport_vendors', { name, type, vehicle, vehicle_no: vno, phone: phone(), rate_per_km: vehicle === 'Tuk-tuk' ? 120 : vehicle === 'Car' ? 140 : 190, commission: com, status: pick(['available', 'available', 'on_trip']) }));
      const trips = [['Airport pick-up', 'Bandaranaike Airport (BIA)', 'Ceylon Ayu Resort', 18500], ['Temple of the Tooth', 'Ceylon Ayu Resort', 'Sri Dalada Maligawa', 1500], ['Railway station', 'Ceylon Ayu Resort', 'Kandy railway station', 900], ['Peradeniya Gardens', 'Ceylon Ayu Resort', 'Royal Botanical Gardens, Peradeniya', 4500], ['Day tour', 'Ceylon Ayu Resort', 'Pinnawala & tea factory', 16500], ['Nuwara Eliya', 'Ceylon Ayu Resort', 'Nuwara Eliya', 22000], ['City taxi', 'Ceylon Ayu Resort', 'Kandy City Centre', 800], ['Airport drop', 'Ceylon Ayu Resort', 'Bandaranaike Airport (BIA)', 18500], ['Sigiriya', 'Ceylon Ayu Resort', 'Sigiriya Rock', 24000]];
      trips.forEach(([type, from, to, fare], i) => { const r = pick(ih.length ? ih : of('reservations', b.id)); A('transport_bookings', { number: 'TR-' + (1001 + i), guest_name: gname(r), reservation_id: r.id, type, pickup: from, dropoff: to, pickup_time: dtOff(ri(-2, 3), ri(6, 18), pick([0, 30])), passengers: ri(1, 4), vehicle: type === 'City taxi' ? 'Tuk-tuk' : pick(['Car', 'Van']), vendor_id: pick(tv).id, fare, charge_to_room: rnd() > 0.4, notes: '', status: ['requested', 'confirmed', 'driver_assigned', 'on_trip', 'completed', 'completed', 'requested', 'confirmed', 'cancelled'][i] }); });
      const rq = [['Extra towels', 'normal', 'new'], ['Room cleaning', 'normal', 'acknowledged'], ['Maintenance / repair', 'urgent', 'new'], ['Drinking water', 'normal', 'done'], ['Late check-out', 'normal', 'acknowledged'], ['Extra pillow / blanket', 'normal', 'in_progress'], ['Wake-up call', 'normal', 'done'], ['Laundry pick-up', 'normal', 'new']];
      rq.forEach(([type, priority, status], i) => { const r = ih[i % Math.max(1, ih.length)]; A('guest_requests', { room: rooms.find((x) => x.id === r?.room_id)?.number || '101', guest_name: r ? gname(r) : 'Guest', type, details: type === 'Maintenance / repair' ? 'Bathroom tap is leaking' : type === 'Late check-out' ? 'Flight at 9 pm — can we stay until 4 pm?' : '', source: pick(['Room QR', 'Room QR', 'Phone', 'Front desk']), assigned_to: pick(emps).id, priority, created: dtOff(0, Math.max(6, new Date().getHours() - i), ri(0, 59)), status }); });
      ih.forEach((r) => A('registration_cards', { reservation_id: r.id, guest_id: r.guest_id, signed_at: r.check_in + 'T14:' + pad(ri(0, 59)), id_verified: true, id_copy: '', notes: '' }));
      ['Booking.com', 'Agoda', 'Expedia', 'Google Hotels', 'Airbnb', 'Booking.com', 'Agoda'].forEach((ch, i) => A('channel_sync_logs', { channel: ch, action: pick(['Availability update', 'Rate update', 'Booking received', 'Full sync']), details: pick(['5 room types, next 365 days', 'Rates for Dec–Mar peak season', 'New booking received and added to Reservations', 'Stop sell lifted on Family Suite']), date: dtOff(-Math.floor(i / 3), ri(6, 20)), by: pick(['Tharushi de Silva', 'Auto-sync']), status: i === 4 ? 'failed' : 'success' }));
    }


    // ---------- RESTAURANT
    if (has('restaurant')) {
      const cats = CURATED.menu_categories.map((c) => A('menu_categories', { ...c, status: 'active' }));
      const mods = CURATED.modifiers.map((m) => A('modifiers', { ...m, status: 'active' }));
      const menu = CURATED.menu_items.map(([name, c, price, icon, veg]) => A('menu_items', { name, category_id: cats[c].id, price, cost: Math.round(price * (0.28 + rnd() * 0.1)), icon, veg: !!veg, spicy: pick(['none', 'mild', 'medium', 'hot']), prep_minutes: c >= 6 ? ri(3, 6) : ri(10, 25), modifier_ids: c <= 4 ? [mods[0].id] : c === 6 ? [mods[3].id] : [], description: name + ' — a house favourite.', available: rnd() > 0.06, status: 'active' }));
      TITLES.combos.forEach((n) => { const its = pickN(menu, 3); A('combos', { name: n, item_ids: its.map((x) => x.id), price: Math.round(its.reduce((s, x) => s + x.price, 0) * 0.85), status: 'active' }); });
      const ings = CURATED.ingredients.map(([name, unit, stock, reorder, cost]) => A('ingredients', { name, unit, stock: rnd() > 0.85 ? Math.round(reorder * 0.6) : stock, reorder, cost, supplier_id: pick(vendors).id, status: 'active' }));
      menu.slice(0, 24).forEach((m) => pickN(ings, 2).forEach((ing) => A('recipes', { menu_item_id: m.id, ingredient_id: ing.id, quantity: ing.unit === 'pcs' ? ri(1, 2) : +(0.05 + rnd() * 0.25).toFixed(2), notes: '' })));
      TITLES.bar_stock.forEach(([name, type]) => A('bar_stock', { name, type, bottle_ml: type === 'Beer' ? 30000 : 750, peg_ml: 30, bottles: ri(2, 20), open_ml: ri(0, 700), peg_price: ri(5, 18) * 100, status: 'active' }));
      const areas = CURATED.areas.map((a) => A('areas', { ...a, status: 'active' }));
      const tables = [];
      const tcount = small ? 12 : 18;
      const per = Math.ceil(tcount / 4);
      for (let i = 0; i < tcount; i++) { const k = i % per; tables.push(A('tables', { name: 'T' + (i + 1), area_id: areas[Math.min(3, Math.floor(i / per))].id, seats: [2, 4, 4, 6, 2, 8][k % 6], shape: ['round', 'square', 'square', 'long', 'round', 'long'][k % 6], pos_x: 1 + (k % 3) * 3.2, pos_y: 1 + Math.floor(k / 3) * 2.6, status: 'free' })); }
      const waiters = emps.filter((e) => e.designation_id === desigs[5].id).map((e) => e.name).concat(['Suresh Bandara']);
      const riders = ['Amila', 'Bandula', 'Charith', 'Dinuka'].map((n, i) => A('riders', { name: n + ' ' + pick(LAST), phone: phone(), vehicle: pick(['Bike', 'Scooter']), partner: i < 2 ? 'Own staff' : pick(['Uber Eats', 'PickMe Food']), status: pick(['available', 'on_delivery', 'off_duty']) }));
      ['Uber Eats', 'PickMe Food', 'Foodpanda'].forEach((n) => A('aggregators', { name: n, store_id: 'S' + ri(10000, 99999), commission: ri(18, 30), menu_synced: true, status: 'connected' }));
      // historical orders
      const mkOrder = (dOff, status, table, type) => {
        const its = pickN(menu, ri(2, 5)).map((m) => ({ ref: m.id, name: m.name, qty: ri(1, 3), price: m.price, total: 0, station: cats.find((c) => c.id === m.category_id).station, note: '' }));
        its.forEach((x) => (x.total = x.qty * x.price));
        const sub = sumItems(its); const disc = rnd() > 0.85 ? Math.round(sub * 0.1) : 0; const scv = type === 'dine_in' ? Math.round((sub - disc) * 0.1) : 0; const tax = Math.round((sub - disc + scv) * 0.18);
        const h = pick([12, 13, 13, 14, 19, 20, 20, 21, 8, 16]);
        return A('restaurant_orders', { number: 'R-' + (10001 + of('restaurant_orders', b.id).length), type, table_id: table ? table.id : '', customer_id: rnd() > 0.6 ? pick(custs).id : '', waiter: pick(waiters), items: its, subtotal: sub, discount: disc, service_charge: scv, tax, total: sub - disc + scv + tax, payment_method: status === 'paid' ? (type === 'room_service' ? 'Room charge' : pick(['Cash', 'Card', 'Card', 'Online'])) : '', rider_id: type === 'delivery' ? pick(riders).id : '', room_reservation_id: type === 'room_service' ? (of('reservations', b.id).find((r) => r.status === 'checked_in')?.id || '') : '', date: dtOff(dOff, h), status });
      };
      for (let d = -30; d <= -1; d++) for (let j = 0; j < ri(small ? 4 : 7, small ? 9 : 14); j++) { const type = pick(['dine_in', 'dine_in', 'dine_in', 'takeaway', 'qr', 'room_service', 'room_service']); mkOrder(d, rnd() > 0.04 ? 'paid' : 'cancelled', ['dine_in', 'qr'].includes(type) ? pick(tables) : null, type); }
      for (let j = 0; j < 6; j++) mkOrder(0, 'paid', pick(tables), pick(['dine_in', 'takeaway']));
      // live orders now
      const liveStatuses = ['preparing', 'preparing', 'open', 'ready', 'served', 'preparing', 'served'];
      tables.slice(0, liveStatuses.length).forEach((t, i) => {
        const o = mkOrder(0, liveStatuses[i], t, i === 5 ? 'qr' : 'dine_in'); o.date = dtOff(0, new Date().getHours(), Math.max(0, new Date().getMinutes() - ri(3, 40)));
        t.status = i === 4 ? 'bill_requested' : 'occupied';
        const byStation = {}; o.items.forEach((it) => (byStation[it.station] ||= []).push(it));
        Object.entries(byStation).forEach(([st, its]) => A('kots', { number: 'KOT-' + (5001 + of('kots', b.id).length), order_id: o.id, station: st, table: t.name, items: its, created: o.date, status: o.status === 'open' ? 'new' : o.status === 'preparing' ? pick(['new', 'preparing']) : o.status === 'ready' ? 'ready' : 'served' }));
      });
      tables.slice(liveStatuses.length, liveStatuses.length + 2).forEach((t) => (t.status = 'reserved'));
      for (let i = 0; i < 10; i++) A('table_reservations', { customer_name: person(), phone: phone(), date: dateOff(ri(0, 7)), time: pick(['12:30', '13:00', '19:00', '19:30', '20:00', '20:30']), guests: ri(2, 8), table_id: pick(tables).id, occasion: pick(['None', 'Birthday', 'Anniversary', 'Business']), notes: '', status: pick(['booked', 'booked', 'seated', 'completed']) });
      for (let i = 0; i < 4; i++) A('waitlist', { customer_name: person(), phone: phone(), guests: ri(2, 6), quoted_minutes: ri(10, 30), added: dtOff(0, new Date().getHours(), ri(0, 59)), status: pick(['waiting', 'waiting', 'notified']) });
    }

    // ---------- SHOP
    if (has('shop')) {
      const pc = CURATED.product_categories.map((c) => A('product_categories', { ...c, parent: '', status: 'active' }));
      const brs = CURATED.brands.map((c) => A('brands', { ...c, status: 'active' }));
      const prods = CURATED.products.map(([name, c, br, price, icon, weighed]) => A('products', { name, sku: 'SKU-' + ri(10000, 99999), barcode: '479' + ri(1000000000, 9999999999), category_id: pc[c].id, brand_id: brs[br].id, icon, unit: weighed ? 'kg' : 'pcs', cost: Math.round(price * 0.7), price, wholesale_price: Math.round(price * 0.88), tax_rate: 18, stock: rnd() > 0.82 ? ri(0, 4) : ri(12, 180), reorder: 10, variants: c === 6 ? 'S, M, L, XL' : '', track_batch: c <= 3, track_serial: c === 5, weighed: !!weighed, online: rnd() > 0.2, status: 'active' }));
      prods.filter((p) => p.track_batch).slice(0, 8).forEach((p) => { const ex = ri(-5, 120); A('batches', { product_id: p.id, batch_no: 'B' + ri(2400, 2699) + '-' + ri(10, 99), quantity: ri(10, 80), mfg: dateOff(-ri(60, 200)), expiry: dateOff(ex), status: ex < 0 ? 'expired' : ex < 30 ? 'expiring' : 'ok' }); });
      prods.filter((p) => p.track_serial).forEach((p) => { for (let i = 0; i < 3; i++) A('serials', { product_id: p.id, serial: 'SN' + ri(100000000, 999999999), warranty_until: dateOff(ri(100, 700)), sold_to: i === 0 ? person() : '', status: i === 0 ? 'sold' : 'in_stock' }); });
      TITLES.price_lists.forEach(([name, ct, adj]) => A('price_lists', { name, customer_type: ct, adjustment: adj, status: 'active' }));
      const cashiers = ['Dilani Wickrama', 'Tharushi de Silva', person()];
      const mkSale = (dOff, status, channel = 'counter') => { const its = lineItems(prods, ri(1, 5)); const sub = sumItems(its); const disc = rnd() > 0.85 ? Math.round(sub * 0.05) : 0; const tax = Math.round((sub - disc) * 0.18 / 1.18); return A('shop_sales', { number: 'S-' + (20001 + of('shop_sales', b.id).length), customer_id: rnd() > 0.5 ? pick(custs).id : '', items: its, subtotal: sub, discount: disc, tax, total: sub - disc, payment_method: pick(['Cash', 'Cash', 'Card', 'Online', 'Gift card']), channel, cashier: pick(cashiers), date: dtOff(dOff), status }); };
      for (let d = -30; d <= 0; d++) for (let j = 0; j < ri(small ? 6 : 4, small ? 14 : 9); j++) mkSale(d, rnd() > 0.03 ? 'paid' : 'refunded', rnd() > 0.85 ? 'online' : 'counter');
      mkSale(0, 'held');
      const sales = of('shop_sales', b.id);
      for (let i = 0; i < 5; i++) { const s = pick(sales); const it = s.items[0]; A('shop_returns', { number: 'RT-' + (1001 + i), sale_id: s.id, product_id: it.ref, quantity: 1, reason: pick(['Damaged', 'Wrong item', 'Size issue', 'Changed mind']), refund: it.price, type: pick(['refund', 'exchange', 'store_credit']), date: dateOff(-ri(0, 20)), status: pick(['pending', 'approved', 'approved']) }); }
      for (let i = 0; i < 8; i++) A('stock_adjustments', { product_id: pick(prods).id, type: pick(['add', 'remove', 'remove']), quantity: ri(1, 10), reason: pick(['Damaged', 'Expired', 'Count correction', 'Opening stock']), date: dateOff(-ri(0, 30)), by: 'Pradeep Rajapaksha' });
      TITLES.stock_counts.forEach((n, i) => A('stock_counts', { name: n, date: dateOff(-ri(0, 40)), warehouse_id: pick(whs).id, items_counted: ri(20, 200), variance: -ri(0, 20) * 500, counted_by: 'Pradeep Rajapaksha', status: ['completed', 'approved', 'in_progress'][i] }));
    }

    // ---------- SALES / PURCHASE / ACCOUNTING (doc-like)
    if (has('sales') && custs.length) {
      for (let i = 0; i < N; i++) { const its = lineItems(items); A('proposals', { number: 'PRO-' + (1001 + i), customer_id: pick(custs).id, date: dateOff(-ri(0, 40)), valid_until: dateOff(ri(5, 30)), items: its, total: sumItems(its), notes: 'Prices valid for 30 days.', status: pick(['draft', 'sent', 'accepted', 'rejected', 'converted']) }); }
      for (let i = 0; i < N; i++) { const its = lineItems(items); A('quotations', { number: 'QT-' + (1001 + i), customer_id: pick(custs).id, date: dateOff(-ri(0, 40)), items: its, total: sumItems(its), status: pick(['draft', 'sent', 'accepted', 'expired']) }); }
      for (let i = 0; i < N + 6; i++) { const its = lineItems(items); const t = sumItems(its); const st = pick(['sent', 'paid', 'paid', 'partially_paid', 'overdue', 'draft']); A('sales_invoices', { number: 'INV-' + (1001 + i), customer_id: pick(custs).id, date: dateOff(-ri(0, 60)), due_date: dueOrPast(), items: its, total: t, paid: st === 'paid' ? t : st === 'partially_paid' ? Math.round(t / 2) : 0, notes: 'Thank you for your business.', status: st }); }
      const invs = of('sales_invoices', b.id);
      for (let i = 0; i < 4; i++) { const inv = pick(invs); const its = inv.items.slice(0, 1); A('sales_returns', { number: 'SR-' + (1001 + i), invoice_id: inv.id, date: dateOff(-ri(0, 20)), items: its, total: sumItems(its), reason: 'Damaged on delivery', status: pick(['draft', 'approved', 'completed']) }); }
    }
    if (has('purchase')) {
      for (let i = 0; i < N; i++) { const its = lineItems(items); A('purchase_orders', { number: 'PO-' + (1001 + i), vendor_id: pick(vendors).id, warehouse_id: pick(whs).id, date: dateOff(-ri(0, 40)), expected: dateOff(ri(1, 14)), items: its, total: sumItems(its), status: pick(['draft', 'sent', 'partially_received', 'received']) }); }
      const pos = of('purchase_orders', b.id);
      pos.filter((p) => p.status !== 'draft').slice(0, 5).forEach((po, i) => A('grns', { number: 'GRN-' + (1001 + i), po_id: po.id, vendor_id: po.vendor_id, date: dateOff(-ri(0, 20)), items: po.items, received_by: 'Pradeep Rajapaksha', status: 'completed' }));
      for (let i = 0; i < N; i++) { const its = lineItems(items); const t = sumItems(its); const st = pick(['posted', 'paid', 'partially_paid', 'overdue']); A('purchase_invoices', { number: 'BILL-' + (1001 + i), vendor_id: pick(vendors).id, date: dateOff(-ri(0, 60)), due_date: dueOrPast(), items: its, total: t, paid: st === 'paid' ? t : st === 'partially_paid' ? Math.round(t / 2) : 0, status: st }); }
      const bills = of('purchase_invoices', b.id);
      for (let i = 0; i < 3; i++) { const bl = pick(bills); A('purchase_returns', { number: 'PR-' + (1001 + i), invoice_id: bl.id, date: dateOff(-ri(0, 20)), items: bl.items.slice(0, 1), total: bl.items[0].total, reason: 'Wrong item delivered', status: pick(['draft', 'approved', 'completed']) }); }
    }
    if (has('accounting')) {
      const accts = CURATED.accounts.map(([code, name, type, sub]) => A('accounts', { code, name, type, sub_type: sub, balance: 0, status: 'active' }));
      const banks = TITLES.bank_accounts.map(([n, bank]) => { const ob = ri(5, 60) * 50000; return A('bank_accounts', { name: n, bank, number: String(ri(100000000, 999999999)), branch: b.city, opening_balance: ob, balance: ob + ri(-10, 60) * 10000, status: 'active' }); });
      for (let i = 0; i < 16; i++) A('bank_transactions', { account_id: pick(banks).id, date: dateOff(-ri(0, 45)), type: pick(['deposit', 'deposit', 'withdrawal']), amount: ri(5, 300) * 1000, description: pick(['Card settlement', 'Cash deposit', 'Supplier payment', 'Salary transfer', 'Utility bill', 'OTA payout']), reconciled: rnd() > 0.3 });
      for (let i = 0; i < 3; i++) A('bank_transfers_internal', { from_id: banks[0].id, to_id: pick(banks.slice(1)).id, amount: ri(5, 50) * 10000, date: dateOff(-ri(0, 30)), reference: 'TRF' + ri(1000, 9999) });
      for (let m = 0; m < 6; m++) for (let j = 0; j < 3; j++) A('revenues', { date: dateOff(-m * 30 - ri(0, 25)), amount: ri(5, 80) * 5000, account_id: pick(banks).id, customer_id: custs.length ? pick(custs).id : '', category: pick(b.type === 'company' ? ['Services', 'Commission', 'Interest', 'Other'] : ['Rooms', 'Food & beverage', 'Retail', 'Commission', 'Other']), reference: 'RV' + ri(1000, 9999), description: 'Misc income' });
      for (let m = 0; m < 6; m++) for (const cat of ['Utilities', 'Rent', 'Supplies', 'Maintenance', 'Marketing', 'Food cost']) A('expenses', { date: dateOff(-m * 30 - ri(0, 25)), amount: ri(4, 60) * 5000, account_id: pick(banks).id, vendor_id: pick(vendors).id, category: cat, reference: 'EX' + ri(1000, 9999), description: cat + ' payment', status: rnd() > 0.15 ? 'paid' : 'pending' });
      const invs = of('sales_invoices', b.id); const bills = of('purchase_invoices', b.id);
      invs.filter((x) => x.paid > 0).forEach((inv) => A('customer_payments', { customer_id: inv.customer_id, invoice_id: inv.id, amount: inv.paid, date: inv.date, method: pick(['Bank transfer', 'Card', 'Cheque']), account_id: banks[0].id, reference: 'CP' + ri(1000, 9999) }));
      bills.filter((x) => x.paid > 0).forEach((bl) => A('vendor_payments', { vendor_id: bl.vendor_id, bill_id: bl.id, amount: bl.paid, date: bl.date, method: pick(['Bank transfer', 'Cheque']), account_id: banks[0].id, reference: 'VP' + ri(1000, 9999) }));
      if (custs.length) for (let i = 0; i < 3; i++) A('credit_notes', { number: 'CN-' + (1001 + i), customer_id: pick(custs).id, invoice_id: invs.length ? pick(invs).id : '', amount: ri(2, 20) * 1000, date: dateOff(-ri(0, 30)), reason: 'Service complaint', status: pick(['open', 'applied']) });
      for (let i = 0; i < 3; i++) A('debit_notes', { number: 'DN-' + (1001 + i), vendor_id: pick(vendors).id, bill_id: bills.length ? pick(bills).id : '', amount: ri(2, 20) * 1000, date: dateOff(-ri(0, 30)), reason: 'Short delivery', status: pick(['open', 'applied']) });
      const ac = (code) => accts.find((a) => a.code === code).id;
      [['5200', '1010', 85000, 'Electricity bill'], ['5100', '1010', 1250000, 'Salaries'], ['1500', '2000', 340000, 'New kitchen equipment'], ['1010', '4300', 45000, 'Interest received'], ['5400', '1000', 60000, 'Facebook ads']].forEach(([d, c, amt, memo], i) => A('journal_entries', { number: 'JE-' + (1001 + i), date: dateOff(-ri(0, 30)), debit_account_id: ac(d), credit_account_id: ac(c), amount: amt, memo, status: 'posted' }));
      const periods = TITLES.budget_periods.map((n, i) => A('budget_periods', { name: n, start: dateOff(-90 + i * 30), end: dateOff(90 + i * 30), status: i === 0 ? 'open' : pick(['open', 'closed']) }));
      const buds = TITLES.budgets.map((n) => { const p = ri(10, 80) * 25000; return A('budgets', { name: n, period_id: periods[0].id, department_id: pick(deps).id, category: n.split(' ')[0], planned: p, actual: Math.round(p * (0.3 + rnd() * 0.9)), status: 'active' }); });
      TITLES.budget_allocations.forEach((n) => { const bd = pick(buds); const amt = Math.round(bd.planned / 4); A('budget_allocations', { budget_id: bd.id, name: n, amount: amt, spent: Math.round(amt * rnd()), month: monthName(0) }); });
    }

    // ---------- recruitment / CRM / projects / goals / contracts / support / workspace
    if (has('recruitment')) {
      const locs = CURATED.job_locations.map((n) => A('job_locations', { name: n, address: n, remote: false }));
      const jobs = TITLES.jobs.map(([t, type]) => A('jobs', { title: t, department_id: pick(deps).id, location_id: pick(locs).id, type, openings: ri(1, 4), salary_range: `LKR ${ri(4, 8) * 10}k–${ri(9, 15) * 10}k`, closing: dateOff(ri(5, 40)), description: 'We are hiring a ' + t.toLowerCase() + '.', status: pick(['open', 'open', 'closed']) }));
      const rounds = CURATED.interview_rounds.map((n, i) => A('interview_rounds', { name: n, order: i + 1, description: n }));
      const cands = []; for (let i = 0; i < 16; i++) { const n = person(); cands.push(A('candidates', { name: n, email: n.toLowerCase().replace(' ', '.') + '@gmail.com', phone: phone(), job_id: pick(jobs).id, experience: ri(0, 10), resume: 'https://example.com/cv/' + i, rating: ri(2, 5), stage: pick(['applied', 'applied', 'screening', 'interview', 'interview', 'offer', 'hired', 'rejected']) })); }
      cands.filter((c) => ['interview', 'offer'].includes(c.stage)).forEach((c) => A('interviews', { candidate_id: c.id, round_id: pick(rounds).id, date: dateOff(ri(-3, 7)), time: pick(['10:00', '11:30', '14:00', '15:30']), interviewer: 'Hiruni Senanayake', mode: pick(['In person', 'Video', 'Phone']), feedback: '', status: 'scheduled' }));
      cands.slice(0, 6).forEach((c) => A('assessments', { candidate_id: c.id, test: pick(TITLES.assessments), score: ri(40, 95), max_score: 100, result: pick(['pass', 'pass', 'fail', 'pending']) }));
      cands.filter((c) => ['offer', 'hired'].includes(c.stage)).forEach((c) => A('offers', { candidate_id: c.id, job_id: c.job_id, salary: ri(6, 15) * 10000, joining: dateOff(ri(7, 30)), expires: dateOff(ri(3, 10)), status: c.stage === 'hired' ? 'accepted' : 'sent' }));
      CURATED.checklist_items.forEach((n, i) => A('checklist_items', { name: n, responsible: pick(['HR', 'IT', 'Manager']), order: i + 1 }));
      cands.filter((c) => c.stage === 'hired').forEach((c) => A('onboarding', { candidate_id: c.id, start: dateOff(ri(-5, 10)), completed_steps: ri(1, 5), total_steps: 6, buddy: person(), status: pick(['pending', 'in_progress']) }));
      TITLES.custom_questions.forEach((q) => A('custom_questions', { question: q, type: pick(['Text', 'Yes/No']), required: rnd() > 0.5 }));
    }
    if (has('crm')) {
      const srcs = CURATED.lead_sources.map((n) => A('lead_sources', { name: n }));
      const pipes = CURATED.pipelines.map((n) => A('pipelines', { name: n, status: 'active' }));
      for (let i = 0; i < 18; i++) A('leads', { name: person(), company: pick(COMPANIES), email: 'lead' + i + '@mail.com', phone: phone(), source_id: pick(srcs).id, owner: 'Lahiru Mendis', value: ri(5, 200) * 10000, follow_up: dateOff(ri(-3, 14)), notes: 'Interested in corporate rates.', stage: pick(['new', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost']) });
      TITLES.deals.forEach((n) => A('deals', { name: n, customer_id: custs.length ? pick(custs).id : '', pipeline_id: pick(pipes).id, value: ri(10, 500) * 10000, probability: ri(10, 90), close_date: dateOff(ri(5, 60)), owner: 'Lahiru Mendis', stage: pick(['discovery', 'proposal', 'negotiation', 'won', 'lost']) }));
      const leads = of('leads', b.id); const deals = of('deals', b.id);
      TITLES.activities.forEach((s) => A('activities', { subject: s, type: pick(['Call', 'Meeting', 'Email', 'Site visit']), lead_id: pick(leads).id, deal_id: pick(deals).id, date: dateOff(ri(-3, 10)), owner: 'Lahiru Mendis', status: pick(['planned', 'planned', 'done']) }));
    }
    if (has('projects')) {
      const projs = TITLES.projects.map((n) => A('projects', { name: n, customer_id: custs.length ? pick(custs).id : '', manager: 'Ishara Weerasinghe', member_ids: pickN(emps, 4).map((e) => e.id), start: dateOff(-ri(10, 60)), end: dateOff(ri(10, 90)), budget: ri(10, 200) * 10000, progress: ri(10, 90), description: n, status: pick(['active', 'active', 'planning', 'on_hold', 'completed']) }));
      TITLES.milestones.forEach((n) => A('milestones', { name: n, project_id: pick(projs).id, due: dateOff(ri(-10, 40)), cost: ri(1, 20) * 10000, status: pick(['pending', 'completed']) }));
      const me = emps[Math.min(14, emps.length - 1)];
      TITLES.tasks.forEach((t, i) => A('tasks', { title: t, project_id: pick(projs).id, assignee_id: i < 3 ? me.id : pick(emps).id, priority: pick(['low', 'medium', 'high', 'critical']), due: dateOff(ri(-3, 20)), estimate_hours: ri(2, 16), description: t, status: pick(['todo', 'in_progress', 'review', 'done']) }));
      TITLES.bugs.forEach((t) => A('bugs', { title: t, project_id: pick(projs).id, assignee_id: pick(emps).id, severity: pick(['minor', 'major', 'critical']), description: t, status: pick(['open', 'in_progress', 'resolved']) }));
      const tasks = of('tasks', b.id);
      for (let i = 0; i < 14; i++) { const t = pick(tasks); A('timesheets', { employee_id: i < 4 ? me.id : t.assignee_id, project_id: t.project_id, task_id: t.id, date: dateOff(-ri(0, 10)), hours: ri(1, 8), notes: 'Worked on ' + t.title.toLowerCase(), status: pick(['submitted', 'approved']) }); }
    }
    if (has('goals')) {
      const gc = CURATED.goal_categories.map((n) => A('goal_categories', { name: n, color: pick(['#0F6E66', '#E8A33D', '#2F6FB0', '#C2413B']) }));
      const goals = TITLES.goals.map(([t, target, unit]) => A('goals', { title: t, category_id: pick(gc).id, owner: 'Nimal Perera', target, current: +(target * (0.4 + rnd() * 0.55)).toFixed(unit === '★' ? 1 : 0), unit, start: dateOff(-90), end: dateOff(90), status: pick(['on_track', 'on_track', 'at_risk', 'behind']) }));
      goals.forEach((g) => { A('goal_milestones', { goal_id: g.id, name: 'Halfway checkpoint', due: dateOff(ri(-10, 30)), status: pick(['pending', 'done']) }); A('goal_tracking', { goal_id: g.id, date: dateOff(-ri(0, 20)), value: g.current, note: 'Monthly update' }); A('contributions', { goal_id: g.id, employee_id: pick(emps).id, amount: ri(1, 20), note: 'Great effort' }); });
    }
    if (has('contracts')) {
      const ct = CURATED.contract_types.map((n) => A('contract_types', { name: n }));
      TITLES.contracts.forEach((s) => A('contracts', { subject: s, party: pick(COMPANIES), type_id: pick(ct).id, value: ri(10, 500) * 10000, start: dateOff(-ri(30, 300)), end: dateOff(ri(-10, 300)), signed: rnd() > 0.2, description: 'Standard terms apply.', status: pick(['active', 'active', 'expiring', 'draft']) }));
    }
    if (has('support')) {
      TITLES.tickets.forEach((s, i) => A('tickets', { number: 'TK-' + (1001 + i), subject: s, customer_id: custs.length ? pick(custs).id : '', category: pick(['Billing', 'Booking', 'Order', 'Technical']), priority: pick(['low', 'medium', 'high', 'urgent']), assignee_id: pick(emps).id, message: s + '. Please assist.', status: pick(['open', 'in_progress', 'waiting', 'resolved']) }));
      TITLES.kb_articles.forEach((t) => A('kb_articles', { title: t, category: 'How-to', content: 'Step-by-step guide: ' + t.toLowerCase() + '.', views: ri(10, 400), status: 'published' }));
      TITLES.faqs.forEach(([q, a], i) => A('faqs', { question: q, answer: a, order: i + 1, status: 'published' }));
      for (let i = 0; i < 5; i++) A('contacts', { name: person(), email: 'visitor' + i + '@mail.com', subject: pick(['Wedding enquiry', 'Group booking', 'Job enquiry', 'Feedback']), message: 'Please contact me.', date: dateOff(-ri(0, 15)), status: pick(['new', 'replied']) });
    }
    if (has('workspace')) {
      TITLES.meetings.forEach((t) => A('meetings', { title: t, date: dateOff(ri(-5, 14)), time: pick(['09:30', '11:00', '15:00']), duration: pick([30, 45, 60]), host: 'Nimal Perera', join_url: 'https://zoom.us/j/' + ri(100000000, 999999999), password: String(ri(100000, 999999)), status: 'scheduled' }));
      const forms = TITLES.forms.map((n, i) => A('forms', { name: n, description: n, fields: i === 0 ? 'Your name:text\nOverall rating:rating\nWhat did you like most?:textarea\nWould you return?:yesno' : i === 1 ? 'Name:text\nEmail:email\nEvent date:date\nGuests:number\nDetails:textarea' : 'Your idea:textarea\nDepartment:text', responses: 0, status: 'active' }));
      for (let i = 0; i < 6; i++) { const f = forms[0]; A('form_responses', { form_id: f.id, submitted_by: person(), answers: 'Overall rating: ' + ri(3, 5) + '\nWhat did you like most?: ' + pick(['The pool', 'Breakfast', 'Staff', 'Location']) + '\nWould you return?: Yes', date: dtOff(-ri(0, 20)) }); f.responses++; }
      TITLES.media.forEach((n) => A('media', { name: n, type: n.endsWith('.pdf') ? 'pdf' : n.endsWith('.mp4') ? 'video' : 'image', size_kb: ri(80, 9000), folder: pick(['Marketing', 'HR', 'Menus']), url: 'https://example.com/media/' + n, uploaded: dateOff(-ri(0, 90)) }));
      TITLES.notes.forEach((t) => A('notes', { title: t, content: t + ' — to be updated.', shared: rnd() > 0.5, color: pick(['#FEF3C7', '#DCFCE7', '#DBEAFE']) }));
    }

    // settings & comms
    db.settings.push({ id: 'set_' + b.id, businessId: b.id, data: defaultSettings(b) });
    const notes = [
      ['New online booking', 'BK-1042 from Booking.com for 3 nights', 'hotel'], ['Low stock', '3 products are below reorder level', 'shop'], ['Order ready', 'Table T3 order is ready to serve', 'restaurant'],
      ['Leave request', 'Chamara Herath applied for 2 days annual leave', 'hrm'], ['Invoice overdue', 'INV-1004 is 5 days overdue', 'sales'], ['New review', 'A guest left a 5-star review', 'customers'],
    ];
    notes.forEach(([title, body, module], i) => db.notifications.push({ id: nid(), businessId: b.id, title, body, module, date: dtOff(0, Math.max(0, new Date().getHours() - i), 10), read: i > 2 }));
    const chat = [['Ayesha Fernando', 'Front office team, VIP arriving at 2 pm in 501 — welcome drink please.'], ['Kasun Silva', 'Noted. Room 501 is inspected and ready.'], ['Chef Anura Dissanayake', 'Prawns stock is low, please order for tomorrow.'], ['Pradeep Rajapaksha', 'PO sent to Serendib Foods, delivery tomorrow 9 am.']];
    chat.forEach(([from, text], i) => db.messages.push({ id: nid(), businessId: b.id, channel: 'general', from, text, date: dtOff(0, Math.max(0, new Date().getHours() - 2), i * 7) }));
  }

  // ---------- users
  for (const u of DEMO_USERS) {
    const emp = u.employee ? db.employees.filter((e) => e.businessId === u.business)[u.employee - 1] : null;
    const cust = u.customer ? db.customers.find((c) => c.businessId === u.business && c.email === u.email) : null;
    db.users.push({ id: 'u_' + u.email.split('@')[0].replace(/\W/g, '_') + '_' + (u.business || 'p'), name: u.name, email: u.email, password: u.password || DEMO_PASSWORD, role: u.role, businessId: u.business, employeeId: emp ? emp.id : null, customerId: cust ? cust.id : null, phone: phone(), status: 'active', last_login: dtOff(-ri(0, 5)), created_at: dtOff(-ri(30, 200)) });
  }
  for (let i = 0; i < 20; i++) { const u = pick(db.users); db.login_history.push({ id: nid(), user_name: u.name, role: u.role, ip: `112.134.${ri(1, 254)}.${ri(1, 254)}`, device: pick(['Chrome on Windows', 'Safari on iPhone', 'Chrome on Android']), date: dtOff(-ri(0, 10)), status: rnd() > 0.1 ? 'success' : 'failed' }); }
  for (const b of BIZ) for (let i = 0; i < 12; i++) { const u = pick(db.users.filter((x) => x.businessId === b.id)); db.audit_log.push({ id: nid(), businessId: b.id, user_name: u.name, action: pick(['created', 'updated', 'deleted', 'checked_in', 'paid', 'approved']), entity: pick(['Reservations', 'Orders', 'Products', 'Invoices', 'Leave applications']), record: '#' + ri(1000, 9999), date: dtOff(-ri(0, 7)) }); }
  pruneToExamples(db);
  db.platform_settings = [{ id: 'platform', data: { app_name: 'NexaERP', support_email: 'support@nexaerp.com', default_language: 'English', default_currency: 'LKR', allow_signup: true, email_verification: false, maintenance_mode: false, cookie_consent: true, cookie_text: 'We use cookies to improve your experience.', seo_title: 'NexaERP — Hotel, Restaurant & Retail ERP', seo_description: 'All-in-one ERP for hotels, restaurants, shops and companies.', storage: 'Local', cache_driver: 'file', pusher_enabled: false, gateways: Object.fromEntries(PAYMENT_GATEWAYS.map((g, i) => [g, { enabled: i < 4 || g === 'Bank transfer', mode: 'sandbox' }])) } }];
  return db;
}

export function defaultSettings(b) {
  return {
    brand_name: b.name, tagline: '', logo_emoji: '🌿', primary_color: '#0F6E66',
    email: b.email, phone: '+94 81 000 0000', address: b.address || b.city, tax_number: 'VAT-' + Math.floor(100000 + Math.random() * 899999),
    currency: 'LKR', currency_symbol: 'Rs', decimals: 2, timezone: 'Asia/Colombo', date_format: 'DD MMM YYYY', language: 'English',
    invoice_prefix: 'INV-', invoice_footer: 'Thank you for your business!', receipt_footer: 'Thank you — come again!',
    check_in_time: '14:00', check_out_time: '12:00', night_audit_time: '23:59', service_charge: 10, vat: 18, tdl: 1,
    kot_auto_print: true, qr_ordering: true, qr_payment_required: false, table_service_charge: true,
    loyalty_enabled: true, points_per_100: 1, point_value: 1, low_stock_alert: true, allow_negative_stock: false,
    email_notifications: { new_booking: true, check_out_invoice: true, low_stock: true, leave_request: true, payslip: true, order_ready: false },
    gateways: Object.fromEntries(PAYMENT_GATEWAYS.map((g, i) => [g, { enabled: ['Stripe', 'PayHere', 'Bank transfer'].includes(g), mode: 'sandbox', key: '', secret: '' }])),
    integrations: Object.fromEntries(INTEGRATIONS.map((x) => [x.key, { enabled: ['smtp', 'pusher'].includes(x.key), values: {} }])),
    website: { hero_title: 'Ceylon Ayu Resort', hero_subtitle: 'A peaceful garden resort with an outdoor pool in the hills of Kandy — minutes from the Temple of the Tooth, Kandy Lake and the Royal Botanical Gardens.', about: 'Set among gardens on the edge of Kandy, Ceylon Ayu Resort is a calm base for exploring Sri Lanka’s hill capital. Relax by the outdoor pool, enjoy the terrace and garden, and dine on Sri Lankan, seafood and Irish favourites at our restaurant. Free private parking for every guest, and only 3 km from Kandy railway station.', phone: '+94 81 000 0000', email: 'info@ceylonayu.lk', whatsapp: '', map_query: 'Ceylon Ayu Resort, 294 George E. de Silva Mawatha, Kandy', photos: {}, room_photos: {} },
  };
}

// =====================================================================
//  Keep the hotel's set-up (rooms, menu, tables, staff…) but only ONE or
//  TWO clear examples of each kind of activity, so the demo is easy to read.
// =====================================================================
function pruneToExamples(db) {
  const t0 = dateOff(0), tm1 = dateOff(-1);
  const byNew = (a, b) => String(b.created_at || b.date || '').localeCompare(String(a.created_at || a.date || ''));
  const keep = (col, fn) => { db[col] = (db[col] || []).filter(fn); };
  const firstN = (col, n, fn = () => true) => { db[col] = (db[col] || []).filter(fn).sort(byNew).slice(0, n); };
  // staff: only people with a login
  const empIds = new Set(db.users.map((u) => u.employeeId).filter(Boolean));
  keep('employees', (e) => empIds.has(e.id));
  // reservations: 1 in-house (the guest portal guest), 1 arriving today, 1 left yesterday, 1 future website, 1 future Booking.com
  const R = db.reservations; const emma = db.customers.find((c) => c.email === 'guest@ceylonayu.lk');
  const pickR = (fn) => R.find(fn);
  const inHouse = pickR((r) => r.status === 'checked_in' && r.guest_id === emma?.id) || pickR((r) => r.status === 'checked_in');
  const arrival = pickR((r) => r.status === 'confirmed' && r.check_in === t0 && r.room_id !== inHouse?.room_id);
  const left = pickR((r) => r.status === 'checked_out' && r.room_id !== inHouse?.room_id && r.room_id !== arrival?.room_id);
  const future = R.filter((r) => ['confirmed', 'tentative'].includes(r.status) && r.check_in > t0 && ![inHouse, arrival, left].some((x) => x && x.room_id === r.room_id)).slice(0, 2);
  if (left) { left.check_out = t0; left.check_in = dateOff(-2); }
  if (future[0]) { future[0].source = 'Website'; future[0].status = 'confirmed'; }
  if (future[1]) { future[1].source = 'Booking.com'; future[1].ota_ref = '4417820931'; future[1].status = 'confirmed'; }
  const keepRes = new Set([inHouse, arrival, left, ...future].filter(Boolean).map((r) => r.id));
  keep('reservations', (r) => keepRes.has(r.id));
  for (const r of db.reservations) if (r.status !== 'checked_in') { r.parking_slot_id = ''; }
  keep('folio_charges', (c) => keepRes.has(c.reservation_id)); keep('folio_payments', (c) => keepRes.has(c.reservation_id)); keep('registration_cards', (c) => keepRes.has(c.reservation_id));
  // rooms: everything clean & free, except the examples
  for (const rm of db.rooms) rm.status = 'available';
  const roomOf = (r) => r && db.rooms.find((x) => x.id === r.room_id);
  if (roomOf(inHouse)) roomOf(inHouse).status = 'occupied';
  if (roomOf(arrival)) roomOf(arrival).status = 'reserved';
  if (roomOf(left)) roomOf(left).status = 'dirty';
  // housekeeping & maintenance: one each
  db.housekeeping = []; if (roomOf(left)) db.housekeeping.push({ id: nid(), businessId: 'b1', created_at: dtOff(0, 11), room_id: roomOf(left).id, task: 'Checkout clean', assigned_to: db.employees.find((e) => e.name === 'Malini Jayawardena')?.id || '', priority: 'high', date: t0, notes: 'Guest left this morning', status: 'pending' });
  firstN('maintenance', 1); if (db.maintenance[0]) { db.maintenance[0].status = 'open'; db.maintenance[0].priority = 'normal'; db.maintenance[0].issue = 'Bathroom tap is dripping'; db.maintenance[0].room_id = roomOf(inHouse)?.id || db.maintenance[0].room_id; }
  // customers: guests of kept bookings + 2 diners
  const custIds = new Set(db.reservations.map((r) => r.guest_id)); if (emma) custIds.add(emma.id);
  const extra = db.customers.filter((c) => !custIds.has(c.id)).slice(0, 2); extra.forEach((c) => custIds.add(c.id));
  keep('customers', (c) => custIds.has(c.id));
  // restaurant: one open (waiting for chef), one ready to collect, two paid (today & yesterday)
  const O = db.restaurant_orders;
  const openO = O.find((o) => o.status === 'preparing' && o.table_id); const readyO = O.find((o) => o.status === 'ready' && o.table_id);
  const paidToday = O.find((o) => o.status === 'paid' && String(o.date).slice(0, 10) === t0); const paidY = O.find((o) => o.status === 'paid' && String(o.date).slice(0, 10) === tm1 && o.type === 'room_service') || O.find((o) => o.status === 'paid' && String(o.date).slice(0, 10) === tm1);
  const keepO = new Set([openO, readyO, paidToday, paidY].filter(Boolean).map((o) => o.id));
  keep('restaurant_orders', (o) => keepO.has(o.id)); keep('kots', (k) => keepO.has(k.order_id));
  for (const k of db.kots) { if (k.order_id === openO?.id) k.status = 'new'; if (k.order_id === readyO?.id) k.status = 'ready'; }
  for (const t of db.tables) t.status = 'free';
  for (const o of [openO, readyO]) { const t = o && db.tables.find((x) => x.id === o.table_id); if (t) t.status = 'occupied'; }
  if (paidY && paidY.type === 'room_service' && inHouse) paidY.room_reservation_id = inHouse.id;
  firstN('table_reservations', 1); if (db.table_reservations[0]) Object.assign(db.table_reservations[0], { date: t0, time: '19:30', status: 'booked', customer_name: 'Sanduni Perera', guests: 4, occasion: 'Birthday', table_id: db.tables.find((t) => t.status === 'free' && t.seats >= 4)?.id });
  firstN('waitlist', 1); if (db.waitlist[0]) db.waitlist[0].status = 'waiting';
  firstN('service_calls', 0);
  // parking: guest car + one visitor in the log
  keep('parking_logs', (l) => (l.status === 'parked' && l.reservation_id === inHouse?.id));
  const visitorLog = { id: nid(), businessId: 'b1', created_at: dtOff(-1, 12), slot_id: db.parking_slots[3].id, vehicle_no: 'CAR-5521', vehicle_type: 'Car', driver: 'Restaurant guest', reservation_id: '', purpose: 'Restaurant guest', time_in: dtOff(-1, 12, 10), time_out: dtOff(-1, 14, 5), fee: 0, status: 'left' };
  db.parking_logs.push(visitorLog);
  for (const sl of db.parking_slots) { const lg = db.parking_logs.find((l) => l.slot_id === sl.id && l.status === 'parked'); if (sl.status !== 'out_of_service') { sl.status = lg ? 'occupied' : 'free'; sl.vehicle_no = lg ? lg.vehicle_no : ''; } }
  if (inHouse) { const lg = db.parking_logs.find((l) => l.reservation_id === inHouse.id); inHouse.parking_slot_id = lg ? lg.slot_id : ''; inHouse.vehicle_no = lg ? lg.vehicle_no : ''; }
  // guest services: one taxi coming up, one done; one open request, one done
  firstN('transport_bookings', 2); db.transport_bookings.forEach((t, i) => Object.assign(t, { number: 'TR-' + (1001 + i), reservation_id: inHouse?.id || '', guest_name: db.customers.find((c) => c.id === inHouse?.guest_id)?.name || t.guest_name, status: i ? 'completed' : 'confirmed', type: i ? 'Temple of the Tooth' : 'Airport drop', pickup: 'Ceylon Ayu Resort', dropoff: i ? 'Sri Dalada Maligawa' : 'Bandaranaike Airport (BIA)', pickup_time: i ? dtOff(-1, 17, 30) : `${inHouse?.check_out || dateOff(2)}T09:00`, fare: i ? 1500 : 18500, charge_to_room: true, charged: !!i }));
  firstN('guest_requests', 2); db.guest_requests.forEach((q, i) => Object.assign(q, { room: roomOf(inHouse)?.number || '101', guest_name: db.customers.find((c) => c.id === inHouse?.guest_id)?.name || 'Guest', type: i ? 'Drinking water' : 'Extra towels', status: i ? 'done' : 'new', priority: 'normal', source: 'Room QR', details: '', created: dtOff(0, Math.max(7, new Date().getHours() - i * 2), 5) }));
  firstN('channel_sync_logs', 2); firstN('laundry', 1); firstN('lost_found', 1);
  // money & stores: one of each
  for (const c of ['purchase_orders', 'grns', 'purchase_invoices', 'purchase_returns', 'vendor_payments', 'customer_payments', 'revenues', 'bank_transactions', 'bank_transfers_internal', 'credit_notes', 'debit_notes', 'journal_entries', 'transfers', 'budgets', 'budget_allocations', 'sales_invoices', 'proposals', 'quotations', 'sales_returns']) firstN(c, 1);
  firstN('expenses', 3);
  // people: one of each
  for (const c of ['leave_applications', 'announcements', 'events', 'documents', 'acknowledgments', 'awards', 'promotions_hr', 'hr_transfers', 'warnings', 'complaints', 'resignations', 'terminations', 'trainings', 'reviews', 'employee_goals', 'salary_components', 'jobs', 'candidates', 'interviews', 'assessments', 'offers', 'onboarding', 'timesheets']) firstN(c, 1);
  const staffEmp = db.users.find((u) => u.email === 'staff@ceylonayu.lk')?.employeeId;
  for (const e of Object.values(ENTITIES)) { const f = e.fields.find((x) => x.k === 'employee_id'); if (!f || !db[e.key] || e.key === 'attendance' || e.key === 'payslips' || e.key === 'rosters') continue; for (const r of db[e.key]) if (!empIds.has(r.employee_id)) r.employee_id = staffEmp; }
  db.expenses.forEach((x, i) => Object.assign(x, { amount: [18500, 42000, 9600][i], category: ['Utilities', 'Food cost', 'Maintenance'][i], description: ['Electricity bill', 'Fish & vegetables from market', 'Pool cleaning'][i], date: dateOff(-i - 1), status: 'paid' }));
  db.purchase_invoices.forEach((x) => { x.items = x.items.slice(0, 2); });
  if (db.leave_applications[0]) Object.assign(db.leave_applications[0], { status: 'pending', start: dateOff(5), end: dateOff(6), days: 2, reason: 'Family function' });
  keep('attendance', (a) => [t0, tm1].includes(a.date)); keep('rosters', (r) => r.date === t0);
  const lastMonth = db.payslips.map((p) => p.month).sort().pop(); keep('payslips', (p) => p.month === db.payslips[db.payslips.length - 1].month); void lastMonth;
  firstN('holidays', 3, (h) => h.date >= t0);
  // guests & marketing: a few
  firstN('feedback', 3, (f) => f.rating >= 4); db.feedback.forEach((f, i) => Object.assign(f, { comment: ['Peaceful garden and a lovely pool. Staff went out of their way for us.', 'The Kandyan rice and curry was the best we had in Sri Lanka!', 'Clean rooms, easy parking and only minutes from the temple.'][i] || f.comment, rating: 5 }));
  for (const c of ['gift_cards', 'promotions', 'campaigns']) firstN(c, 1);
  // logs
  firstN('notifications', 3); firstN('messages', 2); firstN('audit_log', 4); firstN('login_history', 3);
  db.night_audits = db.night_audits.sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  // integrity: drop records whose required link points to something removed; clear optional broken links
  const ids = {}; for (const [k, v] of Object.entries(db)) if (Array.isArray(v)) ids[k] = new Set(v.map((r) => r.id));
  for (const e of Object.values(ENTITIES)) {
    if (!db[e.key]) continue;
    db[e.key] = db[e.key].filter((r) => e.fields.every((f) => !(f.t === 'ref' && f.req && r[f.k] && ids[f.ref] && !ids[f.ref].has(r[f.k]))));
    for (const r of db[e.key]) for (const f of e.fields) { if (f.t === 'ref' && r[f.k] && ids[f.ref] && !ids[f.ref].has(r[f.k])) r[f.k] = ''; if (f.t === 'refs' && Array.isArray(r[f.k]) && ids[f.ref]) r[f.k] = r[f.k].filter((x) => ids[f.ref].has(x)); }
  }
}
