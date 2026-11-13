const districtSource = 'https://ghaziabad.nic.in/%E0%A4%97%E0%A4%BE%E0%A4%9C%E0%A4%BF%E0%A4%AF%E0%A4%BE%E0%A4%AC%E0%A4%BE%E0%A4%A6-%E0%A4%AE%E0%A5%87%E0%A4%82-%E0%A4%B8%E0%A4%82%E0%A4%9A%E0%A4%BE%E0%A4%B2%E0%A4%BF%E0%A4%A4-%E0%A4%AF%E0%A5%8B/%E0%A4%A8%E0%A4%BF%E0%A4%83%E0%A4%B6%E0%A5%81%E0%A4%B2%E0%A5%8D%E0%A4%95-%E0%A4%8F%E0%A4%AE%E0%A5%8D%E0%A4%AC%E0%A5%81%E0%A4%B2%E0%A5%87%E0%A4%A8%E0%A5%8D%E0%A4%B8-%E0%A4%B8%E0%A5%87%E0%A4%B5%E0%A4%BE/';

// District dispatch service records. Published district totals are aggregates, not mapped vehicle data.
export const GHAZIABAD_AMBULANCES = [
  {
    recordCode: 'GZB-AMB-108', name: '108 Ambulance Service', providerName: 'Uttar Pradesh Government Ambulance Service', ownership: 'government',
    category: 'government-108', serviceType: 'Emergency medical transport', contactNumber: '108', alternateContact: null,
    address: null, city: 'Ghaziabad', district: 'Ghaziabad', state: 'Uttar Pradesh', location: undefined,
    vehicleType: null, facilities: [], operatingHours: null, availabilityStatus: 'unknown',
    verificationStatus: 'official-source', sourceUrl: districtSource, sourcePublishedAt: new Date('2024-01-10T00:00:00.000Z'), lastVerifiedAt: new Date('2026-11-13T00:00:00.000Z'),
    scope: 'district-service', publishedFleetCount: 43,
  },
  {
    recordCode: 'GZB-AMB-102', name: '102 Ambulance Service', providerName: 'Uttar Pradesh Government Ambulance Service', ownership: 'government',
    category: 'government-102', serviceType: 'Maternal and infant transport', contactNumber: '102', alternateContact: null,
    address: null, city: 'Ghaziabad', district: 'Ghaziabad', state: 'Uttar Pradesh', location: undefined,
    vehicleType: null, facilities: [], operatingHours: null, availabilityStatus: 'unknown',
    verificationStatus: 'official-source', sourceUrl: districtSource, sourcePublishedAt: new Date('2024-01-10T00:00:00.000Z'), lastVerifiedAt: new Date('2026-11-13T00:00:00.000Z'),
    scope: 'district-service', publishedFleetCount: 43,
  },
  {
    recordCode: 'GZB-AMB-ALS', name: 'District Hospital ALS Ambulance Service', providerName: 'Ghaziabad District Hospital', ownership: 'government',
    category: 'als', serviceType: 'Advanced life support referral transport', contactNumber: null, alternateContact: null,
    address: null, city: 'Ghaziabad', district: 'Ghaziabad', state: 'Uttar Pradesh', location: undefined,
    vehicleType: 'Advanced life support ambulance', facilities: [], operatingHours: null, availabilityStatus: 'unknown',
    verificationStatus: 'official-source', sourceUrl: districtSource, sourcePublishedAt: new Date('2024-01-10T00:00:00.000Z'), lastVerifiedAt: new Date('2026-11-13T00:00:00.000Z'),
    scope: 'district-service', publishedFleetCount: 2,
  },
];

export default GHAZIABAD_AMBULANCES;
