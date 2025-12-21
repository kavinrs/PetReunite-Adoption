/**
 * City and State coordinates for mapping pet locations
 * Used when location_url doesn't contain extractable coordinates
 */

export const CITY_COORDS: Record<string, [number, number]> = {
  chennai: [13.0827, 80.2707],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.076, 72.8777],
  pune: [18.5204, 73.8567],
  hyderabad: [17.385, 78.4867],
  delhi: [28.6139, 77.209],
  ahmedabad: [23.0225, 72.5714],
  kolkata: [22.5726, 88.3639],
  coimbatore: [11.0168, 76.9558],
  madurai: [9.9252, 78.1198],
  nelore: [14.4426, 79.9865],
  nellore: [14.4426, 79.9865],
  visakhapatnam: [17.6868, 83.2185],
  tirupati: [13.6288, 79.4192],
  kochi: [9.9312, 76.2673],
  kozhikode: [11.2588, 75.7804],
  jaipur: [26.9124, 75.7873],
  // Additional cities from pet reports
  margao: [15.2832, 73.9667],
  pondicherry: [11.9416, 79.8083],
  puducherry: [11.9416, 79.8083],
  kanyakumari: [8.0883, 77.5385],
  ranchi: [23.3441, 85.3096],
  hosur: [12.7409, 77.8253],
  bhopal: [23.2599, 77.4126],
};

export const STATE_COORDS: Record<string, [number, number]> = {
  tamilnadu: [11.1271, 78.6569],
  tamil_nadu: [11.1271, 78.6569],
  "tamil nadu": [11.1271, 78.6569],
  karnataka: [15.3173, 75.7139],
  maharashtra: [19.7515, 75.7139],
  andhra_pradesh: [15.9129, 79.74],
  "andhra pradesh": [15.9129, 79.74],
  telangana: [17.1232, 79.2088],
  kerala: [10.8505, 76.2711],
  delhi: [28.6139, 77.209],
  gujarat: [22.2587, 71.1924],
  west_bengal: [22.9868, 87.855],
  "west bengal": [22.9868, 87.855],
  goa: [15.2993, 74.124],
  rajasthan: [27.0238, 74.2179],
  jharkhand: [23.6102, 85.2799],
  "madhya pradesh": [22.9734, 78.6569],
  madhya_pradesh: [22.9734, 78.6569],
};
