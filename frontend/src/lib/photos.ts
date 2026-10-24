// Free-to-use photos from Unsplash (Unsplash License: free for commercial use, no attribution required).
// The owner can replace any of these with the resort's own photos in Administration → Website & photos.
export const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;
export const P = {
  heroSlides: [u('1520250497591-112f2f40a3f4', 2200), u('1763757699814-52a57d4a12d6', 2200), u('1641149750086-b11cd21d1f60', 2200), u('1665849050430-5e8c16bacf7e', 2200)],
  hero: u('1520250497591-112f2f40a3f4', 2200),
  pool: u('1610641818989-c2051b5e2cfd', 1200),
  garden: u('1584132967334-10e028bd69f7', 1200),
  restaurant: u('1585937421612-70a008356fbe', 1400),
  seafood: u('1534939561126-855b8675edd7', 900),
  curry: u('1596797038530-2c107229654b', 900),
  spa: u('1778331246390-2b91f56864e4', 1200),
  kandy: u('1763757699814-52a57d4a12d6', 1600),
  tea: u('1641149750086-b11cd21d1f60', 2000),
  login: u('1763757699814-52a57d4a12d6', 1600),
  rooms: [u('1611892440504-42a792e24d32', 1200), u('1582719478250-c89cae4dc85b', 1200), u('1689729771136-46e2ee831b83', 1200), u('1689729739836-7fcc2c84d788', 1200), '/images/room-deluxe.webp'],
};
export const EXPLORE = [
  { title: 'Temple of the Sacred Tooth Relic', text: 'Sri Lanka’s most revered temple, beside Kandy Lake. Do not miss the evening puja.', img: u('1665849050430-5e8c16bacf7e', 1000) },
  { title: 'Kandy Lake', text: 'A gentle walk around the historic lake at the heart of the city.', img: u('1626091022888-485eb96c494a', 1000) },
  { title: 'Bahirawakanda Buddha viewpoint', text: 'The great white Buddha watching over Kandy — best at sunset.', img: u('1757439828776-a76d0af71a78', 1000) },
  { title: 'Royal Botanical Gardens, Peradeniya', text: 'Orchids, giant bamboo and the famous avenue of royal palms.', img: u('1728626674816-9a4310514f18', 1000) },
  { title: 'Tea estates & Ceylon Tea Museum', text: 'See how Ceylon tea is made, then taste it where it grows.', img: u('1755100283596-e4c13e88de71', 1000) },
  { title: 'Kandyan cultural dance', text: 'Drums, fire-walking and the costumes of the Kandyan kingdom.', img: u('1566766188646-5d0310191714', 1000) },
];
export const SERVICE_IMG: Record<string, string> = {
  Spa: u('1778331246390-2b91f56864e4', 900), Tour: u('1665849050332-8d5d7e59afb6', 900), Transport: u('1566296314736-6eaac1ca0cb9', 900),
  Dining: u('1520250497591-112f2f40a3f4', 900), Activity: u('1566766188646-5d0310191714', 900),
};
export const serviceImg = (s: any) => (/tea/i.test(s.name) ? u('1544015759-237f87d55ef3', 900) : /peradeniya|garden/i.test(s.name) ? u('1728626674816-9a4310514f18', 900) : SERVICE_IMG[s.category] || u('1610641818989-c2051b5e2cfd', 900));
