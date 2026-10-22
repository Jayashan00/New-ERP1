// =====================================================================
//  ENTITY SCHEMAS — single source of truth for every data screen.
//  Used by the frontend (tables, forms, detail views) and the backend
//  (validation, permissions). Field spec: "key|Label|type"
//    key ending with *  -> required
//    types: text textarea number money percent date datetime time email
//           phone url color rating bool password image
//           select:a,b,c  multi:a,b,c  ref:entity  refs:entity  items
// =====================================================================

function parseField(spec) {
  const [rawKey, label, rawType = 'text'] = spec.split('|');
  const required = rawKey.endsWith('*');
  const k = rawKey.replace('*', '');
  const [t, arg] = rawType.split(/:(.*)/s);
  const f = { k, l: label, t, req: required };
  if (t === 'select' || t === 'multi') f.opts = arg.split(',');
  if (t === 'ref' || t === 'refs') f.ref = arg;
  return f;
}

export const ENTITIES = {};

function E(module, key, label, desc, fields, extra = {}) {
  const parsed = fields.map(parseField);
  ENTITIES[key] = {
    key, module, label, desc,
    singular: extra.singular || label.replace(/ies$/, 'y').replace(/s$/, ''),
    fields: parsed,
    title: extra.title || parsed[0].k,
    cols: extra.cols || parsed.filter(f => !['textarea', 'items', 'password', 'json'].includes(f.t)).slice(0, 6).map(f => f.k),
    status: extra.status || (parsed.find(f => f.k === 'status') ? 'status' : null),
    ...extra,
  };
}

// ---------------------------------------------------------------- PLATFORM
E('platform', 'businesses', 'Businesses', 'Every company that uses this ERP. Each business gets its own data, users and modules.', [
  'name*|Business name|text', 'type*|Business type|select:hotel,restaurant,shop,company,mixed', 'owner_name|Owner|text', 'email*|Email|email', 'phone|Phone|phone', 'address|Address|textarea', 'city|City|text', 'country|Country|text', 'currency|Currency|select:LKR,USD,EUR,GBP,INR,AED', 'modules|Enabled modules|multi:hotel,restaurant,shop,sales,purchase,inventory,accounting,hrm,recruitment,crm,projects,goals,contracts,support,workspace', 'plan_id|Plan|ref:plans', 'status|Status|select:active,trial,suspended', 'slug|Public link name|text',
], { scope: 'platform', cols: ['name', 'type', 'owner_name', 'plan_id', 'city', 'status'] });

E('platform', 'plans', 'Plans', 'Subscription packages you sell to businesses, with limits and price.', [
  'name*|Plan name|text', 'price_monthly*|Monthly price|money', 'price_yearly|Yearly price|money', 'max_users|User limit|number', 'max_branches|Branch limit|number', 'storage_gb|Storage (GB)|number', 'modules|Included modules|multi:hotel,restaurant,shop,sales,purchase,inventory,accounting,hrm,recruitment,crm,projects,goals,contracts,support,workspace', 'trial_days|Free trial days|number', 'description|Description|textarea', 'status|Status|select:active,inactive',
], { scope: 'platform' });

E('platform', 'subscriptions', 'Subscription orders', 'Payments businesses made for their plans.', [
  'number|Order no.|text', 'business_id*|Business|ref:businesses', 'plan_id*|Plan|ref:plans', 'cycle|Billing cycle|select:monthly,yearly', 'amount*|Amount|money', 'coupon|Coupon|text', 'gateway|Paid with|select:Stripe,PayPal,PayHere,Razorpay,Bank transfer', 'date|Date|date', 'status|Status|select:paid,pending,failed,refunded',
], { scope: 'platform', title: 'number', prefix: 'ORD-' });

E('platform', 'coupons', 'Coupons', 'Discount codes businesses can use when buying a plan.', [
  'code*|Code|text', 'type|Discount type|select:percentage,flat', 'value*|Value|number', 'limit|Usage limit|number', 'used|Times used|number', 'expires|Expires on|date', 'status|Status|select:active,expired,inactive',
], { scope: 'platform' });

E('platform', 'bank_transfers', 'Bank transfer requests', 'Plan payments sent by bank transfer that need your approval.', [
  'business_id*|Business|ref:businesses', 'plan_id|Plan|ref:plans', 'amount*|Amount|money', 'reference|Bank reference|text', 'date|Date|date', 'receipt|Receipt link|url', 'status|Status|select:pending,approved,rejected',
], { scope: 'platform', title: 'reference' });

E('platform', 'addons', 'Add-ons', 'Switch whole modules on or off for the platform.', [
  'name*|Module|text', 'category|Category|select:Hospitality,Retail,Finance,People,Sales,Productivity,Payments,Integrations', 'version|Version|text', 'price|Price|money', 'description|What it does|textarea', 'status|Status|select:enabled,disabled',
], { scope: 'platform' });

E('platform', 'email_templates', 'Email templates', 'Emails the system sends automatically. Use {placeholders} for names and amounts.', [
  'name*|Template|text', 'subject*|Subject|text', 'from_name|From name|text', 'body|Body|textarea', 'module|Module|text', 'status|Status|select:active,inactive',
], { scope: 'platform' });

E('platform', 'notification_templates', 'Notification templates', 'SMS, WhatsApp and Slack/Telegram messages sent on events.', [
  'name*|Template|text', 'channel|Channel|select:SMS,WhatsApp,Slack,Telegram,Push', 'event|When it is sent|text', 'message|Message|textarea', 'status|Status|select:active,inactive',
], { scope: 'platform' });

E('platform', 'landing_sections', 'Landing page', 'Content of the public website home page.', [
  'section*|Section|select:hero,features,pricing,testimonials,faq,cta,footer', 'title*|Title|text', 'subtitle|Subtitle|textarea', 'button_text|Button text|text', 'order|Order|number', 'status|Status|select:visible,hidden',
], { scope: 'platform', title: 'title' });

E('platform', 'custom_pages', 'Custom pages', 'Extra public pages such as Privacy policy or Terms.', [
  'title*|Title|text', 'slug*|URL slug|text', 'content|Content|textarea', 'in_footer|Show in footer|bool', 'status|Status|select:published,draft',
], { scope: 'platform' });

E('platform', 'newsletter', 'Newsletter subscribers', 'People who subscribed from the landing page.', [
  'email*|Email|email', 'source|Source|select:Landing page,Footer,Popup', 'date|Subscribed on|date', 'status|Status|select:subscribed,unsubscribed',
], { scope: 'platform' });

E('platform', 'helpdesk_categories', 'Helpdesk categories', 'Topics for support requests from businesses to the platform team.', [
  'name*|Category|text', 'color|Colour|color', 'status|Status|select:active,inactive',
], { scope: 'platform' });

E('platform', 'helpdesk_tickets', 'Helpdesk tickets', 'Support requests businesses send to the platform team.', [
  'number|Ticket no.|text', 'subject*|Subject|text', 'business_id|Business|ref:businesses', 'category_id|Category|ref:helpdesk_categories', 'priority|Priority|select:low,medium,high,urgent', 'message|Message|textarea', 'reply|Latest reply|textarea', 'status|Status|select:open,in_progress,resolved,closed',
], { scope: 'platform', title: 'subject', prefix: 'HD-', cols: ['number', 'subject', 'business_id', 'priority', 'status'] });

E('platform', 'login_history', 'Login history', 'Who signed in, when and from where.', [
  'user_name|User|text', 'role|Role|text', 'ip|IP address|text', 'device|Device|text', 'date|Signed in at|datetime', 'status|Result|select:success,failed',
], { scope: 'platform', readonly: true });

// ---------------------------------------------------------------- ADMIN (per business)
E('admin', 'branches', 'Branches', 'Locations of this business. Stock, staff and sales can be tracked per branch.', [
  'name*|Branch name|text', 'code|Code|text', 'address|Address|textarea', 'phone|Phone|phone', 'manager|Manager|text', 'status|Status|select:active,inactive',
]);
E('admin', 'audit_log', 'Activity log', 'Every create, change and delete made by anyone, for accountability.', [
  'user_name|User|text', 'action|Action|select:created,updated,deleted,checked_in,checked_out,paid,approved,signed_in', 'entity|Area|text', 'record|Record|text', 'date|When|datetime',
], { readonly: true });
E('admin', 'taxes', 'Taxes', 'Tax rates applied on invoices, bills and POS sales.', [
  'name*|Tax name|text', 'rate*|Rate|percent', 'type|Type|select:inclusive,exclusive', 'applies_to|Applies to|multi:rooms,food,beverages,products,services', 'status|Status|select:active,inactive',
]);
E('admin', 'payment_methods', 'Payment methods', 'Ways customers can pay at your counters and online.', [
  'name*|Method|text', 'type|Type|select:cash,card,wallet,bank,online,credit', 'fee|Processing fee|percent', 'status|Status|select:active,inactive',
]);
E('admin', 'printers', 'Printers', 'Receipt, KOT and label printers per counter or kitchen station.', [
  'name*|Printer|text', 'type|Type|select:receipt,kot,label,report', 'station|Station / counter|text', 'connection|Connection|select:USB,Network,Bluetooth,Cloud', 'ip|IP address|text', 'status|Status|select:online,offline',
]);

