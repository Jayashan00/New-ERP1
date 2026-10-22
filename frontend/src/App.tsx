import { lazy, Suspense, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { ConfirmProvider, Spinner, ErrorBox } from '@/components/ui';
import { AppLayout } from '@/components/Layout';
import { Login, Landing } from '@/pages/public/Login';
import Dashboard from '@/pages/Dashboard';
import EntityPage from '@/pages/EntityPage';

const L = (f: () => Promise<any>, name: string) => lazy(() => f().then((m) => ({ default: m[name] })));
const ops = () => import('@/pages/ops');
const hotel = () => import('@/pages/hotel'), rest = () => import('@/pages/restaurant'), shop = () => import('@/pages/shop'), fin = () => import('@/pages/finance'), hr = () => import('@/pages/hr'), adm = () => import('@/pages/admin'), com = () => import('@/pages/common'), pub = () => import('@/pages/public/Guest');

// page key -> component (permission key is "page:<key>")
const PAGES: Record<string, any> = {
  'front-desk': L(hotel, 'FrontDesk'), 'room-chart': L(hotel, 'RoomChart'), 'new-booking': L(hotel, 'NewBooking'), 'housekeeping-board': L(hotel, 'HousekeepingBoard'), 'night-audit': L(hotel, 'NightAudit'), 'hotel-reports': L(hotel, 'HotelReports'), 'booking-engine': L(hotel, 'BookingEngine'),
  'restaurant-pos': L(rest, 'RestaurantPOS'), 'floor-plan': L(rest, 'FloorPlan'), 'kitchen-display': L(rest, 'KitchenDisplay'), 'qr-codes': L(rest, 'QRCodes'), 'restaurant-reports': L(rest, 'RestaurantReports'),
  'shop-pos': L(shop, 'ShopPOS'), 'stock-levels': L(shop, 'StockLevels'), 'barcode-labels': L(shop, 'BarcodeLabels'), 'online-store': L(shop, 'OnlineStore'), 'shop-reports': L(shop, 'ShopReports'),
  'accounting-dashboard': L(fin, 'AccountingDashboard'), ledger: L(fin, 'Ledger'), 'trial-balance': L(fin, 'TrialBalance'), 'balance-sheet': L(fin, 'BalanceSheet'), 'profit-loss': L(fin, 'ProfitLoss'), 'tax-report': L(fin, 'TaxReport'), 'budget-monitor': L(fin, 'BudgetMonitor'),
  'hrm-dashboard': L(hr, 'HrmDashboard'), 'leave-balance': L(hr, 'LeaveBalance'), 'run-payroll': L(hr, 'RunPayroll'), 'crm-dashboard': L(hr, 'CrmDashboard'), 'projects-dashboard': L(hr, 'ProjectsDashboard'),
  'my-attendance': L(hr, 'MyAttendance'), 'my-leaves': L(hr, 'MyLeaves'), 'my-payslips': L(hr, 'MyPayslips'), 'my-tasks': L(hr, 'MyTasks'), 'my-bookings': L(hr, 'MyBookings'), 'my-orders': L(hr, 'MyOrders'),
  users: L(adm, 'Users'), roles: L(adm, 'Roles'), settings: L(adm, 'Settings'), 'payment-gateways': L(adm, 'PaymentGateways'), integrations: L(adm, 'Integrations'), subscription: L(adm, 'Subscription'), 'helpdesk-request': L(adm, 'HelpdeskRequest'), 'platform-settings': L(adm, 'PlatformSettings'), profile: L(adm, 'Profile'),
  parking: L(ops, 'Parking'), 'channel-manager': L(ops, 'ChannelManager'), 'service-board': L(ops, 'ServiceBoard'), 'guest-billing': L(ops, 'GuestBilling'), 'room-qr': L(ops, 'RoomQRCodes'), website: L(ops, 'WebsiteSettings'),
  calendar: L(com, 'CalendarPage'), messenger: L(com, 'Messenger'), reports: L(com, 'ReportsCentre'), 'form-builder': L(com, 'FormBuilder'),
};
const AllUsers: any = L(adm, 'Users');
const hotelPub = () => import('@/pages/public/Hotel');
const HotelSite = L(hotelPub, 'HotelSite'), RoomQR = L(hotelPub, 'RoomQR'), DineBooking = L(hotelPub, 'DineBooking');
const QRMenu = L(pub, 'QRMenu'), BookOnline = L(pub, 'BookOnline'), StorePublic = L(pub, 'StorePublic'), PublicForm = L(pub, 'PublicForm');

function RequireAuth({ children }: { children: ReactNode }) {
  const { me, ready } = useAuth();
  if (!ready) return <Spinner label="Starting…" />;
  if (!me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageRoute() {
  const { page = '' } = useParams();
  const { can, isSuper } = useAuth();
  if (page === 'dashboard' || page === 'platform-dashboard') return <Dashboard />;
  if (page === 'all-users') return isSuper ? <AllUsers all /> : <ErrorBox error={{ status: 403 }} />;
  const C = PAGES[page];
  if (!C) return <ErrorBox error={{ message: 'This page does not exist. Use the menu on the left.' }} />;
  if (page !== 'profile' && !can('page:' + page)) return <ErrorBox error={{ status: 403 }} />;
  return <C />;
}

function Home() { return <HotelSite />; }
void Landing;

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider><ConfirmProvider><AuthProvider>
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/menu/:slug" element={<QRMenu />} />
            <Route path="/menu/:slug/:table" element={<QRMenu />} />
            <Route path="/book/:slug" element={<BookOnline />} />
            <Route path="/room/:slug/:room" element={<RoomQR />} />
            <Route path="/dine/:slug" element={<DineBooking />} />
            <Route path="/store/:slug" element={<StorePublic />} />
            <Route path="/f/:slug/:id" element={<PublicForm />} />
            <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="e/:entity" element={<EntityPage />} />
              <Route path=":page" element={<PageRoute />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider></ConfirmProvider></ToastProvider>
    </BrowserRouter>
  );
}
