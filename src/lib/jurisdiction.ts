/**
 * Indian Jurisdictional Routing & NCRP Law Enforcement Data
 * Maps State -> District -> Designated Cyber Crime Police Station
 */

export interface DistrictMapping {
  district: string;
  policeStation: string;
}

export interface StateJurisdiction {
  state: string;
  districts: DistrictMapping[];
}

export const INDIAN_JURISDICTIONS: StateJurisdiction[] = [
  {
    state: "Delhi",
    districts: [
      { district: "New Delhi", policeStation: "Cyber Crime Police Station, New Delhi District" },
      { district: "South Delhi", policeStation: "Cyber Crime Police Station, South District (Hauz Khas)" },
      { district: "South West Delhi", policeStation: "Cyber Crime Police Station, South West (Dwarka)" },
      { district: "North West Delhi", policeStation: "Cyber Crime Police Station, North West (Rohini)" },
      { district: "Central Delhi", policeStation: "Cyber Crime Police Station, Central District" },
      { district: "East Delhi", policeStation: "Cyber Crime Police Station, East District (Preet Vihar)" },
      { district: "West Delhi", policeStation: "Cyber Crime Police Station, West District (Rajouri Garden)" },
      { district: "North Delhi", policeStation: "Cyber Crime Police Station, North District" },
      { district: "Shahdara", policeStation: "Cyber Crime Police Station, Shahdara" },
    ],
  },
  {
    state: "Karnataka",
    districts: [
      { district: "Bengaluru Urban (East)", policeStation: "Cyber Economic & Narcotics Crime Police Station (CEN), Bengaluru East" },
      { district: "Bengaluru Urban (West)", policeStation: "Cyber Economic & Narcotics Crime Police Station (CEN), Bengaluru West" },
      { district: "Bengaluru Urban (South)", policeStation: "Cyber Economic & Narcotics Crime Police Station (CEN), Bengaluru South" },
      { district: "Bengaluru Urban (North)", policeStation: "Cyber Economic & Narcotics Crime Police Station (CEN), Bengaluru North" },
      { district: "Bengaluru Rural", policeStation: "Cyber Crime Police Station, Bengaluru Rural SP Office" },
      { district: "Mysuru", policeStation: "CEN Police Station, Mysuru City" },
      { district: "Mangaluru (Dakshina Kannada)", policeStation: "CEN Crime Police Station, Mangaluru City" },
      { district: "Hubballi-Dharwad", policeStation: "CEN Crime Police Station, Hubballi-Dharwad" },
      { district: "Belagavi", policeStation: "CEN Crime Police Station, Belagavi" },
    ],
  },
  {
    state: "Maharashtra",
    districts: [
      { district: "Mumbai (BKC Cyber Unit)", policeStation: "Cyber Crime Police Station, BKC, Mumbai" },
      { district: "Mumbai Suburban (North)", policeStation: "North Region Cyber Police Station, Borivali, Mumbai" },
      { district: "Mumbai Suburban (East)", policeStation: "East Region Cyber Police Station, Ghatkopar, Mumbai" },
      { district: "Mumbai City (South)", policeStation: "South Region Cyber Police Station, Colaba, Mumbai" },
      { district: "Pune City", policeStation: "Cyber Police Station, Shivaji Nagar, Pune" },
      { district: "Thane", policeStation: "Cyber Crime Police Station, Thane City" },
      { district: "Navi Mumbai", policeStation: "Cyber Police Station, CBD Belapur, Navi Mumbai" },
      { district: "Nagpur", policeStation: "Cyber Police Station, Nagpur City" },
      { district: "Nashik", policeStation: "Cyber Crime Police Station, Nashik City" },
    ],
  },
  {
    state: "Uttar Pradesh",
    districts: [
      { district: "Gautam Buddha Nagar (Noida)", policeStation: "Cyber Crime Police Station, Sector 36, Noida" },
      { district: "Lucknow", policeStation: "Cyber Crime Police Station, Vibhuti Khand, Gomti Nagar, Lucknow" },
      { district: "Ghaziabad", policeStation: "Cyber Crime Police Station, Kavi Nagar, Ghaziabad" },
      { district: "Kanpur Nagar", policeStation: "Cyber Crime Police Station, Commissionerate, Kanpur" },
      { district: "Varanasi", policeStation: "Cyber Crime Police Station, Sigra, Varanasi" },
      { district: "Agra", policeStation: "Cyber Crime Police Station, Agra Commissionerate" },
      { district: "Prayagraj (Allahabad)", policeStation: "Cyber Crime Police Station, Civil Lines, Prayagraj" },
      { district: "Meerut", policeStation: "Cyber Crime Police Station, Meerut" },
    ],
  },
  {
    state: "Telangana",
    districts: [
      { district: "Hyderabad City", policeStation: "Cyber Crime Police Station, CCS, Hyderabad" },
      { district: "Cyberabad", policeStation: "Cyber Crime Police Station, Cyberabad Commissionerate (Gachibowli)" },
      { district: "Rachakonda", policeStation: "Cyber Crime Police Station, Rachakonda Commissionerate" },
      { district: "Warangal", policeStation: "Cyber Crime Police Station, Warangal" },
    ],
  },
  {
    state: "Tamil Nadu",
    districts: [
      { district: "Chennai (Central Cyber Wing)", policeStation: "Cyber Crime Police Station, Greater Chennai Police, Vepery" },
      { district: "Chennai (South)", policeStation: "Cyber Crime Wing, St. Thomas Mount, Chennai" },
      { district: "Coimbatore", policeStation: "Cyber Crime Police Station, Coimbatore City" },
      { district: "Madurai", policeStation: "Cyber Crime Police Station, Madurai City" },
      { district: "Tiruchirappalli", policeStation: "Cyber Crime Police Station, Tiruchirappalli City" },
    ],
  },
  {
    state: "Gujarat",
    districts: [
      { district: "Ahmedabad City", policeStation: "Cyber Crime Police Station, Mithakhali, Ahmedabad" },
      { district: "Surat City", policeStation: "Cyber Crime Police Station, Althan, Surat" },
      { district: "Vadodara City", policeStation: "Cyber Crime Police Station, Vadodara" },
      { district: "Rajkot City", policeStation: "Cyber Crime Police Station, Rajkot" },
      { district: "Gandhinagar", policeStation: "CID Crime Cyber Police Station, Gandhinagar" },
    ],
  },
  {
    state: "West Bengal",
    districts: [
      { district: "Kolkata", policeStation: "Cyber Crime Police Station, Lalbazar, Kolkata Police" },
      { district: "Bidhannagar (Salt Lake)", policeStation: "Cyber Crime Police Station, Bidhannagar Commissionerate" },
      { district: "Howrah", policeStation: "Cyber Crime Police Station, Howrah City Police" },
      { district: "North 24 Parganas", policeStation: "Cyber Crime Police Station, Barasat" },
    ],
  },
  {
    state: "Rajasthan",
    districts: [
      { district: "Jaipur City", policeStation: "Special Cyber Crime Police Station, Jaipur" },
      { district: "Jodhpur", policeStation: "Cyber Crime Police Station, Jodhpur Commissionerate" },
      { district: "Kota", policeStation: "Cyber Crime Police Station, Kota City" },
      { district: "Udaipur", policeStation: "Cyber Crime Police Station, Udaipur" },
    ],
  },
  {
    state: "Haryana",
    districts: [
      { district: "Gurugram (Manesar / East)", policeStation: "Cyber Crime Police Station, Sector 43, Gurugram" },
      { district: "Gurugram (West)", policeStation: "Cyber Crime Police Station, Sector 51, Gurugram" },
      { district: "Faridabad", policeStation: "Cyber Crime Police Station, Sector 12, Faridabad" },
      { district: "Panchkula", policeStation: "State Cyber Crime Police Station, Panchkula" },
    ],
  },
  {
    state: "Kerala",
    districts: [
      { district: "Thiruvananthapuram", policeStation: "Cyber Crime Police Station, Thiruvananthapuram City" },
      { district: "Kochi (Ernakulam)", policeStation: "Cyber Crime Police Station, Infopark, Kochi" },
      { district: "Kozhikode", policeStation: "Cyber Crime Police Station, Kozhikode City" },
    ],
  },
  {
    state: "Punjab",
    districts: [
      { district: "SAS Nagar (Mohali)", policeStation: "State Cyber Crime Cell, Phase 4, Mohali" },
      { district: "Ludhiana", policeStation: "Cyber Crime Police Station, Ludhiana" },
      { district: "Amritsar", policeStation: "Cyber Crime Police Station, Amritsar" },
    ],
  },
  {
    state: "Other State / UT",
    districts: [
      { district: "General / Other District", policeStation: "State Cyber Crime Cell / Nearest Local Police Station" },
    ],
  },
];

export const NATIONAL_ID_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Voter ID",
  "Driving License",
  "Passport",
] as const;

export const INCIDENT_CHANNELS = [
  "WhatsApp",
  "Telegram",
  "Phone Call",
  "SMS",
  "Instagram",
  "Facebook",
  "Malicious APK / Mobile App",
  "Fake Website / Phishing Link",
  "Email",
  "Dating / Matrimonial App",
  "Other",
] as const;