// ---------------------------------------------------------------- CUSTOMERS & LOYALTY (shared)
E('customers', 'customers', 'Guests', 'Every guest and diner — one profile with ID, contact, stays, orders and loyalty.', [
  'title|Title|select:Mr,Mrs,Ms,Miss,Dr,Rev', 'first_name*|First name|text', 'last_name*|Last name|text', 'name|Full name|text', 'gender|Gender|select:Male,Female,Other', 'date_of_birth|Date of birth|date', 'nationality|Nationality|text', 'country|Country of residence|text', 'id_type|ID type|select:Passport,NIC,Driving licence,Other', 'id_number|ID / passport number|text', 'id_expiry|ID expiry date|date', 'phone|Phone|phone', 'email|Email|email', 'address|Home address|textarea', 'company|Company|text', 'vehicle_no|Vehicle number|text', 'type|Guest type|select:individual,vip,corporate,travel_agent,walk_in', 'purpose|Purpose of visit|select:Leisure,Business,Wedding,Pilgrimage,Medical / Ayurveda,Other', 'preferences|Preferences & allergies|textarea', 'loyalty_points|Loyalty points|number', 'credit_limit|Credit limit|money', 'balance|Amount due|money', 'marketing|Agrees to offers by email/SMS|bool', 'notes|Notes|textarea', 'status|Status|select:active,inactive,blacklisted',
], { singular: 'Guest', cols: ['name', 'phone', 'nationality', 'id_number', 'type', 'loyalty_points', 'status'] });
E('customers', 'loyalty_tiers', 'Loyalty program', 'Membership tiers. Customers earn points on every sale and move up tiers.', [
  'name*|Tier|text', 'min_points*|Points needed|number', 'earn_rate|Points per 100 spent|number', 'discount|Member discount|percent', 'perks|Perks|textarea', 'color|Colour|color',
]);
E('customers', 'gift_cards', 'Gift cards', 'Prepaid cards customers can buy and redeem at any counter.', [
  'code*|Card code|text', 'customer_id|Owner|ref:customers', 'value*|Original value|money', 'balance|Balance left|money', 'expires|Expires on|date', 'status|Status|select:active,used,expired',
]);
E('customers', 'promotions', 'Promotions & discounts', 'Discounts, happy hours, buy-one-get-one and coupon codes for customers.', [
  'name*|Promotion|text', 'code|Coupon code|text', 'type|Type|select:percentage,flat,bogo,happy_hour,bundle', 'value|Value|number', 'applies_to|Applies to|multi:hotel,restaurant,shop', 'min_spend|Minimum spend|money', 'start|Starts|date', 'end|Ends|date', 'status|Status|select:active,scheduled,expired',
]);
E('customers', 'feedback', 'Customer feedback', 'Ratings and comments collected by QR, email and at checkout.', [
  'customer_name|Customer|text', 'source|From|select:hotel,restaurant,shop,online', 'rating*|Rating|rating', 'comment|Comment|textarea', 'date|Date|date', 'response|Our response|textarea', 'status|Status|select:new,responded,closed',
], { title: 'customer_name' });
E('customers', 'campaigns', 'SMS & email campaigns', 'Send offers and greetings to customer groups.', [
  'name*|Campaign|text', 'channel|Channel|select:SMS,Email,WhatsApp', 'audience|Send to|select:All customers,VIP,Loyalty members,Birthdays this month,Inactive 90 days', 'message|Message|textarea', 'send_at|Send at|datetime', 'sent|Recipients|number', 'status|Status|select:draft,scheduled,sent',
]);

// ---------------------------------------------------------------- HOTEL
E('hotel', 'room_types', 'Room types', 'Categories of rooms with base price and capacity.', [
  'name*|Room type|text', 'base_rate*|Base rate per night|money', 'max_adults|Max adults|number', 'max_children|Max children|number', 'bed|Bed|select:King,Queen,Twin,Double,Single,Bunk', 'size|Size (sq ft)|number', 'amenities|Amenities|multi:AC,Wi-Fi,TV,Minibar,Balcony,Sea view,Bathtub,Kitchenette,Safe,Hair dryer', 'description|Description|textarea',
]);
E('hotel', 'rooms', 'Rooms', 'Every room you sell, its floor and current state.', [
  'number*|Room no.|text', 'room_type_id*|Room type|ref:room_types', 'floor|Floor|number', 'view|View|select:Sea,Garden,Pool,City,None', 'smoking|Smoking allowed|bool', 'status|Status|select:available,occupied,reserved,dirty,cleaning,out_of_order', 'notes|Notes|textarea',
]);
E('hotel', 'rate_plans', 'Rate plans & seasons', 'Seasonal and special prices that override the base rate.', [
  'name*|Rate plan|text', 'room_type_id|Room type|ref:room_types', 'meal_plan|Meal plan|select:RO,BB,HB,FB,AI', 'rate*|Rate per night|money', 'start|Valid from|date', 'end|Valid until|date', 'min_nights|Minimum nights|number', 'refundable|Refundable|bool', 'status|Status|select:active,inactive',
]);
E('hotel', 'meal_plans', 'Meal plans & packages', 'RO, BB, HB, FB, all-inclusive and holiday packages.', [
  'code*|Code|text', 'name*|Name|text', 'price_per_person|Price per person / night|money', 'includes|Includes|textarea', 'status|Status|select:active,inactive',
], { title: 'name' });
E('hotel', 'reservations', 'Reservations', 'All bookings — walk-in, phone, website and booking channels. Open one to see its folio.', [
  'number|Booking no.|text', 'guest_id*|Guest|ref:customers', 'room_id|Room|ref:rooms', 'room_type_id|Room type|ref:room_types', 'check_in*|Check-in|date', 'check_out*|Check-out|date', 'adults|Adults|number', 'children|Children|number', 'meal_plan|Meal plan|select:RO,BB,HB,FB,AI', 'rate|Rate per night|money', 'source|Booked via|select:Walk-in,Phone,Website,Booking.com,Agoda,Expedia,Airbnb,Travel agent,Corporate', 'agent_id|Agent / company|ref:travel_agents', 'ota_ref|OTA / agent booking ref.|text', 'arrival_time|Expected arrival time|time', 'vehicle_no|Vehicle number|text', 'parking_slot_id|Parking slot|ref:parking_slots', 'advance|Advance paid|money', 'total|Room total|money', 'special_requests|Special requests|textarea', 'status|Status|select:confirmed,tentative,checked_in,checked_out,cancelled,no_show',
], { title: 'number', prefix: 'BK-', cols: ['number', 'guest_id', 'room_id', 'check_in', 'check_out', 'source', 'total', 'status'], calendar: 'check_in' });
E('hotel', 'folio_charges', 'Folio charges', 'Everything charged to a guest’s room bill.', [
  'reservation_id*|Booking|ref:reservations', 'description*|Description|text', 'category|Category|select:Room,Restaurant,Bar,Minibar,Laundry,Spa,Transport,Tour,Telephone,Other', 'amount*|Amount|money', 'date|Date|date', 'posted_by|Posted by|text',
], { title: 'description' });
E('hotel', 'folio_payments', 'Guest payments', 'Advances, deposits and settlements received from guests.', [
  'reservation_id*|Booking|ref:reservations', 'amount*|Amount|money', 'method|Method|select:Cash,Card,Bank transfer,Online,City ledger', 'reference|Reference|text', 'date|Date|date', 'type|Type|select:advance,settlement,refund',
], { title: 'reference' });
E('hotel', 'housekeeping', 'Housekeeping tasks', 'Cleaning jobs per room. Staff update them from their phone.', [
  'room_id*|Room|ref:rooms', 'task|Task|select:Checkout clean,Stay-over clean,Deep clean,Turndown,Inspection,Linen change', 'assigned_to|Assigned to|ref:employees', 'priority|Priority|select:low,normal,high', 'date|Date|date', 'notes|Notes|textarea', 'status|Status|select:pending,in_progress,done,inspected',
], { title: 'task', kanban: 'status' });
E('hotel', 'maintenance', 'Maintenance', 'Repair requests. A room under repair is blocked from sale.', [
  'room_id|Room / area|ref:rooms', 'issue*|Issue|text', 'category|Category|select:Electrical,Plumbing,AC,Furniture,IT,Other', 'priority|Priority|select:low,normal,high,urgent', 'assigned_to|Assigned to|ref:employees', 'reported|Reported on|date', 'cost|Repair cost|money', 'status|Status|select:open,in_progress,resolved',
], { title: 'issue', kanban: 'status' });
E('hotel', 'laundry', 'Laundry', 'Guest and house laundry orders billed to the room.', [
  'reservation_id|Booking|ref:reservations', 'items|Items|text', 'pieces|Pieces|number', 'service|Service|select:Wash,Dry clean,Iron,Express', 'amount|Charge|money', 'date|Received|date', 'status|Status|select:received,processing,ready,delivered',
], { title: 'items' });
E('hotel', 'minibar_items', 'Minibar', 'Items stocked in rooms and their prices.', [
  'name*|Item|text', 'price*|Price|money', 'stock|In store|number', 'par_level|Per room|number', 'status|Status|select:active,inactive',
]);
E('hotel', 'extra_services', 'Extra services', 'Spa, tours, airport transfers and other add-ons you can charge to a room.', [
  'name*|Service|text', 'category|Category|select:Spa,Tour,Transport,Dining,Activity,Other', 'price*|Price|money', 'unit|Charged per|select:person,trip,hour,item', 'status|Status|select:active,inactive',
]);
E('hotel', 'lost_found', 'Lost & found', 'Items found in rooms or public areas.', [
  'item*|Item|text', 'found_at|Found at|text', 'found_by|Found by|text', 'date|Date|date', 'owner|Owner (if known)|text', 'status|Status|select:stored,returned,disposed',
], { title: 'item' });
E('hotel', 'travel_agents', 'Corporate & agents', 'Travel agents and companies with contracted rates and commission.', [
  'name*|Name|text', 'type|Type|select:Travel agent,Corporate,OTA', 'contact|Contact person|text', 'email|Email|email', 'phone|Phone|phone', 'commission|Commission|percent', 'credit_limit|Credit limit|money', 'balance|Balance due|money', 'status|Status|select:active,inactive',
]);
E('hotel', 'channels', 'Channel manager', 'Online travel sites connected to your room inventory. Rates and availability sync automatically.', [
  'name*|Channel|select:Booking.com,Agoda,Expedia,Airbnb,TripAdvisor,Google Hotels', 'property_id|Property ID|text', 'commission|Commission|percent', 'last_sync|Last sync|datetime', 'auto_sync|Auto sync|bool', 'status|Status|select:connected,disconnected,error',
]);
E('hotel', 'night_audits', 'Night audits', 'End-of-day closings with room revenue and occupancy.', [
  'date*|Business date|date', 'occupied|Rooms occupied|number', 'occupancy|Occupancy|percent', 'room_revenue|Room revenue|money', 'other_revenue|Other revenue|money', 'closed_by|Closed by|text', 'status|Status|select:closed,open',
], { title: 'date', readonly: true });

