import data from '../data/restaurant.json';

export const site = data;

export const waLink = (message: string = data.contact.whatsappMessage) =>
  `https://wa.me/${data.contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const absUrl = (path = '/') => new URL(path, data.meta.siteUrl).toString();

const DAY_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function openingHoursSpec() {
  return data.hours.schedule.flatMap((s) =>
    s.slots.map(([opens, closes]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: s.days.map((d) => DAY_SCHEMA[d]),
      opens,
      closes: closes === '24:00' ? '23:59' : closes,
    })),
  );
}

export function restaurantJsonLd(ogImageUrl: string) {
  const l = data.location;
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': absUrl('/#restaurant'),
    name: data.brand.name,
    url: absUrl('/'),
    image: ogImageUrl,
    description: data.meta.description,
    servesCuisine: data.brand.cuisine,
    priceRange: data.brand.priceRange,
    telephone: data.contact.phoneHref,
    sameAs: [data.contact.instagram],
    hasMenu: absUrl('/carta'),
    acceptsReservations: true,
    address: {
      '@type': 'PostalAddress',
      streetAddress: l.street,
      addressLocality: l.city,
      addressRegion: l.region,
      postalCode: l.postalCode,
      addressCountry: l.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng },
    openingHoursSpecification: openingHoursSpec(),
  };
}
