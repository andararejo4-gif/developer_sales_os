// ============================================================================
// DEVELOPER SALES OS - KATALOG 100 FITUR (F01-F100) & 48 AGENT (A01-A48)
// Blueprint v1.2 Bab 07 & Bab 09
// Entitlement Engine: Gold = 63, Platinum = 88, Diamond = 100
// ============================================================================

export type PlanCode = 'gold' | 'platinum' | 'diamond';
export type AutomationLevel = 'L0' | 'L1' | 'L2';
export type MinimumPlan = 'G' | 'P' | 'D';

export interface FeatureDefinition {
  id: string; // F01 - F100
  modul: string; // M01 - M17
  modul_name: string;
  nama: string;
  masalah_id: string; // P001 - P100
  paket_minimum: MinimumPlan; // G, P, D
  level_otomasi: AutomationLevel;
  satuan_aic?: string | null;
  description?: string;
}

export interface AgentDefinition {
  id: string; // A01 - A48
  nama: string;
  peran: string;
  kategori: 'Kontrol Bersama' | 'Spesialis';
  level_otomasi_default: AutomationLevel;
  pekerjaan_utama: string;
  batas_kewenangan: string;
}

export const FEATURES_CATALOG: FeatureDefinition[] = [
  {
    "id": "F01",
    "modul": "M01",
    "modul_name": "Project Truth & Onboarding",
    "nama": "OCR brosur",
    "masalah_id": "P001",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F02",
    "modul": "M01",
    "modul_name": "Project Truth & Onboarding",
    "nama": "Parser",
    "masalah_id": "P002",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F03",
    "modul": "M01",
    "modul_name": "Project Truth & Onboarding",
    "nama": "Geocode",
    "masalah_id": "P003",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F04",
    "modul": "M01",
    "modul_name": "Project Truth & Onboarding",
    "nama": "Knowledge",
    "masalah_id": "P004",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F05",
    "modul": "M01",
    "modul_name": "Project Truth & Onboarding",
    "nama": "Conflict &",
    "masalah_id": "P005",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F06",
    "modul": "M01",
    "modul_name": "Project Truth & Onboarding",
    "nama": "Change",
    "masalah_id": "P006",
    "paket_minimum": "G",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F07",
    "modul": "M02",
    "modul_name": "Market & Location Intelligence",
    "nama": "Persona &",
    "masalah_id": "P007",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F08",
    "modul": "M02",
    "modul_name": "Market & Location Intelligence",
    "nama": "STP &",
    "masalah_id": "P008",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F09",
    "modul": "M02",
    "modul_name": "Market & Location Intelligence",
    "nama": "7P, SWOT &",
    "masalah_id": "P009",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F10",
    "modul": "M02",
    "modul_name": "Market & Location Intelligence",
    "nama": "Competitor",
    "masalah_id": "P010",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F11",
    "modul": "M02",
    "modul_name": "Market & Location Intelligence",
    "nama": "POI, akses &",
    "masalah_id": "P011",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F12",
    "modul": "M02",
    "modul_name": "Market & Location Intelligence",
    "nama": "Demand &",
    "masalah_id": "P012",
    "paket_minimum": "G",
    "level_otomasi": "L0",
    "satuan_aic": "500 AIC"
  },
  {
    "id": "F13",
    "modul": "M03",
    "modul_name": "99 Keunggulan & Sales Narrative",
    "nama": "Generator 99",
    "masalah_id": "P013",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "400 AIC"
  },
  {
    "id": "F14",
    "modul": "M03",
    "modul_name": "99 Keunggulan & Sales Narrative",
    "nama": "Claim ledger",
    "masalah_id": "P014",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "100 AIC"
  },
  {
    "id": "F15",
    "modul": "M03",
    "modul_name": "99 Keunggulan & Sales Narrative",
    "nama": "Surat cinta",
    "masalah_id": "P015",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F16",
    "modul": "M03",
    "modul_name": "99 Keunggulan & Sales Narrative",
    "nama": "Elevator",
    "masalah_id": "P016",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F17",
    "modul": "M03",
    "modul_name": "99 Keunggulan & Sales Narrative",
    "nama": "Persona-to-",
    "masalah_id": "P017",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F18",
    "modul": "M03",
    "modul_name": "99 Keunggulan & Sales Narrative",
    "nama": "Deck,",
    "masalah_id": "P018",
    "paket_minimum": "G",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F19",
    "modul": "M04",
    "modul_name": "Content Command Center",
    "nama": "Kalender 30",
    "masalah_id": "P019",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "450 AIC"
  },
  {
    "id": "F20",
    "modul": "M04",
    "modul_name": "Content Command Center",
    "nama": "Caption,",
    "masalah_id": "P020",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F21",
    "modul": "M04",
    "modul_name": "Content Command Center",
    "nama": "Personal",
    "masalah_id": "P021",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F22",
    "modul": "M04",
    "modul_name": "Content Command Center",
    "nama": "Approval &",
    "masalah_id": "P022",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F23",
    "modul": "M04",
    "modul_name": "Content Command Center",
    "nama": "Content",
    "masalah_id": "P023",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F24",
    "modul": "M04",
    "modul_name": "Content Command Center",
    "nama": "Asset rights",
    "masalah_id": "P024",
    "paket_minimum": "G",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F25",
    "modul": "M05",
    "modul_name": "Creative Production Studio",
    "nama": "Poster &",
    "masalah_id": "P025",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "75 AIC"
  },
  {
    "id": "F26",
    "modul": "M05",
    "modul_name": "Creative Production Studio",
    "nama": "Video",
    "masalah_id": "P026",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F27",
    "modul": "M05",
    "modul_name": "Creative Production Studio",
    "nama": "AI visual",
    "masalah_id": "P027",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F28",
    "modul": "M05",
    "modul_name": "Creative Production Studio",
    "nama": "Voiceover &",
    "masalah_id": "P028",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F29",
    "modul": "M05",
    "modul_name": "Creative Production Studio",
    "nama": "Brand kit &",
    "masalah_id": "P029",
    "paket_minimum": "P",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F30",
    "modul": "M05",
    "modul_name": "Creative Production Studio",
    "nama": "Bulk",
    "masalah_id": "P030",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F31",
    "modul": "M06",
    "modul_name": "Project Website & Conversion",
    "nama": "Generator",
    "masalah_id": "P031",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "300 AIC"
  },
  {
    "id": "F32",
    "modul": "M06",
    "modul_name": "Project Website & Conversion",
    "nama": "Live product",
    "masalah_id": "P032",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F33",
    "modul": "M06",
    "modul_name": "Project Website & Conversion",
    "nama": "Lead form,",
    "masalah_id": "P033",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F34",
    "modul": "M06",
    "modul_name": "Project Website & Conversion",
    "nama": "Local SEO &",
    "masalah_id": "P034",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F35",
    "modul": "M06",
    "modul_name": "Project Website & Conversion",
    "nama": "CRO,",
    "masalah_id": "P035",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F36",
    "modul": "M06",
    "modul_name": "Project Website & Conversion",
    "nama": "Multi-project",
    "masalah_id": "P036",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F37",
    "modul": "M07",
    "modul_name": "Demand Generation & Media Buying",
    "nama": "Acquisition",
    "masalah_id": "P037",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F38",
    "modul": "M07",
    "modul_name": "Demand Generation & Media Buying",
    "nama": "Official ad",
    "masalah_id": "P038",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F39",
    "modul": "M07",
    "modul_name": "Demand Generation & Media Buying",
    "nama": "Bid, creative",
    "masalah_id": "P039",
    "paket_minimum": "P",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F40",
    "modul": "M07",
    "modul_name": "Demand Generation & Media Buying",
    "nama": "Search",
    "masalah_id": "P040",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F41",
    "modul": "M07",
    "modul_name": "Demand Generation & Media Buying",
    "nama": "Retargeting",
    "masalah_id": "P041",
    "paket_minimum": "P",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F42",
    "modul": "M07",
    "modul_name": "Demand Generation & Media Buying",
    "nama": "Portfolio",
    "masalah_id": "P042",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F43",
    "modul": "M08",
    "modul_name": "Lead CRM & Revenue Workspace",
    "nama": "Omnichannel",
    "masalah_id": "P043",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F44",
    "modul": "M08",
    "modul_name": "Lead CRM & Revenue Workspace",
    "nama": "Deduplication &",
    "masalah_id": "P044",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F45",
    "modul": "M08",
    "modul_name": "Lead CRM & Revenue Workspace",
    "nama": "BANT & fit",
    "masalah_id": "P045",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F46",
    "modul": "M08",
    "modul_name": "Lead CRM & Revenue Workspace",
    "nama": "Ownership,",
    "masalah_id": "P046",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F47",
    "modul": "M08",
    "modul_name": "Lead CRM & Revenue Workspace",
    "nama": "Next-best-",
    "masalah_id": "P047",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F48",
    "modul": "M08",
    "modul_name": "Lead CRM & Revenue Workspace",
    "nama": "Conversation",
    "masalah_id": "P048",
    "paket_minimum": "G",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F49",
    "modul": "M09",
    "modul_name": "AI Sales Concierge",
    "nama": "Chat FAQ",
    "masalah_id": "P049",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": "1 AIC"
  },
  {
    "id": "F50",
    "modul": "M09",
    "modul_name": "AI Sales Concierge",
    "nama": "Conversational",
    "masalah_id": "P050",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F51",
    "modul": "M09",
    "modul_name": "AI Sales Concierge",
    "nama": "Objection &",
    "masalah_id": "P051",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F52",
    "modul": "M09",
    "modul_name": "AI Sales Concierge",
    "nama": "Human",
    "masalah_id": "P052",
    "paket_minimum": "P",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F53",
    "modul": "M09",
    "modul_name": "AI Sales Concierge",
    "nama": "Quality",
    "masalah_id": "P053",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F54",
    "modul": "M09",
    "modul_name": "AI Sales Concierge",
    "nama": "Opt-in AI",
    "masalah_id": "P054",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F55",
    "modul": "M10",
    "modul_name": "Nurture, Appointment & Visit",
    "nama": "Consent-",
    "masalah_id": "P055",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F56",
    "modul": "M10",
    "modul_name": "Nurture, Appointment & Visit",
    "nama": "Appointment",
    "masalah_id": "P056",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F57",
    "modul": "M10",
    "modul_name": "Nurture, Appointment & Visit",
    "nama": "Visit prep &",
    "masalah_id": "P057",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F58",
    "modul": "M10",
    "modul_name": "Nurture, Appointment & Visit",
    "nama": "Reminder,",
    "masalah_id": "P058",
    "paket_minimum": "P",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F59",
    "modul": "M10",
    "modul_name": "Nurture, Appointment & Visit",
    "nama": "Virtual tour",
    "masalah_id": "P059",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F60",
    "modul": "M10",
    "modul_name": "Nurture, Appointment & Visit",
    "nama": "Lifecycle",
    "masalah_id": "P060",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F61",
    "modul": "M11",
    "modul_name": "Field Sales, Playbook & Productivity",
    "nama": "Territory &",
    "masalah_id": "P061",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "30 AIC per SE-hari"
  },
  {
    "id": "F62",
    "modul": "M11",
    "modul_name": "Field Sales, Playbook & Productivity",
    "nama": "Rain,",
    "masalah_id": "P062",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F63",
    "modul": "M11",
    "modul_name": "Field Sales, Playbook & Productivity",
    "nama": "Check-in &",
    "masalah_id": "P063",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F64",
    "modul": "M11",
    "modul_name": "Field Sales, Playbook & Productivity",
    "nama": "Playbook,",
    "masalah_id": "P064",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "400 AIC"
  },
  {
    "id": "F65",
    "modul": "M11",
    "modul_name": "Field Sales, Playbook & Productivity",
    "nama": "Role-play &",
    "masalah_id": "P065",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F66",
    "modul": "M11",
    "modul_name": "Field Sales, Playbook & Productivity",
    "nama": "Daily",
    "masalah_id": "P066",
    "paket_minimum": "G",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F67",
    "modul": "M12",
    "modul_name": "Inventory, Quotation & Booking",
    "nama": "Unit",
    "masalah_id": "P067",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F68",
    "modul": "M12",
    "modul_name": "Inventory, Quotation & Booking",
    "nama": "Quote &",
    "masalah_id": "P068",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": "10 AIC"
  },
  {
    "id": "F69",
    "modul": "M12",
    "modul_name": "Inventory, Quotation & Booking",
    "nama": "Payment-",
    "masalah_id": "P069",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F70",
    "modul": "M12",
    "modul_name": "Inventory, Quotation & Booking",
    "nama": "Discount &",
    "masalah_id": "P070",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F71",
    "modul": "M12",
    "modul_name": "Inventory, Quotation & Booking",
    "nama": "Booking hold",
    "masalah_id": "P071",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F72",
    "modul": "M12",
    "modul_name": "Inventory, Quotation & Booking",
    "nama": "Portfolio",
    "masalah_id": "P072",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F73",
    "modul": "M13",
    "modul_name": "KPR, Documents & Closing Operations",
    "nama": "KPR",
    "masalah_id": "P073",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F74",
    "modul": "M13",
    "modul_name": "KPR, Documents & Closing Operations",
    "nama": "Secure",
    "masalah_id": "P074",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F75",
    "modul": "M13",
    "modul_name": "KPR, Documents & Closing Operations",
    "nama": "Bank",
    "masalah_id": "P075",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F76",
    "modul": "M13",
    "modul_name": "KPR, Documents & Closing Operations",
    "nama": "Legal",
    "masalah_id": "P076",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F77",
    "modul": "M13",
    "modul_name": "KPR, Documents & Closing Operations",
    "nama": "Payment",
    "masalah_id": "P077",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F78",
    "modul": "M13",
    "modul_name": "KPR, Documents & Closing Operations",
    "nama": "Closing risk",
    "masalah_id": "P078",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F79",
    "modul": "M14",
    "modul_name": "Partners, Referral & Offline Growth",
    "nama": "Referral",
    "masalah_id": "P079",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F80",
    "modul": "M14",
    "modul_name": "Partners, Referral & Offline Growth",
    "nama": "Broker & co-",
    "masalah_id": "P080",
    "paket_minimum": "G",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F81",
    "modul": "M14",
    "modul_name": "Partners, Referral & Offline Growth",
    "nama": "Commission",
    "masalah_id": "P081",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F82",
    "modul": "M14",
    "modul_name": "Partners, Referral & Offline Growth",
    "nama": "Corporate &",
    "masalah_id": "P082",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F83",
    "modul": "M14",
    "modul_name": "Partners, Referral & Offline Growth",
    "nama": "Open house",
    "masalah_id": "P083",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F84",
    "modul": "M14",
    "modul_name": "Partners, Referral & Offline Growth",
    "nama": "Channel",
    "masalah_id": "P084",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F85",
    "modul": "M15",
    "modul_name": "Revenue Intelligence & Customer Success",
    "nama": "Funnel",
    "masalah_id": "P085",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F86",
    "modul": "M15",
    "modul_name": "Revenue Intelligence & Customer Success",
    "nama": "Progress",
    "masalah_id": "P086",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F87",
    "modul": "M15",
    "modul_name": "Revenue Intelligence & Customer Success",
    "nama": "Attribution &",
    "masalah_id": "P087",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F88",
    "modul": "M15",
    "modul_name": "Revenue Intelligence & Customer Success",
    "nama": "Revenue,",
    "masalah_id": "P088",
    "paket_minimum": "D",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F89",
    "modul": "M15",
    "modul_name": "Revenue Intelligence & Customer Success",
    "nama": "BAST, DLP &",
    "masalah_id": "P089",
    "paket_minimum": "D",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F90",
    "modul": "M15",
    "modul_name": "Revenue Intelligence & Customer Success",
    "nama": "Executive",
    "masalah_id": "P090",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": "0 AIC dalam kapasitas"
  },
  {
    "id": "F91",
    "modul": "M16",
    "modul_name": "Trust, Integration & Enterprise Controls",
    "nama": "Tenant, roles",
    "masalah_id": "P091",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F92",
    "modul": "M16",
    "modul_name": "Trust, Integration & Enterprise Controls",
    "nama": "Privacy,",
    "masalah_id": "P092",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F93",
    "modul": "M16",
    "modul_name": "Trust, Integration & Enterprise Controls",
    "nama": "Audit,",
    "masalah_id": "P093",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F94",
    "modul": "M16",
    "modul_name": "Trust, Integration & Enterprise Controls",
    "nama": "Official API",
    "masalah_id": "P094",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F95",
    "modul": "M16",
    "modul_name": "Trust, Integration & Enterprise Controls",
    "nama": "Agent",
    "masalah_id": "P095",
    "paket_minimum": "P",
    "level_otomasi": "L1",
    "satuan_aic": null
  },
  {
    "id": "F96",
    "modul": "M16",
    "modul_name": "Trust, Integration & Enterprise Controls",
    "nama": "Enterprise",
    "masalah_id": "P096",
    "paket_minimum": "D",
    "level_otomasi": "L0",
    "satuan_aic": null
  },
  {
    "id": "F97",
    "modul": "M17",
    "modul_name": "SE Attendance, GPS, Calls & Activity Copilot",
    "nama": "Absensi shift",
    "masalah_id": "P121",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F98",
    "modul": "M17",
    "modul_name": "SE Attendance, GPS, Calls & Activity Copilot",
    "nama": "Tracking GPS",
    "masalah_id": "P122",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F99",
    "modul": "M17",
    "modul_name": "SE Attendance, GPS, Calls & Activity Copilot",
    "nama": "Log",
    "masalah_id": "P123",
    "paket_minimum": "G",
    "level_otomasi": "L2",
    "satuan_aic": null
  },
  {
    "id": "F100",
    "modul": "M17",
    "modul_name": "SE Attendance, GPS, Calls & Activity Copilot",
    "nama": "AI guide",
    "masalah_id": "P124",
    "paket_minimum": "P",
    "level_otomasi": "L0",
    "satuan_aic": "5 AIC per kartu"
  }
];