// ---------------------------------------------------------------- GUEST SERVICES
E('guestservices', 'parking_slots', 'Parking slots', 'Every parking bay with its zone and live status.', [
  'code*|Slot|text', 'zone|Zone|select:Main car park,Covered,Coach bay,Staff,Motorbike', 'type|For|select:Car,Van,Coach / bus,Motorbike,EV charging', 'status|Status|select:free,occupied,reserved,out_of_service', 'vehicle_no|Vehicle now parked|text', 'notes|Notes|text',
], { title: 'code' });
E('guestservices', 'parking_logs', 'Parking log', 'Every vehicle in and out, linked to the guest and room.', [
  'slot_id*|Slot|ref:parking_slots', 'vehicle_no*|Vehicle number|text', 'vehicle_type|Vehicle|select:Car,Van,Coach / bus,Motorbike,Tuk-tuk', 'driver|Driver / owner|text', 'reservation_id|Guest booking|ref:reservations', 'purpose|Purpose|select:Hotel guest,Restaurant guest,Visitor,Taxi / driver,Supplier,Staff', 'time_in|In|datetime', 'time_out|Out|datetime', 'fee|Fee|money', 'status|Status|select:parked,left',
], { title: 'vehicle_no', cols: ['vehicle_no', 'slot_id', 'purpose', 'reservation_id', 'time_in', 'time_out', 'status'] });
E('guestservices', 'transport_vendors', 'Taxi & transport partners', 'Taxi companies, tuk-tuk drivers and the resort’s own vehicles.', [
  'name*|Name|text', 'type|Type|select:Own vehicle,Taxi company,Driver,Tuk-tuk,Coach operator,App (PickMe / Uber)', 'vehicle|Vehicle|select:Car,Van,Tuk-tuk,Mini coach,Coach', 'vehicle_no|Vehicle number|text', 'phone|Phone|phone', 'rate_per_km|Rate per km|money', 'commission|Resort commission|percent', 'status|Status|select:available,on_trip,off_duty',
]);
E('guestservices', 'transport_bookings', 'Taxi & transfers', 'Airport pick-ups, city tours and taxis for guests. Completed trips can be charged to the room.', [
  'number|Trip no.|text', 'guest_name*|Guest|text', 'reservation_id|Room booking|ref:reservations', 'type|Trip|select:Airport pick-up,Airport drop,Railway station,City taxi,Day tour,Temple of the Tooth,Peradeniya Gardens,Pinnawala,Nuwara Eliya,Sigiriya,Other', 'pickup*|Pick-up from|text', 'dropoff*|Drop-off at|text', 'pickup_time*|Pick-up time|datetime', 'passengers|Passengers|number', 'vehicle|Vehicle|select:Car,Van,Tuk-tuk,Mini coach,Coach', 'vendor_id|Driver / partner|ref:transport_vendors', 'fare|Fare|money', 'charge_to_room|Charge to room bill|bool', 'notes|Notes|textarea', 'status|Status|select:requested,confirmed,driver_assigned,on_trip,completed,cancelled',
], { title: 'number', prefix: 'TR-', kanban: 'status', calendar: 'pickup_time', cols: ['number', 'guest_name', 'type', 'pickup_time', 'vendor_id', 'fare', 'status'] });
E('guestservices', 'guest_requests', 'Guest requests', 'Requests from rooms — towels, cleaning, repairs, late check-out. Sent from the room QR page or taken by phone.', [
  'room|Room|text', 'guest_name|Guest|text', 'type*|Request|select:Extra towels,Room cleaning,Extra pillow / blanket,Drinking water,Toiletries,Maintenance / repair,Late check-out,Wake-up call,Laundry pick-up,Doctor / pharmacy,Other', 'details|Details|textarea', 'source|Received by|select:Room QR,Phone,Front desk,WhatsApp', 'assigned_to|Assigned to|ref:employees', 'priority|Priority|select:normal,urgent', 'created|Requested at|datetime', 'status|Status|select:new,acknowledged,in_progress,done',
], { title: 'type', kanban: 'status', cols: ['room', 'guest_name', 'type', 'source', 'priority', 'created', 'status'] });
E('guestservices', 'service_calls', 'Table & room calls', 'Waiter calls and bill requests from the QR menu, for waiters to acknowledge.', [
  'place*|Table / room|text', 'kind|Call|select:Waiter,Bill,Water,Clean table,Room service', 'note|Note|text', 'created|At|datetime', 'handled_by|Handled by|text', 'status|Status|select:open,acknowledged,done',
], { title: 'place' });
E('hotel', 'channel_sync_logs', 'Channel sync log', 'Every rate and availability update sent to online travel agents.', [
  'channel|Channel|text', 'action|Action|select:Availability update,Rate update,Booking received,Stop sell,Full sync', 'details|Details|text', 'date|At|datetime', 'by|By|text', 'status|Result|select:success,queued,failed',
], { title: 'channel', readonly: true });
E('hotel', 'registration_cards', 'Registration cards', 'Signed guest registration cards (GRC) captured at check-in.', [
  'reservation_id*|Booking|ref:reservations', 'guest_id|Guest|ref:customers', 'signed_at|Signed at|datetime', 'id_verified|ID checked|bool', 'id_copy|ID copy link|url', 'notes|Notes|text',
], { title: 'reservation_id' });

