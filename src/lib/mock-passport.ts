export const seller = {
  name: "kevin",
  storeName: "Kevin Resale Studio",
  verificationStatus: "Seller Verified",
  country: "Indonesia",
  joinedAt: "May 2026",
} as const;

export type SellerPassport = {
  passportId: string;
  productName: string;
  category: string;
  brand: string;
  model: string;
  condition: string;
  verificationStatus: string;
  identifierStatus: string;
  warrantyStatus: string;
  solanaStatus: string;
  qrStatus: string;
  createdAt: string;
  publicLink: string;
};

export const passports: SellerPassport[] = [
  {
    passportId: "TL-000001",
    productName: "iPhone 13 Pro Max",
    category: "Electronics",
    brand: "Apple",
    model: "13 Pro Max",
    condition: "Like New",
    verificationStatus: "Seller Verified",
    identifierStatus: "Protected",
    warrantyStatus: "No Warranty",
    solanaStatus: "Not Minted",
    qrStatus: "QR Ready",
    createdAt: "May 6, 2026",
    publicLink: "trustlayer.app/passport/TL-000001",
  },
  {
    passportId: "TL-000002",
    productName: "Omega Seamaster Professional",
    category: "Luxury Goods",
    brand: "Omega",
    model: "Seamaster Professional",
    condition: "Excellent",
    verificationStatus: "Seller Verified",
    identifierStatus: "Protected",
    warrantyStatus: "Store Warranty",
    solanaStatus: "Not Minted",
    qrStatus: "QR Ready",
    createdAt: "May 7, 2026",
    publicLink: "trustlayer.app/passport/TL-000002",
  },
  {
    passportId: "TL-000003",
    productName: "Fender Stratocaster",
    category: "Music Gear",
    brand: "Fender",
    model: "Stratocaster",
    condition: "Good",
    verificationStatus: "Draft",
    identifierStatus: "Not Added",
    warrantyStatus: "No Warranty",
    solanaStatus: "Not Minted",
    qrStatus: "Not Ready",
    createdAt: "May 8, 2026",
    publicLink: "trustlayer.app/passport/TL-000003",
  },
  {
    passportId: "TL-000004",
    productName: "Charizard Holo Card",
    category: "Collectibles",
    brand: "Pokémon",
    model: "Base Set",
    condition: "Excellent",
    verificationStatus: "Seller Verified",
    identifierStatus: "Protected",
    warrantyStatus: "No Warranty",
    solanaStatus: "Not Minted",
    qrStatus: "QR Ready",
    createdAt: "May 9, 2026",
    publicLink: "trustlayer.app/passport/TL-000004",
  },
];

export const verifiedPassport = {
  passportId: "TL-000001",
  category: "Electronics",
  productName: "iPhone 13 Pro Max",
  brand: "Apple",
  model: "13 Pro Max",
  condition: "Like New",
  maskedIdentifier: "132****29",
  sellerName: "kevin",
  verificationStatus: "Seller Verified",
  identifierStatus: "Protected",
  ownershipStatus: "Not linked",
  warrantyStatus: "No Warranty",
  solanaCertificate: "Not Minted",
  qrStatus: "QR Ready",
  publicLink: "trustlayer.app/passport/TL-000001",
} as const;

export type VerifiedPassport = typeof verifiedPassport;