export const AGENTS_REGISTRY: AgentDefinition[] = [
  {
    "id": "A01",
    "nama": "Orchestrator Menerjemahkan tujuan menjadi rencana,",
    "peran": "A01 - Orchestrator Menerjemahkan tujuan menjadi rencana,",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "dependensi, task dan state machine.",
    "batas_kewenangan": "Tidak mengeksekusi tool di luar anggaran/otoritas."
  },
  {
    "id": "A02",
    "nama": "Evidence Guardian Mengikat setiap fakta pada sumber,",
    "peran": "A02 - Evidence Guardian Mengikat setiap fakta pada sumber,",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "halaman, waktu dan versi.",
    "batas_kewenangan": "Unknown tetap unknown; tidak menjadi sumber legalitas."
  },
  {
    "id": "A03",
    "nama": "Policy & Consent Memeriksa tujuan pemrosesan,",
    "peran": "A03 - Policy & Consent Memeriksa tujuan pemrosesan,",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "persetujuan komunikasi dan suppression.",
    "batas_kewenangan": "Tidak menyamakan nomor publik dengan izin pemasaran."
  },
  {
    "id": "A04",
    "nama": "Safety & Claim QA Mengawasi halusinasi, prompt injection,",
    "peran": "A04 - Safety & Claim QA Mengawasi halusinasi, prompt injection,",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "klaim absolut dan kebijakan kanal.",
    "batas_kewenangan": "Blok rilis bila harga, rekening atau legalitas tidak terverifikasi."
  },
  {
    "id": "A05",
    "nama": "Identity & Tenant",
    "peran": "A05 - Identity & Tenant",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Gate Memeriksa hak akses developer, proyek, peran dan dokumen.",
    "batas_kewenangan": "Isolasi ditegakkan juga oleh database, bukan prompt saja."
  },
  {
    "id": "A06",
    "nama": "FinOps & Meter Mencadangkan kredit, mengukur",
    "peran": "A06 - FinOps & Meter Mencadangkan kredit, mengukur",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "pemakaian dan membatasi biaya.",
    "batas_kewenangan": "Tidak auto-top-up tanpa mandat; billable event idempoten."
  },
  {
    "id": "A07",
    "nama": "Connector & Recovery Memantau integrasi, webhook, retry,",
    "peran": "A07 - Connector & Recovery Memantau integrasi, webhook, retry,",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "anomali dan pemulihan.",
    "batas_kewenangan": "Tidak melewati otentikasi atau memakai bot akun pribadi."
  },
  {
    "id": "A08",
    "nama": "Approval & Escalation Mengarahkan keputusan material ke",
    "peran": "A08 - Approval & Escalation Mengarahkan keputusan material ke",
    "kategori": "Kontrol Bersama",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "orang berwenang dengan ringkasan.",
    "batas_kewenangan": "Timeout berarti tunggu/eskalasi, bukan persetujuan diam-diam.  A01–A08 adalah lapisan kontrol bersama;"
  },
  {
    "id": "A09",
    "nama": "Document",
    "peran": "A09 - Document",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "Intelligence OCR, klasifikasi dan ekstraksi brosur, pricelist serta berkas.",
    "batas_kewenangan": "Tidak menyimpan PII ke knowledge base pemasaran umum."
  },
  {
    "id": "A10",
    "nama": "Price & Inventory",
    "peran": "A10 - Price & Inventory",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "Data Normalisasi skema harga, unit, periode dan status stok.",
    "batas_kewenangan": "Perhitungan uang memakai kode deterministik."
  },
  {
    "id": "A11",
    "nama": "Geo & POI Analyst Peta cluster, fasilitas publik, geocode",
    "peran": "A11 - Geo & POI Analyst Peta cluster, fasilitas publik, geocode",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "dan rute berlisensi.",
    "batas_kewenangan": "Tidak menyalin data peta melampaui lisensi penyedia."
  },
  {
    "id": "A12",
    "nama": "Market Demand",
    "peran": "A12 - Market Demand",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Analyst Konteks pasar nasional/lokal, musim dan demand hypothesis.",
    "batas_kewenangan": "Membedakan statistik populasi dengan lead aktual."
  },
  {
    "id": "A13",
    "nama": "Competitor Analyst Komparabel, normalisasi listing dan",
    "peran": "A13 - Competitor Analyst Komparabel, normalisasi listing dan",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "battlecard.",
    "batas_kewenangan": "Harga listing bukan harga transaksi; no scraping terlarang."
  },
  {
    "id": "A14",
    "nama": "Persona & STP",
    "peran": "A14 - Persona & STP",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Strategist Kebutuhan pembeli, segmentasi dan value proposition.",
    "batas_kewenangan": "Tidak menginferensikan atribut sensitif atau menolak secara diskriminatif."
  },
  {
    "id": "A15",
    "nama": "7P & SWOT Strategist Strategi, TOWS, positioning dan",
    "peran": "A15 - 7P & SWOT Strategist Strategi, TOWS, positioning dan",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "eksperimen 30 hari.",
    "batas_kewenangan": "Analisis tidak menggantikan persetujuan produk/anggaran."
  },
  {
    "id": "A16",
    "nama": "99-Advantage",
    "peran": "A16 - 99-Advantage",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Architect Menyusun klaim unik, manfaat, bukti dan caveat.",
    "batas_kewenangan": "Tidak memaksa 99 klaim bila fakta belum cukup."
  },
  {
    "id": "A17",
    "nama": "Brand & Sales",
    "peran": "A17 - Brand & Sales",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Copywriter Surat cinta, pitch, FAQ, proposal dan narasi penawaran.",
    "batas_kewenangan": "Tidak menciptakan testimoni, kelangkaan atau janji hasil."
  },
  {
    "id": "A18",
    "nama": "Content Planner Kalender resmi, funnel, jadwal dan",
    "peran": "A18 - Content Planner Kalender resmi, funnel, jadwal dan",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "adaptasi platform.",
    "batas_kewenangan": "Membedakan 90 brief dengan 90 aset final/publikasi.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confidence/sou"
  },
  {
    "id": "A19",
    "nama": "Sales Advocacy",
    "peran": "A19 - Sales Advocacy",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Assistant Kit personal SE, rujukan kode dan personal branding.",
    "batas_kewenangan": "Memerlukan mandat proyek dan izin pemilik akun."
  },
  {
    "id": "A20",
    "nama": "Visual Production Template poster, carousel, layout dan",
    "peran": "A20 - Visual Production Template poster, carousel, layout dan",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "visual ilustratif.",
    "batas_kewenangan": "Ilustrasi berlabel; foto progres tidak direkayasa."
  },
  {
    "id": "A21",
    "nama": "Video & Audio",
    "peran": "A21 - Video & Audio",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Producer Template video, subtitle, cover dan voiceover sintetis.",
    "batas_kewenangan": "Tidak mengkloning orang atau merekayasa tur nyata."
  },
  {
    "id": "A22",
    "nama": "Localization &",
    "peran": "A22 - Localization &",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Accessibility Bahasa, aksesibilitas, ejaan dan QA komunikasi.",
    "batas_kewenangan": "Klaim/angka tidak berubah saat diterjemahkan."
  },
  {
    "id": "A23",
    "nama": "Web & SEO Builder Draf situs, landing page, schema dan",
    "peran": "A23 - Web & SEO Builder Draf situs, landing page, schema dan",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "komponen produk.",
    "batas_kewenangan": "Deploy hanya ke domain yang diotorisasi."
  },
  {
    "id": "A24",
    "nama": "Conversion",
    "peran": "A24 - Conversion",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Experimenter Form, CTA, A/B test dan analisis eksperimen.",
    "batas_kewenangan": "Tidak mengklaim kausalitas dari metrik observasional."
  },
  {
    "id": "A25",
    "nama": "Acquisition Planner Rencana kanal, keyword, audiens dan",
    "peran": "A25 - Acquisition Planner Rencana kanal, keyword, audiens dan",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "budget.",
    "batas_kewenangan": "Tidak menjanjikan CPL/closing; kebijakan housing dicek per pasar."
  },
  {
    "id": "A26",
    "nama": "Media Buyer",
    "peran": "A26 - Media Buyer",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Optimizer Pacing, bid, creative rotation dan suppression resmi.",
    "batas_kewenangan": "Belanja terbatas pada akun dan cap approved."
  },
  {
    "id": "A27",
    "nama": "Local Discovery",
    "peran": "A27 - Local Discovery",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Specialist Profil bisnis, konsistensi NAP dan organic discovery.",
    "batas_kewenangan": "Tidak membuat ulasan palsu atau lokasi kantor fiktif."
  },
  {
    "id": "A28",
    "nama": "Lead Intake & Identity Ingest sumber resmi, validasi kontak",
    "peran": "A28 - Lead Intake & Identity Ingest sumber resmi, validasi kontak",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "dan deduplication.",
    "batas_kewenangan": "Tidak membeli/menambang nomor pribadi untuk blast.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confidence/sour"
  },
  {
    "id": "A29",
    "nama": "Qualification &",
    "peran": "A29 - Qualification &",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Matching BANT, kebutuhan, rekomendasi unit dan prioritas.",
    "batas_kewenangan": "Skor dapat dijelaskan, dibantah dan dikoreksi manusia."
  },
  {
    "id": "A30",
    "nama": "Lead Dispatch & SLA Round-robin, shift, kapasitas, timeout",
    "peran": "A30 - Lead Dispatch & SLA Round-robin, shift, kapasitas, timeout",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "dan handoff.",
    "batas_kewenangan": "Tidak mengubah hak komisi tanpa aturan manajemen."
  },
  {
    "id": "A31",
    "nama": "Sales Chat Concierge FAQ berlandas bukti dan discovery",
    "peran": "A31 - Sales Chat Concierge FAQ berlandas bukti dan discovery",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "percakapan awal.",
    "batas_kewenangan": "Disclosure AI dan jalur manusia selalu tersedia."
  },
  {
    "id": "A32",
    "nama": "Objection &",
    "peran": "A32 - Objection &",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Negotiation Copilot Bantuan keberatan, alternatif dan ringkasan negosiasi.",
    "batas_kewenangan": "Tidak menyetujui diskon, refund atau syarat kontrak."
  },
  {
    "id": "A33",
    "nama": "Opt-in Voice Assistant Metadata panggilan bisnis serta",
    "peran": "A33 - Opt-in Voice Assistant Metadata panggilan bisnis serta",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "suara/transfer hanya saat fitur berhak dan berizin.",
    "batas_kewenangan": "Persetujuan panggilan/rekaman, quiet hours, batas durasi."
  },
  {
    "id": "A34",
    "nama": "Lifecycle Nurture Cadence, reminder relevan, reaktivasi",
    "peran": "A34 - Lifecycle Nurture Cadence, reminder relevan, reaktivasi",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "dan opt-out.",
    "batas_kewenangan": "Stop saat penolakan; batas frekuensi lintas kanal."
  },
  {
    "id": "A35",
    "nama": "Appointment & Visit",
    "peran": "A35 - Appointment & Visit",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "Coordinator Slot, reminder, host, persiapan dan reschedule.",
    "batas_kewenangan": "Akses lokasi/host tetap dikonfirmasi, bukan diasumsikan."
  },
  {
    "id": "A36",
    "nama": "Territory & Route",
    "peran": "A36 - Territory & Route",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Planner Zona, urutan titik, cuaca, waktu buka dan rute harian.",
    "batas_kewenangan": "Keselamatan, izin lokasi dan jam kerja mengalahkan target."
  },
  {
    "id": "A37",
    "nama": "Field Sales Coach Kit lapangan, absensi, GPS tugas,",
    "peran": "A37 - Field Sales Coach Kit lapangan, absensi, GPS tugas,",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "disposisi dan AI guide per aktivitas.",
    "batas_kewenangan": "Tidak memonitor pekerja di luar lingkup tugas."
  },
  {
    "id": "A38",
    "nama": "Sales Training",
    "peran": "A38 - Sales Training",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Evaluator Role-play, tes produk dan QA percakapan termasking.",
    "batas_kewenangan": "Bukan satu-satunya dasar penilaian/sanksi tenaga kerja.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confidence"
  },
  {
    "id": "A39",
    "nama": "Offer & Affordability",
    "peran": "A39 - Offer & Affordability",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Analyst Total biaya, skema pembayaran dan floor margin.",
    "batas_kewenangan": "Bunga/pajak validasi; formula bukan keluaran tebak model."
  },
  {
    "id": "A40",
    "nama": "Reservation &",
    "peran": "A40 - Reservation &",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Booking Controller Hold, status unit, checklist dan confirmation case.",
    "batas_kewenangan": "Lock transaksional pada database, tidak hanya instruksi AI."
  },
  {
    "id": "A41",
    "nama": "KPR Dossier",
    "peran": "A41 - KPR Dossier",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Coordinator Checklist, secure intake dan pengiriman berizin per bank.",
    "batas_kewenangan": "Bukan bank, tidak mengakses SLIK tanpa otoritas."
  },
  {
    "id": "A42",
    "nama": "Legal Workflow",
    "peran": "A42 - Legal Workflow",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Assistant Milestone, draf template, privasi dan review list.",
    "batas_kewenangan": "Tidak menerbitkan opini legal, izin, akta atau sertifikat."
  },
  {
    "id": "A43",
    "nama": "Payment &",
    "peran": "A43 - Payment &",
    "kategori": "Spesialis",
    "level_otomasi_default": "L2",
    "pekerjaan_utama": "Commission Reconciler Pencocokan kas, invoice, accrual dan pengingat.",
    "batas_kewenangan": "Tidak memegang dana atau mengeksekusi refund sendiri."
  },
  {
    "id": "A44",
    "nama": "Partner & Referral",
    "peran": "A44 - Partner & Referral",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Manager Mandat agen, referral, tracking dan komisi bersyarat.",
    "batas_kewenangan": "Tidak memverifikasi calon pembeli hanya dari klaim agen."
  },
  {
    "id": "A45",
    "nama": "Corporate & Event",
    "peran": "A45 - Corporate & Event",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Coordinator Proposal institusi, RSVP, event pack dan follow-up.",
    "batas_kewenangan": "Izin booth/acara dan pelaksanaan fisik tetap manusia."
  },
  {
    "id": "A46",
    "nama": "Revenue & Attribution",
    "peran": "A46 - Revenue & Attribution",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Analyst Funnel, cohort, margin, forecast dan eksperimen.",
    "batas_kewenangan": "Tidak menyamakan GMV rumah dengan pendapatan software."
  },
  {
    "id": "A47",
    "nama": "Buyer Success",
    "peran": "A47 - Buyer Success",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Coordinator Progres, komplain, BAST, DLP dan review sukarela.",
    "batas_kewenangan": "Perbaikan fisik diselesaikan vendor dan dikonfirmasi pembeli."
  },
  {
    "id": "A48",
    "nama": "Executive &",
    "peran": "A48 - Executive &",
    "kategori": "Spesialis",
    "level_otomasi_default": "L1",
    "pekerjaan_utama": "Governance Auditor Board pack, hak lintas-proyek, kontrol dan risiko.",
    "batas_kewenangan": "Rekomendasi tidak menggantikan keputusan direksi/counsel.  Kontrak eksekusi setiap agent Wajib: tujuan sempit, input schema, sumber yang diizinkan, tool allowlist, project/tenant scope, batas biaya/waktu, output schema, state, approval rule, confiden"
  }
];