// ---------------------------------------------------------------- RESTAURANT
E('restaurant', 'menu_categories', 'Menu categories', 'Groups on your menu such as Starters, Mains, Drinks.', [
  'name*|Category|text', 'icon|Icon|text', 'order|Display order|number', 'station|Kitchen station|select:Hot kitchen,Cold kitchen,Bar,Bakery,Grill', 'status|Status|select:active,inactive',
]);
E('restaurant', 'menu_items', 'Menu items', 'Dishes and drinks with price, kitchen station and availability.', [
  'name*|Item|text', 'category_id*|Category|ref:menu_categories', 'price*|Price|money', 'cost|Food cost|money', 'icon|Icon|text', 'veg|Vegetarian|bool', 'spicy|Spice level|select:none,mild,medium,hot', 'prep_minutes|Prep time (min)|number', 'modifier_ids|Modifiers|refs:modifiers', 'description|Description|textarea', 'available|Available now|bool', 'status|Status|select:active,inactive',
], { cols: ['name', 'category_id', 'price', 'cost', 'prep_minutes', 'available'] });
E('restaurant', 'modifiers', 'Modifiers', 'Options a guest can add or change, like extra cheese or spice level.', [
  'name*|Modifier group|text', 'options|Options (comma separated)|text', 'price|Extra price|money', 'required|Must choose|bool', 'status|Status|select:active,inactive',
]);
E('restaurant', 'combos', 'Combos & set menus', 'Bundled meals sold at a special price.', [
  'name*|Combo|text', 'item_ids|Items included|refs:menu_items', 'price*|Combo price|money', 'status|Status|select:active,inactive',
]);
E('restaurant', 'ingredients', 'Ingredients', 'Kitchen stock. Recipes deduct from these automatically on every sale.', [
  'name*|Ingredient|text', 'unit|Unit|select:kg,g,l,ml,pcs,pack', 'stock|In stock|number', 'reorder|Reorder at|number', 'cost|Cost per unit|money', 'supplier_id|Supplier|ref:vendors', 'status|Status|select:active,inactive',
]);
E('restaurant', 'recipes', 'Recipes & costing', 'How much of each ingredient one portion uses. Drives food cost and stock.', [
  'menu_item_id*|Menu item|ref:menu_items', 'ingredient_id*|Ingredient|ref:ingredients', 'quantity*|Quantity per portion|number', 'notes|Method notes|textarea',
], { title: 'menu_item_id' });
E('restaurant', 'areas', 'Dining areas', 'Sections of the restaurant such as Indoor, Terrace, Bar.', [
  'name*|Area|text', 'service_charge|Service charge|percent', 'status|Status|select:active,inactive',
]);
E('restaurant', 'tables', 'Tables', 'Tables with seats and area. Each table gets its own QR code for ordering.', [
  'name*|Table|text', 'area_id|Area|ref:areas', 'seats|Seats|number', 'shape|Shape|select:square,round,long', 'pos_x|Floor position — across (0-10)|number', 'pos_y|Floor position — down (0-6)|number', 'status|Status|select:free,occupied,reserved,bill_requested,cleaning',
]);
E('restaurant', 'table_reservations', 'Table reservations', 'Advance table bookings from phone, walk-in and website.', [
  'customer_name*|Guest name|text', 'phone|Phone|phone', 'date*|Date|date', 'time*|Time|time', 'guests|Guests|number', 'table_id|Table|ref:tables', 'occasion|Occasion|select:None,Birthday,Anniversary,Business,Date', 'notes|Notes|textarea', 'status|Status|select:booked,seated,completed,cancelled,no_show',
], { title: 'customer_name', calendar: 'date' });
E('restaurant', 'waitlist', 'Waitlist', 'Walk-in guests waiting for a table, with quoted wait time.', [
  'customer_name*|Guest name|text', 'phone|Phone|phone', 'guests|Party size|number', 'quoted_minutes|Quoted wait (min)|number', 'added|Added at|datetime', 'status|Status|select:waiting,notified,seated,left',
], { title: 'customer_name' });
E('restaurant', 'restaurant_orders', 'Restaurant orders', 'Every dine-in, takeaway, delivery, QR and room-service order.', [
  'number|Order no.|text', 'type|Order type|select:dine_in,takeaway,delivery,qr,room_service', 'table_id|Table|ref:tables', 'customer_id|Customer|ref:customers', 'waiter|Waiter|text', 'items|Items|items', 'subtotal|Subtotal|money', 'discount|Discount|money', 'service_charge|Service charge|money', 'tax|Tax|money', 'total|Total|money', 'payment_method|Paid by|select:Cash,Card,Online,Room charge,Credit,Split', 'rider_id|Delivery rider|ref:riders', 'date|Date|datetime', 'status|Status|select:open,preparing,ready,served,paid,cancelled',
], { title: 'number', prefix: 'R-', cols: ['number', 'type', 'table_id', 'waiter', 'total', 'date', 'status'] });
E('restaurant', 'kots', 'KOT history', 'Kitchen order tickets sent to each station.', [
  'number|KOT no.|text', 'order_id|Order|ref:restaurant_orders', 'station|Station|select:Hot kitchen,Cold kitchen,Bar,Bakery,Grill', 'table|Table|text', 'items|Items|items', 'created|Sent at|datetime', 'status|Status|select:new,preparing,ready,served,cancelled',
], { title: 'number', prefix: 'KOT-', readonly: false });
E('restaurant', 'riders', 'Delivery riders', 'Your delivery staff and third-party rider partners.', [
  'name*|Rider|text', 'phone|Phone|phone', 'vehicle|Vehicle|select:Bike,Scooter,Car,Bicycle', 'partner|Partner|select:Own staff,Uber Eats,PickMe Food,Foodpanda', 'status|Status|select:available,on_delivery,off_duty',
]);
E('restaurant', 'aggregators', 'Delivery apps', 'Food delivery platforms connected to your menu and orders.', [
  'name*|Platform|select:Uber Eats,PickMe Food,Foodpanda,DoorDash,Deliveroo', 'store_id|Store ID|text', 'commission|Commission|percent', 'menu_synced|Menu synced|bool', 'status|Status|select:connected,disconnected',
]);
E('restaurant', 'bar_stock', 'Bar stock', 'Bottles and pours tracked separately for the bar.', [
  'name*|Item|text', 'type|Type|select:Spirit,Wine,Beer,Soft drink,Mixer', 'bottle_ml|Bottle size (ml)|number', 'peg_ml|Peg size (ml)|number', 'bottles|Full bottles|number', 'open_ml|Open bottle left (ml)|number', 'peg_price|Price per peg|money', 'status|Status|select:active,inactive',
]);

// ---------------------------------------------------------------- SHOP / RETAIL
E('shop', 'product_categories', 'Product categories', 'Groups of products in your shop.', [
  'name*|Category|text', 'parent|Parent category|text', 'icon|Icon|text', 'status|Status|select:active,inactive',
]);
E('shop', 'brands', 'Brands', 'Manufacturers and labels of products you sell.', [
  'name*|Brand|text', 'country|Country|text', 'status|Status|select:active,inactive',
]);
E('shop', 'products', 'Products', 'Everything you sell in the shop, with barcode, price and stock.', [
  'name*|Product|text', 'sku*|SKU|text', 'barcode|Barcode|text', 'category_id|Category|ref:product_categories', 'brand_id|Brand|ref:brands', 'icon|Icon|text', 'unit|Unit|select:pcs,kg,g,l,ml,pack,box', 'cost|Cost price|money', 'price*|Selling price|money', 'wholesale_price|Wholesale price|money', 'tax_rate|Tax|percent', 'stock|In stock|number', 'reorder|Reorder at|number', 'variants|Variants (size/colour)|text', 'track_batch|Track batch & expiry|bool', 'track_serial|Track serial numbers|bool', 'weighed|Sold by weight|bool', 'online|Show in online store|bool', 'status|Status|select:active,inactive',
], { cols: ['name', 'sku', 'category_id', 'price', 'stock', 'status'] });
E('shop', 'batches', 'Batches & expiry', 'Batch numbers and expiry dates for food, medicine and cosmetics.', [
  'product_id*|Product|ref:products', 'batch_no*|Batch no.|text', 'quantity|Quantity|number', 'mfg|Manufactured|date', 'expiry*|Expires|date', 'status|Status|select:ok,expiring,expired',
], { title: 'batch_no' });
E('shop', 'serials', 'Serial numbers', 'Serial and IMEI numbers for electronics, with warranty.', [
  'product_id*|Product|ref:products', 'serial*|Serial / IMEI|text', 'warranty_until|Warranty until|date', 'sold_to|Sold to|text', 'status|Status|select:in_stock,sold,returned,repair',
], { title: 'serial' });
E('shop', 'price_lists', 'Price lists', 'Different prices for retail, wholesale and member customers.', [
  'name*|Price list|text', 'customer_type|For customers|select:retail,wholesale,member,staff', 'adjustment|Adjustment|percent', 'status|Status|select:active,inactive',
]);
E('shop', 'shop_sales', 'Shop sales', 'Every receipt from the shop counters and online store.', [
  'number|Receipt no.|text', 'customer_id|Customer|ref:customers', 'items|Items|items', 'subtotal|Subtotal|money', 'discount|Discount|money', 'tax|Tax|money', 'total|Total|money', 'payment_method|Paid by|select:Cash,Card,Online,Credit,Gift card,Split', 'channel|Channel|select:counter,online,phone', 'cashier|Cashier|text', 'date|Date|datetime', 'status|Status|select:paid,held,refunded,partially_refunded,credit',
], { title: 'number', prefix: 'S-', cols: ['number', 'customer_id', 'total', 'payment_method', 'channel', 'date', 'status'] });
E('shop', 'shop_returns', 'Returns & exchanges', 'Goods brought back by customers, refunded or exchanged.', [
  'number|Return no.|text', 'sale_id|Original receipt|ref:shop_sales', 'product_id|Product|ref:products', 'quantity|Quantity|number', 'reason|Reason|select:Damaged,Wrong item,Size issue,Changed mind,Expired', 'refund|Refund amount|money', 'type|Settled as|select:refund,exchange,store_credit', 'date|Date|date', 'status|Status|select:pending,approved,rejected',
], { title: 'number', prefix: 'RT-' });
E('shop', 'stock_adjustments', 'Stock adjustments', 'Correct stock for damage, theft, expiry or counting differences.', [
  'product_id*|Product|ref:products', 'type|Type|select:add,remove', 'quantity*|Quantity|number', 'reason|Reason|select:Damaged,Expired,Theft,Count correction,Gift,Opening stock', 'date|Date|date', 'by|Done by|text',
], { title: 'product_id' });
E('shop', 'stock_counts', 'Stock taking', 'Physical stock counts compared with system stock.', [
  'name*|Count name|text', 'date|Date|date', 'warehouse_id|Location|ref:warehouses', 'items_counted|Items counted|number', 'variance|Variance value|money', 'counted_by|Counted by|text', 'status|Status|select:in_progress,completed,approved',
]);

