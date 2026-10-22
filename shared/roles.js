// =====================================================================
//  ROLES & PERMISSIONS
//  grants: { key: 'vced' }  v=view c=create e=edit d=delete
//  key may be '*', 'mod:<module>', an entity key, or 'page:<page>'.
//  deny: keys/modules this role can never touch.
//  self: true -> records with an ownerField are limited to the user's own.
// =====================================================================
import { MODULE_OF } from './modules.js';
import { ENTITIES } from './entities.js';

const ALL = 'vced';
const V = 'v';

const STAFF_BASE = {
  'page:dashboard': V, 'page:calendar': V, 'page:messenger': V,
  'page:my-attendance': V, 'page:my-leaves': V, 'page:my-payslips': V, 'page:my-tasks': V,
  notes: ALL, announcements: V, events: V, holidays: V, kb_articles: V, meetings: V,
};

export const DEFAULT_ROLES = [
  {
    key: 'super_admin', name: 'Owner / Super admin', dashboard: 'owner', color: '#7C3AED', system: true,
    desc: 'The resort owner. Sees and controls everything, and decides what every other role may do.',
    grants: { '*': ALL },
  },
  {
    key: 'business_owner', name: 'General manager', dashboard: 'owner', color: '#0F6E66', system: true,
    desc: 'Runs the whole resort day to day: rooms, restaurant, staff, money and reports.',
    grants: { '*': ALL }, deny: ['page:roles'],
  },
  {
    key: 'hotel_manager', name: 'Front office manager', dashboard: 'hotel', color: '#2F6FB0',
    desc: 'Rooms, rates, online channels, housekeeping, guest services and hotel reports.',
    grants: { ...STAFF_BASE, 'mod:hotel': ALL, 'mod:distribution': ALL, 'mod:rooms': ALL, 'mod:guestservices': ALL, 'mod:customers': ALL, customers: ALL, 'page:reports': V, 'page:hotel-reports': V, employees: V, attendance: V, rosters: ALL, shifts: V, restaurant_orders: V, table_reservations: V, expenses: 'vc' },
  },
  {
    key: 'front_office', name: 'Receptionist', dashboard: 'frontdesk', color: '#3B82F6',
    desc: 'Bookings, check-in with ID, room bills, payments, check-out, guest requests, taxis and parking.',
    grants: { ...STAFF_BASE, 'page:front-desk': V, 'page:room-chart': V, 'page:new-booking': V, 'page:guest-billing': V, 'page:housekeeping-board': V, 'page:booking-engine': V, 'page:parking': V, 'page:room-qr': V, reservations: 'vce', customers: 'vce', folio_charges: 'vc', folio_payments: 'vc', registration_cards: 'vc', rooms: 've', room_types: V, rate_plans: V, meal_plans: V, extra_services: V, travel_agents: V, housekeeping: 'vc', maintenance: 'vc', laundry: 'vce', lost_found: 'vce', minibar_items: V, guest_requests: 'vce', transport_bookings: 'vce', transport_vendors: V, parking_slots: 've', parking_logs: 'vce', service_calls: 've', feedback: 'vc', table_reservations: 'vc', gift_cards: V, channels: V },
  },
  {
    key: 'reservations_agent', name: 'Reservations & channels', dashboard: 'frontdesk', color: '#0EA5E9',
    desc: 'Website, travel-agent and OTA bookings, rates, availability and the channel manager.',
    grants: { ...STAFF_BASE, 'mod:distribution': ALL, 'page:room-chart': V, 'page:new-booking': V, 'page:front-desk': V, reservations: 'vce', customers: 'vce', folio_payments: 'vc', rooms: V, room_types: 've', promotions: 'vce' },
  },
  {
    key: 'housekeeping', name: 'Housekeeping', dashboard: 'housekeeping', color: '#14B8A6',
    desc: 'Rooms to clean, room status, guest requests, repairs, laundry, minibar and lost items.',
    grants: { ...STAFF_BASE, 'page:housekeeping-board': V, housekeeping: 've', rooms: 've', guest_requests: 've', maintenance: 'vc', lost_found: 'vce', laundry: 've', minibar_items: 've' },
  },
  {
    key: 'concierge', name: 'Concierge / Transport & parking', dashboard: 'concierge', color: '#F59E0B',
    desc: 'Taxis, airport transfers, tours, parking and guest requests.',
    grants: { ...STAFF_BASE, 'mod:guestservices': ALL, 'page:parking': V, reservations: V, customers: V, rooms: V, folio_charges: 'vc' },
  },
  {
    key: 'restaurant_manager', name: 'Restaurant manager', dashboard: 'restaurant', color: '#EA580C',
    desc: 'Menu, tables, kitchen, waiters, kitchen stock and restaurant reports.',
    grants: { ...STAFF_BASE, 'mod:restaurant': ALL, service_calls: ALL, customers: 'vce', promotions: ALL, feedback: ALL, loyalty_tiers: V, gift_cards: V, vendors: V, purchase_orders: 'vce', grns: 'vc', 'page:reports': V, employees: V, attendance: V, rosters: ALL, expenses: 'vc', reservations: V },
  },
  {
    key: 'cashier', name: 'Cashier', dashboard: 'cashier', color: '#CA8A04',
    desc: 'Settles restaurant bills, room charges and guest payments.',
    grants: { ...STAFF_BASE, 'page:restaurant-pos': V, 'page:floor-plan': V, 'page:guest-billing': V, restaurant_orders: 'vce', customers: 'vc', gift_cards: V, promotions: V, menu_items: V, menu_categories: V, tables: 've', areas: V, kots: V, reservations: V, folio_payments: 'vc', service_calls: 've' },
  },
  {
    key: 'waiter', name: 'Waiter / Steward', dashboard: 'waiter', color: '#D97706',
    desc: 'Seats guests, takes orders, collects ready dishes and answers table calls.',
    grants: { ...STAFF_BASE, 'page:floor-plan': V, 'page:restaurant-pos': V, 'page:service-board': V, restaurant_orders: 'vce', tables: 've', areas: V, table_reservations: 'vce', waitlist: 'vce', menu_items: V, menu_categories: V, kots: 've', customers: 'vc', reservations: V, service_calls: 've' },
  },
  {
    key: 'chef', name: 'Chef / Kitchen', dashboard: 'kitchen', color: '#DC2626',
    desc: 'Kitchen tickets, dish availability, recipes and kitchen stock.',
    grants: { ...STAFF_BASE, 'page:kitchen-display': V, kots: 've', menu_items: 've', menu_categories: V, recipes: 'vce', ingredients: 've', restaurant_orders: V },
  },
  {
    key: 'storekeeper', name: 'Storekeeper', dashboard: 'store', color: '#65A30D',
    desc: 'Receives deliveries, issues stock to kitchen, bar and housekeeping, and counts stock.',
    grants: { ...STAFF_BASE, 'mod:purchase': ALL, ingredients: 've', bar_stock: 've', minibar_items: 've' },
  },
  {
    key: 'accountant', name: 'Accountant', dashboard: 'finance', color: '#0891B2',
    desc: 'Guest billing, supplier bills, banking, payroll costs, budgets and financial reports.',
    grants: { ...STAFF_BASE, 'mod:accounting': ALL, 'mod:purchase': 'v', purchase_invoices: ALL, vendor_payments: ALL, 'page:guest-billing': V, customers: 've', taxes: 've', payslips: V, 'page:reports': V, night_audits: V, restaurant_orders: V, reservations: V, folio_charges: V, folio_payments: 'vc', travel_agents: 've' },
  },
  {
    key: 'hr_manager', name: 'HR manager', dashboard: 'hr', color: '#DB2777',
    desc: 'Staff records, attendance, rosters, leave, payroll, hiring and training.',
    grants: { ...STAFF_BASE, 'mod:hrm': ALL, 'page:reports': V },
  },
  {
    key: 'employee', name: 'Staff (self-service)', dashboard: 'employee', color: '#64748B', self: true,
    desc: 'Clock in and out, apply for leave, see payslips and announcements.',
    grants: { ...STAFF_BASE, leave_applications: 'vc', attendance: V, payslips: V, reviews: V, resignations: 'vc', documents: V },
  },
  {
    key: 'customer', name: 'Guest portal', dashboard: 'customer', color: '#16A34A',
    desc: 'A guest sees their stays, bills, orders and loyalty points.',
    grants: { 'page:dashboard': V, 'page:my-bookings': V, 'page:my-orders': V, feedback: 'c' },
  },
];

