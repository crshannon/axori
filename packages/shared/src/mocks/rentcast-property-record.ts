import type { PropertyDetails } from "../integrations/rentcast";

/**
 * Mock Rentcast API response data for local development
 * This matches the structure returned by the Rentcast Property Details API
 */
export const mockRentcastPropertyRecord: PropertyDetails = {
  id: "5500-Grand-Lake-Dr,-San-Antonio,-TX-78244",
  formattedAddress: "5500 Grand Lake Dr, San Antonio, TX 78244",
  addressLine1: "5500 Grand Lake Dr",
  addressLine2: null,
  city: "San Antonio",
  state: "TX",
  stateFips: "48",
  zipCode: "78244",
  county: "Bexar",
  countyFips: "029",
  latitude: 29.475962,
  longitude: -98.351442,
  propertyType: "Single Family",
  bedrooms: 3,
  bathrooms: 2,
  squareFootage: 1878,
  lotSize: 8850,
  yearBuilt: 1973,
  assessorID: "05076-103-0500",
  legalDescription: "CB 5076A BLK 3 LOT 50",
  subdivision: "WOODLAKE",
  zoning: "RH",
  lastSaleDate: "2024-11-18T00:00:00.000Z",
  lastSalePrice: 270000,
  hoa: {
    fee: 175,
  },
  features: {
    architectureType: "Contemporary",
    cooling: true,
    coolingType: "Central",
    exteriorType: "Wood",
    fireplace: true,
    fireplaceType: "Masonry",
    floorCount: 1,
    foundationType: "Slab / Mat / Raft",
    garage: true,
    garageSpaces: 2,
    garageType: "Garage",
    heating: true,
    heatingType: "Forced Air",
    pool: true,
    poolType: "Concrete",
    roofType: "Asphalt",
    roomCount: 5,
    unitCount: 1,
    viewType: "City",
  },
  taxAssessments: {
    "2020": {
      year: 2020,
      value: 142610,
      land: 23450,
      improvements: 119160,
    },
    "2021": {
      year: 2021,
      value: 163440,
      land: 45050,
      improvements: 118390,
    },
    "2022": {
      year: 2022,
      value: 197600,
      land: 49560,
      improvements: 148040,
    },
    "2023": {
      year: 2023,
      value: 225790,
      land: 59380,
      improvements: 166410,
    },
    "2024": {
      year: 2024,
      value: 216513,
      land: 59380,
      improvements: 157133,
    },
  },
  propertyTaxes: {
    "2020": {
      year: 2020,
      total: 3023,
    },
    "2021": {
      year: 2021,
      total: 3455,
    },
    "2022": {
      year: 2022,
      total: 4077,
    },
    "2023": {
      year: 2023,
      total: 4201,
    },
    "2024": {
      year: 2024,
      total: 4065,
    },
  },
  history: {
    "2017-10-19": {
      event: "Sale",
      date: "2017-10-19T00:00:00.000Z",
      price: 185000,
    },
    "2024-11-18": {
      event: "Sale",
      date: "2024-11-18T00:00:00.000Z",
      price: 270000,
    },
  },
  owner: {
    names: ["Rolando Villarreal"],
    type: "Individual",
    mailingAddress: {
      id: "5500-Grand-Lake-Dr,-San-Antonio,-TX-78244",
      formattedAddress: "5500 Grand Lake Dr, San Antonio, TX 78244",
      addressLine1: "5500 Grand Lake Dr",
      addressLine2: null,
      city: "San Antonio",
      state: "TX",
      stateFips: "48",
      zipCode: "78244",
    },
  },
  ownerOccupied: true,
};