// ---------------------------------------------------------------- INVENTORY & PRODUCT/SERVICE
E('inventory', 'items', 'Items (products & services)', 'Master list of goods and services used in invoices and purchases.', [
  'name*|Item|text', 'sku|SKU|text', 'type|Type|select:product,service', 'category|Category|text', 'unit|Unit|select:pcs,kg,l,hour,day,box', 'sale_price*|Sale price|money', 'purchase_price|Purchase price|money', 'tax_rate|Tax|percent', 'quantity|Quantity|number', 'description|Description|textarea', 'status|Status|select:active,inactive',
]);
E('inventory', 'warehouses', 'Warehouses & stores', 'Places where you keep stock — main store, kitchen store, shop floor.', [
  'name*|Warehouse|text', 'branch_id|Branch|ref:branches', 'address|Address|textarea', 'manager|In charge|text', 'capacity|Capacity|text', 'status|Status|select:active,inactive',
]);
E('inventory', 'transfers', 'Stock transfers', 'Move stock between warehouses, kitchen and shop.', [
  'number|Transfer no.|text', 'from_id*|From|ref:warehouses', 'to_id*|To|ref:warehouses', 'item_id*|Item|ref:items', 'quantity*|Quantity|number', 'date|Date|date', 'status|Status|select:pending,in_transit,received',
], { title: 'number', prefix: 'TR-' });

// ---------------------------------------------------------------- SALES
E('sales', 'proposals', 'Proposals', 'Price offers you send before a sale. Accept one to turn it into an invoice.', [
  'number|Proposal no.|text', 'customer_id*|Customer|ref:customers', 'date|Date|date', 'valid_until|Valid until|date', 'items|Items|items', 'total|Total|money', 'notes|Notes|textarea', 'status|Status|select:draft,sent,accepted,rejected,converted',
], { title: 'number', prefix: 'PRO-', doc: true });
E('sales', 'quotations', 'Quotations', 'Quick quotes for customers, convertible to invoices.', [
  'number|Quotation no.|text', 'customer_id*|Customer|ref:customers', 'date|Date|date', 'items|Items|items', 'total|Total|money', 'status|Status|select:draft,sent,accepted,expired',
], { title: 'number', prefix: 'QT-', doc: true });
E('sales', 'sales_invoices', 'Sales invoices', 'Bills you send to customers. Track what is paid and what is due.', [
  'number|Invoice no.|text', 'customer_id*|Customer|ref:customers', 'date|Invoice date|date', 'due_date|Due date|date', 'items|Items|items', 'total|Total|money', 'paid|Paid|money', 'notes|Notes|textarea', 'status|Status|select:draft,sent,partially_paid,paid,overdue',
], { title: 'number', prefix: 'INV-', doc: true, cols: ['number', 'customer_id', 'date', 'due_date', 'total', 'paid', 'status'] });
E('sales', 'sales_returns', 'Sales returns', 'Goods returned against a sales invoice.', [
  'number|Return no.|text', 'invoice_id*|Invoice|ref:sales_invoices', 'date|Date|date', 'items|Items|items', 'total|Total|money', 'reason|Reason|textarea', 'status|Status|select:draft,approved,completed',
], { title: 'number', prefix: 'SR-', doc: true });

// ---------------------------------------------------------------- PURCHASE
E('purchase', 'vendors', 'Suppliers', 'Businesses you buy from.', [
  'name*|Supplier|text', 'contact|Contact person|text', 'email|Email|email', 'phone|Phone|phone', 'tax_number|Tax / VAT no.|text', 'address|Address|textarea', 'payment_terms|Payment terms|select:Cash,7 days,15 days,30 days,60 days', 'balance|Amount we owe|money', 'status|Status|select:active,inactive',
]);
E('purchase', 'purchase_orders', 'Purchase orders', 'Orders you send to suppliers. Receive them with a GRN to add stock.', [
  'number|PO no.|text', 'vendor_id*|Supplier|ref:vendors', 'warehouse_id|Deliver to|ref:warehouses', 'date|Date|date', 'expected|Expected on|date', 'items|Items|items', 'total|Total|money', 'status|Status|select:draft,sent,partially_received,received,cancelled',
], { title: 'number', prefix: 'PO-', doc: true });
E('purchase', 'grns', 'Goods received (GRN)', 'Record deliveries received against purchase orders.', [
  'number|GRN no.|text', 'po_id|Purchase order|ref:purchase_orders', 'vendor_id|Supplier|ref:vendors', 'date|Received on|date', 'items|Items|items', 'received_by|Received by|text', 'status|Status|select:draft,completed',
], { title: 'number', prefix: 'GRN-', doc: true });
E('purchase', 'purchase_invoices', 'Purchase invoices', 'Bills from suppliers that you need to pay.', [
  'number|Bill no.|text', 'vendor_id*|Supplier|ref:vendors', 'date|Bill date|date', 'due_date|Due date|date', 'items|Items|items', 'total|Total|money', 'paid|Paid|money', 'status|Status|select:draft,posted,partially_paid,paid,overdue',
], { title: 'number', prefix: 'BILL-', doc: true });
E('purchase', 'purchase_returns', 'Purchase returns', 'Goods sent back to suppliers.', [
  'number|Return no.|text', 'invoice_id*|Bill|ref:purchase_invoices', 'date|Date|date', 'items|Items|items', 'total|Total|money', 'reason|Reason|textarea', 'status|Status|select:draft,approved,completed',
], { title: 'number', prefix: 'PR-', doc: true });