export function moduleOfKey(key) {
  if (MODULE_OF[key]) return MODULE_OF[key];
  if (ENTITIES[key]) return ENTITIES[key].module;
  return null;
}

/** Can a role perform action (v/c/e/d) on a permission key? */
export function can(role, key, action = 'v') {
  if (!role) return false;
  const mod = moduleOfKey(key);
  if (role.deny && role.deny.some((d) => d === key || (mod && d === 'mod:' + mod))) return false;
  const g = role.grants || {};
  const has = (k) => typeof g[k] === 'string' && g[k].includes(action);
  return has(key) || (mod && has('mod:' + mod)) || has('*');
}

export const DEMO_PASSWORD = 'Demo@1234';
export const SUPER_PASSWORD = 'Admin@1234';

// Demo logins. business: index into seeded businesses (b1..b4). employee: links to an employee record.
export const DEMO_USERS = [
  { name: 'Resort Owner', email: 'owner@ceylonayu.lk', role: 'super_admin', business: 'b1', password: SUPER_PASSWORD },
  { name: 'Nimal Perera', email: 'gm@ceylonayu.lk', role: 'business_owner', business: 'b1' },
  { name: 'Ayesha Fernando', email: 'fom@ceylonayu.lk', role: 'hotel_manager', business: 'b1', employee: 1 },
  { name: 'Kasun Silva', email: 'reception@ceylonayu.lk', role: 'front_office', business: 'b1', employee: 2 },
  { name: 'Malini Jayawardena', email: 'housekeeping@ceylonayu.lk', role: 'housekeeping', business: 'b1', employee: 3 },
  { name: 'Ravi Kumar', email: 'restaurant@ceylonayu.lk', role: 'restaurant_manager', business: 'b1', employee: 4 },
  { name: 'Dilani Wickrama', email: 'cashier@ceylonayu.lk', role: 'cashier', business: 'b1', employee: 5 },
  { name: 'Suresh Bandara', email: 'waiter@ceylonayu.lk', role: 'waiter', business: 'b1', employee: 6 },
  { name: 'Chef Anura Dissanayake', email: 'chef@ceylonayu.lk', role: 'chef', business: 'b1', employee: 7 },
  { name: 'Tharushi de Silva', email: 'reservations@ceylonayu.lk', role: 'reservations_agent', business: 'b1', employee: 8 },
  { name: 'Pradeep Rajapaksha', email: 'store@ceylonayu.lk', role: 'storekeeper', business: 'b1', employee: 9 },
  { name: 'Sanjeewa Gunasekara', email: 'accounts@ceylonayu.lk', role: 'accountant', business: 'b1', employee: 10 },
  { name: 'Hiruni Senanayake', email: 'hr@ceylonayu.lk', role: 'hr_manager', business: 'b1', employee: 11 },
  { name: 'Lahiru Mendis', email: 'concierge@ceylonayu.lk', role: 'concierge', business: 'b1', employee: 12 },
  { name: 'Chamara Herath', email: 'staff@ceylonayu.lk', role: 'employee', business: 'b1', employee: 13 },
  { name: 'Emma Thompson', email: 'guest@ceylonayu.lk', role: 'customer', business: 'b1', customer: 1 },
];
