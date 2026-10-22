# Ceylon Ayu Resort Kandy — Hotel & Restaurant ERP

A complete hotel + restaurant system with a public website, built only for hotel and restaurant operations.

- **CREDENTIALS.md** — all logins and the 5-minute demo script
- **DEPLOY.md** — Vercel deployment

## What’s inside
**Website:** hero with booking bar, rooms, dining, experiences, Explore Kandy, reviews, map, contact; online room booking with pay-now; 3D table booking. Photos are managed by the owner in *Administration → Website & photos*.

**Front office:** front desk room board, room chart, booking wizard with full guest registration (title, first & last name, ID type & number, nationality, DOB, address, purpose, vehicle), walk-in check-in, printable registration card, room bill with service charge, tourism levy and VAT, payments, check-out, guest billing & invoices, night audit.

**Online & channels:** website booking engine, channel manager (14-day availability & rate grid, push to OTAs, sync log), OTA/travel-agent bookings with reference numbers, rate plans & seasons, meal plans.

**Rooms & housekeeping:** housekeeping board, rooms, room types, printable room QR cards, maintenance, laundry, minibar, lost & found.

**Guest services:** guest requests from the room QR (towels, cleaning, repairs, late check-out…), taxi & airport transfers (charged to room when completed), drivers & partners, parking board with bays, vehicle log and charge-to-room, spa/tours/extras, table & room calls.

**Restaurant:** touch POS, 3D floor & table management, waiter service board, kitchen display, KOT per station, chef accept → ready → waiter served workflow with notifications and sound, QR table menu with call-waiter & ask-for-bill, room-service ordering auto-charged to the room, table bookings, waitlist, menu, modifiers, recipes & food cost, kitchen & bar stock, reports.

**Back office:** purchasing & stores, accounts (P&L, balance sheet, trial balance, ledger, VAT), budgets, HR & payroll (staff, attendance, rosters, leave, payslips, training, reviews, hiring).

**Administration:** users, roles & permissions grid (owner controls everything), settings, website & photos, payment gateways (PayHere, Sampath/Commercial/HNB IPG, LankaQR, Stripe, PayPal…), integrations, taxes, printers, activity and login history.

**Every role has its own dashboard** with a plain-language summary of today, alerts, figures, lists and quick actions.

## Structure
`frontend/` React website & ERP (deploy to Vercel) · `shared/` all business rules · `backend/` Node API for phase 2.

## Checks run
TypeScript + production build ✔ · 48 logic tests ✔ · 17 API tests ✔ · every menu page for all 16 logins in a real browser (~640 visits, 0 errors) ✔ · live workflow: room QR order → chef → waiter → room bill, table call, parking, walk-in booking with ID, channel push ✔