// ---------------------------------------------------------------- ACCOUNTING & DOUBLE ENTRY & BUDGET
E('accounting', 'accounts', 'Chart of accounts', 'All ledger accounts grouped as assets, liabilities, equity, income and expenses.', [
  'code*|Code|text', 'name*|Account|text', 'type*|Type|select:Asset,Liability,Equity,Income,Expense', 'sub_type|Sub type|text', 'balance|Balance|money', 'status|Status|select:active,inactive',
], { title: 'name' });
E('accounting', 'journal_entries', 'Journal entries', 'Manual double-entry postings. Debits must equal credits.', [
  'number|Entry no.|text', 'date*|Date|date', 'debit_account_id*|Debit account|ref:accounts', 'credit_account_id*|Credit account|ref:accounts', 'amount*|Amount|money', 'memo|Memo|text', 'status|Status|select:draft,posted',
], { title: 'number', prefix: 'JE-' });
E('accounting', 'bank_accounts', 'Bank accounts', 'Your bank and cash accounts with live balances.', [
  'name*|Account name|text', 'bank|Bank|text', 'number|Account no.|text', 'branch|Branch|text', 'opening_balance|Opening balance|money', 'balance|Current balance|money', 'status|Status|select:active,inactive',
]);
E('accounting', 'bank_transactions', 'Bank transactions', 'Money in and out of each bank account.', [
  'account_id*|Account|ref:bank_accounts', 'date*|Date|date', 'type|Type|select:deposit,withdrawal', 'amount*|Amount|money', 'description|Description|text', 'reconciled|Reconciled|bool',
], { title: 'description' });
E('accounting', 'bank_transfers_internal', 'Bank transfers', 'Move money between your own accounts.', [
  'from_id*|From account|ref:bank_accounts', 'to_id*|To account|ref:bank_accounts', 'amount*|Amount|money', 'date|Date|date', 'reference|Reference|text',
], { title: 'reference', singular: 'Bank transfer' });
E('accounting', 'revenues', 'Revenue', 'Income that is not from an invoice — rent, commissions, interest.', [
  'date*|Date|date', 'amount*|Amount|money', 'account_id|Into account|ref:bank_accounts', 'customer_id|From customer|ref:customers', 'category|Category|select:Rooms,Food & beverage,Retail,Services,Commission,Rent,Interest,Other', 'reference|Reference|text', 'description|Description|text',
], { title: 'reference', singular: 'Revenue' });
E('accounting', 'expenses', 'Expenses', 'Money spent — utilities, rent, salaries, supplies.', [
  'date*|Date|date', 'amount*|Amount|money', 'account_id|From account|ref:bank_accounts', 'vendor_id|Paid to|ref:vendors', 'category|Category|select:Utilities,Rent,Salaries,Supplies,Maintenance,Marketing,Transport,Food cost,Other', 'reference|Reference|text', 'description|Description|text', 'status|Status|select:paid,pending',
], { title: 'reference' });
E('accounting', 'customer_payments', 'Customer payments', 'Payments received against sales invoices.', [
  'customer_id*|Customer|ref:customers', 'invoice_id|Invoice|ref:sales_invoices', 'amount*|Amount|money', 'date|Date|date', 'method|Method|select:Cash,Card,Bank transfer,Cheque,Online', 'account_id|Into account|ref:bank_accounts', 'reference|Reference|text',
], { title: 'reference' });
E('accounting', 'vendor_payments', 'Supplier payments', 'Payments made against supplier bills.', [
  'vendor_id*|Supplier|ref:vendors', 'bill_id|Bill|ref:purchase_invoices', 'amount*|Amount|money', 'date|Date|date', 'method|Method|select:Cash,Bank transfer,Cheque,Online', 'account_id|From account|ref:bank_accounts', 'reference|Reference|text',
], { title: 'reference' });
E('accounting', 'credit_notes', 'Credit notes', 'Amounts you owe back to customers.', [
  'number|Credit note no.|text', 'customer_id*|Customer|ref:customers', 'invoice_id|Invoice|ref:sales_invoices', 'amount*|Amount|money', 'date|Date|date', 'reason|Reason|text', 'status|Status|select:open,applied',
], { title: 'number', prefix: 'CN-' });
E('accounting', 'debit_notes', 'Debit notes', 'Amounts suppliers owe back to you.', [
  'number|Debit note no.|text', 'vendor_id*|Supplier|ref:vendors', 'bill_id|Bill|ref:purchase_invoices', 'amount*|Amount|money', 'date|Date|date', 'reason|Reason|text', 'status|Status|select:open,applied',
], { title: 'number', prefix: 'DN-' });
E('accounting', 'budget_periods', 'Budget periods', 'Time frames budgets are planned for.', [
  'name*|Period|text', 'start*|Start|date', 'end*|End|date', 'status|Status|select:open,closed',
]);
E('accounting', 'budgets', 'Budgets', 'Planned spending and income per department or category.', [
  'name*|Budget|text', 'period_id|Period|ref:budget_periods', 'department_id|Department|ref:departments', 'category|Category|text', 'planned*|Planned amount|money', 'actual|Actual so far|money', 'status|Status|select:draft,approved,active,closed',
]);
E('accounting', 'budget_allocations', 'Budget allocations', 'Split a budget into smaller amounts for teams or months.', [
  'budget_id*|Budget|ref:budgets', 'name*|Allocation|text', 'amount*|Amount|money', 'spent|Spent|money', 'month|Month|text',
], { title: 'name' });