/**
 * Cek apakah tenant dengan paket tertentu berhak mengakses fitur tertentu
 * Aturan khusus Blueprint v1.2:
 * 1. F91 - F93 (Trust, Privacy, Security Dasar) selalu terbuka untuk semua paket
 * 2. F97 - F99 (Absensi, GPS Tugas, Log Panggilan) selalu terbuka untuk semua paket
 * 3. F100 (AI Guide per aktivitas SE) HANYA terbuka untuk Platinum dan Diamond (5 AIC/kartu)
 * 4. Fitur lainnya mengikuti paket minimum:
 *    - G -> Gold, Platinum, Diamond
 *    - P -> Platinum, Diamond
 *    - D -> Diamond saja
 */
export function has_feature(plan: PlanCode, featureId: string, activeModulePasses?: string[]): boolean {
  const feat = FEATURES_CATALOG.find(f => f.id === featureId);
  if (!feat) return false;

  // Fitur wajib semua paket (tidak boleh dikunci)
  if (['F91', 'F92', 'F93', 'F97', 'F98', 'F99'].includes(featureId)) {
    return true;
  }

  // F100: AI activity guide khusus Platinum & Diamond
  if (featureId === 'F100') {
    return plan === 'platinum' || plan === 'diamond';
  }

  // Module Pass: Booster (7 hari) / Turbo (30 hari) untuk modul M05 - M15
  // Note: M17/F100 dan M16/F96 tidak masuk module pass
  if (activeModulePasses && activeModulePasses.includes(feat.modul) && feat.modul >= 'M05' && feat.modul <= 'M15') {
    return true;
  }

  // Pengecekan standar hierarki paket
  if (feat.paket_minimum === 'G') {
    return true; // Gold, Platinum, Diamond
  }

  if (feat.paket_minimum === 'P') {
    return plan === 'platinum' || plan === 'diamond';
  }

  if (feat.paket_minimum === 'D') {
    return plan === 'diamond';
  }

  return false;
}

/**
 * Menghitung daftar seluruh fitur yang diizinkan untuk paket tertentu
 */
export function get_accessible_features(plan: PlanCode, activeModulePasses?: string[]): FeatureDefinition[] {
  return FEATURES_CATALOG.filter(f => has_feature(plan, f.id, activeModulePasses));
}

/**
 * Menghitung rekapitulasi fitur per modul untuk verifikasi kuota
 */
export function get_features_count_by_module(plan: PlanCode): Record<string, { total: number; accessible: number }> {
  const result: Record<string, { total: number; accessible: number }> = {};
  for (const f of FEATURES_CATALOG) {
    if (!result[f.modul]) {
      result[f.modul] = { total: 0, accessible: 0 };
    }
    result[f.modul].total += 1;
    if (has_feature(plan, f.id)) {
      result[f.modul].accessible += 1;
    }
  }
  return result;
}