// ---------------------------------------------------------------- HRM
E('hrm', 'departments', 'Departments', 'Teams in your organisation.', [
  'name*|Department|text', 'branch_id|Branch|ref:branches', 'head|Head of department|text', 'status|Status|select:active,inactive',
]);
E('hrm', 'designations', 'Designations', 'Job titles.', [
  'name*|Designation|text', 'department_id|Department|ref:departments', 'status|Status|select:active,inactive',
]);
E('hrm', 'employees', 'Employees', 'Staff records with job, contact, bank and salary details.', [
  'name*|Full name|text', 'employee_id|Employee ID|text', 'email|Email|email', 'phone|Phone|phone', 'department_id|Department|ref:departments', 'designation_id|Designation|ref:designations', 'branch_id|Branch|ref:branches', 'joined|Date joined|date', 'dob|Date of birth|date', 'gender|Gender|select:Male,Female,Other', 'nic|NIC / Passport|text', 'address|Address|textarea', 'bank_name|Bank|text', 'bank_account|Bank account no.|text', 'basic_salary|Basic salary|money', 'shift_id|Shift|ref:shifts', 'emergency_contact|Emergency contact|text', 'status|Status|select:active,on_leave,resigned,terminated',
], { cols: ['name', 'employee_id', 'department_id', 'designation_id', 'phone', 'status'] });
E('hrm', 'shifts', 'Shifts', 'Working hours for each shift.', [
  'name*|Shift|text', 'start*|Starts|time', 'end*|Ends|time', 'break_minutes|Break (min)|number', 'grace_minutes|Late grace (min)|number', 'status|Status|select:active,inactive',
]);
E('hrm', 'rosters', 'Duty roster', 'Who works which shift on which day.', [
  'employee_id*|Employee|ref:employees', 'shift_id*|Shift|ref:shifts', 'date*|Date|date', 'notes|Notes|text',
], { title: 'employee_id', calendar: 'date' });
E('hrm', 'attendance', 'Attendance', 'Clock-in and clock-out records, late arrivals and overtime.', [
  'employee_id*|Employee|ref:employees', 'date*|Date|date', 'clock_in|Clock in|time', 'clock_out|Clock out|time', 'late_minutes|Late (min)|number', 'overtime_minutes|Overtime (min)|number', 'status|Status|select:present,late,absent,half_day,on_leave',
], { title: 'employee_id', ownerField: 'employee_id' });
E('hrm', 'leave_types', 'Leave types', 'Kinds of leave and how many days per year.', [
  'name*|Leave type|text', 'days*|Days per year|number', 'paid|Paid leave|bool', 'carry_forward|Can carry forward|bool',
]);
E('hrm', 'leave_applications', 'Leave applications', 'Leave requests waiting for approval and their history.', [
  'employee_id*|Employee|ref:employees', 'leave_type_id*|Leave type|ref:leave_types', 'start*|From|date', 'end*|To|date', 'days|Days|number', 'reason|Reason|textarea', 'approved_by|Approved by|text', 'status|Status|select:pending,approved,rejected',
], { title: 'employee_id', ownerField: 'employee_id', cols: ['employee_id', 'leave_type_id', 'start', 'end', 'days', 'status'] });
E('hrm', 'salary_components', 'Allowances & deductions', 'Recurring salary additions and deductions per employee (set salary).', [
  'employee_id*|Employee|ref:employees', 'name*|Component|text', 'type*|Type|select:allowance,deduction,commission,loan,overtime,tax', 'amount*|Amount|money', 'recurring|Every month|bool',
], { title: 'name' });
E('hrm', 'payslips', 'Payslips', 'Monthly salary slips. Use "Run payroll" to generate them for everyone.', [
  'employee_id*|Employee|ref:employees', 'month*|Month|text', 'basic|Basic|money', 'allowances|Allowances|money', 'deductions|Deductions|money', 'overtime|Overtime|money', 'service_charge|Service charge share|money', 'net|Net pay|money', 'status|Status|select:draft,paid',
], { title: 'month', ownerField: 'employee_id', cols: ['employee_id', 'month', 'basic', 'allowances', 'deductions', 'net', 'status'] });
E('hrm', 'holidays', 'Holidays', 'Public and company holidays.', [
  'name*|Holiday|text', 'date*|Date|date', 'type|Type|select:Public,Poya,Company,Optional',
], { calendar: 'date' });
E('hrm', 'announcements', 'Announcements', 'Messages to all staff or a department.', [
  'title*|Title|text', 'department_id|For department|ref:departments', 'start|From|date', 'end|Until|date', 'message|Message|textarea',
]);
E('hrm', 'events', 'Company events', 'Staff events, trainings and celebrations.', [
  'title*|Event|text', 'date*|Date|date', 'time|Time|time', 'location|Location|text', 'color|Colour|color', 'description|Description|textarea',
], { calendar: 'date' });
E('hrm', 'documents', 'HR documents', 'Policies and employee documents with expiry reminders.', [
  'name*|Document|text', 'employee_id|Employee (if personal)|ref:employees', 'type|Type|select:Policy,Contract,ID copy,Certificate,Visa,Other', 'expiry|Expires on|date', 'link|File link|url',
]);
E('hrm', 'acknowledgments', 'Acknowledgments', 'Track which staff have read and accepted a policy.', [
  'employee_id*|Employee|ref:employees', 'document_id*|Document|ref:documents', 'date|Acknowledged on|date', 'status|Status|select:pending,acknowledged',
], { title: 'employee_id' });
E('hrm', 'awards', 'Awards', 'Recognition given to staff.', [
  'employee_id*|Employee|ref:employees', 'award*|Award|select:Employee of the month,Best service,Perfect attendance,Top seller,Long service', 'date|Date|date', 'gift|Gift|text', 'description|Description|textarea',
], { title: 'award' });
E('hrm', 'promotions_hr', 'Promotions', 'Job promotions and salary changes.', [
  'employee_id*|Employee|ref:employees', 'designation_id|New designation|ref:designations', 'date|Effective from|date', 'new_salary|New salary|money', 'description|Notes|textarea',
], { title: 'employee_id', singular: 'Promotion' });
E('hrm', 'hr_transfers', 'Staff transfers', 'Moves between branches and departments.', [
  'employee_id*|Employee|ref:employees', 'branch_id|To branch|ref:branches', 'department_id|To department|ref:departments', 'date|Effective from|date', 'description|Notes|textarea',
], { title: 'employee_id', singular: 'Staff transfer' });
E('hrm', 'warnings', 'Warnings', 'Formal warnings issued to staff.', [
  'employee_id*|Employee|ref:employees', 'subject*|Subject|text', 'date|Date|date', 'description|Details|textarea',
], { title: 'subject' });
E('hrm', 'complaints', 'Complaints', 'Complaints raised by or about staff.', [
  'from_id*|Complaint from|ref:employees', 'against_id|Against|ref:employees', 'title*|Title|text', 'date|Date|date', 'description|Details|textarea', 'status|Status|select:open,investigating,resolved',
], { title: 'title' });
E('hrm', 'resignations', 'Resignations', 'Resignation letters and notice periods.', [
  'employee_id*|Employee|ref:employees', 'notice_date|Notice date|date', 'last_day|Last working day|date', 'reason|Reason|textarea', 'status|Status|select:pending,accepted',
], { title: 'employee_id', ownerField: 'employee_id' });
E('hrm', 'terminations', 'Terminations', 'Staff exits initiated by the company.', [
  'employee_id*|Employee|ref:employees', 'type|Type|select:Misconduct,Performance,Redundancy,End of contract', 'notice_date|Notice date|date', 'date|Termination date|date', 'description|Details|textarea',
], { title: 'employee_id' });
E('hrm', 'timesheets', 'Timesheets', 'Hours staff spent on projects and tasks.', [
  'employee_id*|Employee|ref:employees', 'project_id|Project|ref:projects', 'task_id|Task|ref:tasks', 'date*|Date|date', 'hours*|Hours|number', 'notes|Notes|text', 'status|Status|select:submitted,approved,rejected',
], { title: 'employee_id', ownerField: 'employee_id' });
E('hrm', 'training_types', 'Training types', 'Categories of training.', ['name*|Type|text']);
E('hrm', 'trainers', 'Trainers', 'Internal and external trainers.', [
  'name*|Trainer|text', 'email|Email|email', 'phone|Phone|phone', 'expertise|Expertise|text', 'type|Type|select:Internal,External',
]);
E('hrm', 'trainings', 'Trainings', 'Training sessions, who attends and the outcome.', [
  'title*|Training|text', 'type_id|Type|ref:training_types', 'trainer_id|Trainer|ref:trainers', 'employee_ids|Attendees|refs:employees', 'start|Start|date', 'end|End|date', 'cost|Cost|money', 'status|Status|select:planned,ongoing,completed,cancelled',
], { calendar: 'start' });
E('hrm', 'review_cycles', 'Review cycles', 'Periods in which performance reviews are done.', [
  'name*|Cycle|text', 'start|Start|date', 'end|End|date', 'status|Status|select:upcoming,active,closed',
]);
E('hrm', 'indicators', 'Performance indicators', 'What is measured in reviews, per designation.', [
  'name*|Indicator|text', 'designation_id|Designation|ref:designations', 'weight|Weight|percent', 'description|Description|textarea',
]);
E('hrm', 'reviews', 'Employee reviews', 'Performance reviews with ratings and comments.', [
  'employee_id*|Employee|ref:employees', 'cycle_id|Cycle|ref:review_cycles', 'reviewer|Reviewer|text', 'rating*|Overall rating|rating', 'strengths|Strengths|textarea', 'improvements|To improve|textarea', 'status|Status|select:draft,submitted,acknowledged',
], { title: 'employee_id', ownerField: 'employee_id' });
E('hrm', 'employee_goals', 'Employee goals', 'Personal goals agreed with each employee.', [
  'employee_id*|Employee|ref:employees', 'goal*|Goal|text', 'target_date|Target date|date', 'progress|Progress|percent', 'status|Status|select:not_started,in_progress,achieved,missed',
], { title: 'goal', ownerField: 'employee_id' });

// ---------------------------------------------------------------- RECRUITMENT
E('recruitment', 'job_locations', 'Job locations', 'Where jobs are based.', ['name*|Location|text', 'address|Address|text', 'remote|Remote allowed|bool']);
E('recruitment', 'jobs', 'Job postings', 'Open positions published on your careers page.', [
  'title*|Job title|text', 'department_id|Department|ref:departments', 'location_id|Location|ref:job_locations', 'type|Type|select:Full time,Part time,Contract,Internship', 'openings|Openings|number', 'salary_range|Salary range|text', 'closing|Closing date|date', 'description|Description|textarea', 'status|Status|select:open,closed,draft',
]);
E('recruitment', 'candidates', 'Candidates', 'People who applied, moving through your hiring stages.', [
  'name*|Candidate|text', 'email|Email|email', 'phone|Phone|phone', 'job_id|Applied for|ref:jobs', 'experience|Experience (years)|number', 'resume|CV link|url', 'rating|Rating|rating', 'stage|Stage|select:applied,screening,interview,offer,hired,rejected',
], { kanban: 'stage', status: 'stage' });
E('recruitment', 'interview_rounds', 'Interview rounds', 'Stages of interviews for each job.', ['name*|Round|text', 'order|Order|number', 'description|Description|textarea']);
E('recruitment', 'interviews', 'Interviews', 'Scheduled interviews and feedback.', [
  'candidate_id*|Candidate|ref:candidates', 'round_id|Round|ref:interview_rounds', 'date*|Date|date', 'time|Time|time', 'interviewer|Interviewer|text', 'mode|Mode|select:In person,Phone,Video', 'feedback|Feedback|textarea', 'status|Status|select:scheduled,completed,cancelled,no_show',
], { title: 'candidate_id', calendar: 'date' });
E('recruitment', 'assessments', 'Candidate assessments', 'Test scores and evaluations.', [
  'candidate_id*|Candidate|ref:candidates', 'test|Assessment|text', 'score|Score|number', 'max_score|Out of|number', 'result|Result|select:pass,fail,pending',
], { title: 'test' });
E('recruitment', 'offers', 'Offers', 'Job offers sent to candidates.', [
  'candidate_id*|Candidate|ref:candidates', 'job_id|Job|ref:jobs', 'salary|Offered salary|money', 'joining|Joining date|date', 'expires|Offer expires|date', 'status|Status|select:draft,sent,accepted,declined',
], { title: 'candidate_id' });
E('recruitment', 'checklist_items', 'Onboarding checklist', 'Steps every new hire must complete.', ['name*|Step|text', 'responsible|Responsible|text', 'order|Order|number']);
E('recruitment', 'onboarding', 'Candidate onboarding', 'Progress of new hires through the onboarding checklist.', [
  'candidate_id*|New hire|ref:candidates', 'start|Start date|date', 'completed_steps|Steps done|number', 'total_steps|Total steps|number', 'buddy|Buddy|text', 'status|Status|select:pending,in_progress,completed',
], { title: 'candidate_id' });
E('recruitment', 'custom_questions', 'Application questions', 'Extra questions shown on the job application form.', ['question*|Question|text', 'type|Answer type|select:Text,Yes/No,Number,Choice', 'required|Required|bool']);

// ---------------------------------------------------------------- CRM
E('crm', 'pipelines', 'Pipelines', 'Sales processes, each with its own stages.', ['name*|Pipeline|text', 'status|Status|select:active,inactive']);
E('crm', 'lead_sources', 'Lead sources', 'Where leads come from.', ['name*|Source|text']);
E('crm', 'leads', 'Leads', 'Potential customers. Drag them across stages as you follow up.', [
  'name*|Lead name|text', 'company|Company|text', 'email|Email|email', 'phone|Phone|phone', 'source_id|Source|ref:lead_sources', 'owner|Owner|text', 'value|Expected value|money', 'follow_up|Next follow-up|date', 'notes|Notes|textarea', 'stage|Stage|select:new,contacted,qualified,proposal,won,lost',
], { kanban: 'stage', status: 'stage', cols: ['name', 'company', 'source_id', 'owner', 'value', 'stage'] });
E('crm', 'deals', 'Deals', 'Qualified opportunities with value and close date.', [
  'name*|Deal|text', 'customer_id|Customer|ref:customers', 'pipeline_id|Pipeline|ref:pipelines', 'value*|Deal value|money', 'probability|Win chance|percent', 'close_date|Expected close|date', 'owner|Owner|text', 'stage|Stage|select:discovery,proposal,negotiation,won,lost',
], { kanban: 'stage', status: 'stage' });
E('crm', 'activities', 'Calls, meetings & tasks', 'Follow-up activities on leads and deals.', [
  'subject*|Subject|text', 'type|Type|select:Call,Meeting,Email,Task,Site visit', 'lead_id|Lead|ref:leads', 'deal_id|Deal|ref:deals', 'date|Due|date', 'owner|Owner|text', 'status|Status|select:planned,done,missed',
], { calendar: 'date' });

// ---------------------------------------------------------------- PROJECTS / GOALS / CONTRACTS
E('projects', 'projects', 'Projects', 'Projects with budget, team and progress.', [
  'name*|Project|text', 'customer_id|Client|ref:customers', 'manager|Manager|text', 'member_ids|Team|refs:employees', 'start|Start|date', 'end|Deadline|date', 'budget|Budget|money', 'progress|Progress|percent', 'description|Description|textarea', 'status|Status|select:planning,active,on_hold,completed,cancelled',
]);
E('projects', 'milestones', 'Milestones', 'Key checkpoints inside a project.', [
  'name*|Milestone|text', 'project_id*|Project|ref:projects', 'due|Due|date', 'cost|Cost|money', 'status|Status|select:pending,completed',
]);
E('projects', 'tasks', 'Tasks', 'Work items. Drag across the board as they progress.', [
  'title*|Task|text', 'project_id|Project|ref:projects', 'assignee_id|Assigned to|ref:employees', 'priority|Priority|select:low,medium,high,critical', 'due|Due|date', 'estimate_hours|Estimate (h)|number', 'description|Description|textarea', 'status|Status|select:todo,in_progress,review,done',
], { kanban: 'status', ownerField: 'assignee_id', calendar: 'due' });
E('projects', 'bugs', 'Bugs & issues', 'Problems reported in projects.', [
  'title*|Issue|text', 'project_id|Project|ref:projects', 'assignee_id|Assigned to|ref:employees', 'severity|Severity|select:minor,major,critical', 'description|Steps to reproduce|textarea', 'status|Status|select:open,in_progress,resolved,closed',
], { kanban: 'status' });
E('goals', 'goal_categories', 'Goal categories', 'Groups for company goals.', ['name*|Category|text', 'color|Colour|color']);
E('goals', 'goals', 'Company goals', 'Targets for the business, with progress tracking.', [
  'title*|Goal|text', 'category_id|Category|ref:goal_categories', 'owner|Owner|text', 'target|Target value|number', 'current|Current value|number', 'unit|Unit|text', 'start|Start|date', 'end|End|date', 'status|Status|select:on_track,at_risk,behind,achieved',
]);
E('goals', 'goal_milestones', 'Goal milestones', 'Checkpoints on the way to a goal.', ['goal_id*|Goal|ref:goals', 'name*|Milestone|text', 'due|Due|date', 'status|Status|select:pending,done'], { title: 'name' });
E('goals', 'goal_tracking', 'Goal tracking', 'Progress updates recorded against goals.', ['goal_id*|Goal|ref:goals', 'date|Date|date', 'value*|Value reached|number', 'note|Note|text'], { title: 'goal_id' });
E('goals', 'contributions', 'Contributions', 'Who contributed what toward each goal.', ['goal_id*|Goal|ref:goals', 'employee_id|Employee|ref:employees', 'amount|Contribution|number', 'note|Note|text'], { title: 'goal_id' });
E('contracts', 'contract_types', 'Contract types', 'Kinds of contracts you sign.', ['name*|Type|text']);
E('contracts', 'contracts', 'Contracts', 'Signed agreements with clients and suppliers, with renewal dates.', [
  'subject*|Subject|text', 'party|Other party|text', 'type_id|Type|ref:contract_types', 'value|Value|money', 'start|Start|date', 'end|End|date', 'signed|Signed|bool', 'description|Terms|textarea', 'status|Status|select:draft,active,expiring,expired,terminated',
]);

// ---------------------------------------------------------------- SUPPORT
E('support', 'tickets', 'Support tickets', 'Customer issues and requests. Assign, reply and close.', [
  'number|Ticket no.|text', 'subject*|Subject|text', 'customer_id|Customer|ref:customers', 'category|Category|select:Billing,Booking,Order,Product,Technical,Other', 'priority|Priority|select:low,medium,high,urgent', 'assignee_id|Assigned to|ref:employees', 'message|Message|textarea', 'status|Status|select:open,in_progress,waiting,resolved,closed',
], { title: 'subject', prefix: 'TK-', kanban: 'status', cols: ['number', 'subject', 'customer_id', 'priority', 'assignee_id', 'status'] });
E('support', 'kb_articles', 'Knowledge base', 'Help articles for staff and customers.', ['title*|Article|text', 'category|Category|text', 'content|Content|textarea', 'views|Views|number', 'status|Status|select:published,draft']);
E('support', 'faqs', 'FAQ', 'Frequently asked questions shown on your public pages.', ['question*|Question|text', 'answer*|Answer|textarea', 'order|Order|number', 'status|Status|select:published,draft']);
E('support', 'contacts', 'Contact messages', 'Messages sent through your public contact form.', ['name*|Name|text', 'email|Email|email', 'subject|Subject|text', 'message|Message|textarea', 'date|Date|date', 'status|Status|select:new,replied']);

// ---------------------------------------------------------------- WORKSPACE
E('workspace', 'meetings', 'Zoom meetings', 'Online meetings with join links.', [
  'title*|Meeting|text', 'date*|Date|date', 'time|Time|time', 'duration|Duration (min)|number', 'host|Host|text', 'join_url|Join link|url', 'password|Meeting password|text', 'status|Status|select:scheduled,live,ended',
], { calendar: 'date' });
E('workspace', 'forms', 'Form builder', 'Build forms (feedback, applications, surveys) and share a link.', [
  'name*|Form|text', 'description|Description|textarea', 'fields|Fields (one per line: Label:type)|textarea', 'responses|Responses|number', 'status|Status|select:active,closed',
]);
E('workspace', 'form_responses', 'Form responses', 'Answers submitted through your forms.', ['form_id*|Form|ref:forms', 'submitted_by|Submitted by|text', 'answers|Answers|textarea', 'date|Date|datetime'], { title: 'submitted_by' });
E('workspace', 'media', 'Media library', 'Images and files used across the system.', ['name*|File name|text', 'type|Type|select:image,pdf,document,video', 'size_kb|Size (KB)|number', 'folder|Folder|text', 'url|Link|url', 'uploaded|Uploaded|date']);
E('workspace', 'notes', 'Notes', 'Personal and shared notes.', ['title*|Title|text', 'content|Note|textarea', 'shared|Shared with team|bool', 'color|Colour|color']);

export const ENTITY_LIST = Object.values(ENTITIES);
export const entityLabel = (key) => ENTITIES[key]?.label || key;
