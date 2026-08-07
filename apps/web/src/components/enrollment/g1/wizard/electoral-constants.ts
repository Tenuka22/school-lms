import type { ElectoralDistrict } from "@/lib/api-client/types.gen"

export const ELECTORAL_DISTRICTS: { value: ElectoralDistrict; label: string; si: string }[] = [
  { value: "Colombo", label: "Colombo", si: "කොළඹ" },
  { value: "Gampaha", label: "Gampaha", si: "ගම්පහ" },
  { value: "Kalutara", label: "Kalutara", si: "කළුතර" },
  { value: "Kandy", label: "Kandy", si: "මහනුවර" },
  { value: "Matale", label: "Matale", si: "මාතලේ" },
  { value: "Nuwara_Eliya", label: "Nuwara Eliya", si: "නුවරඑලිය" },
  { value: "Galle", label: "Galle", si: "ගාල්ල" },
  { value: "Matara", label: "Matara", si: "මාතර" },
  { value: "Hambantota", label: "Hambantota", si: "හම්බන්තොට" },
  { value: "Jaffna", label: "Jaffna", si: "යාපනය" },
  { value: "Vanni", label: "Vanni", si: "වන්නි" },
  { value: "Batticaloa", label: "Batticaloa", si: "මඩකලපුව" },
  { value: "Ampara", label: "Ampara", si: "අම්පාර" },
  { value: "Trincomalee", label: "Trincomalee", si: "ත්‍රිකුණාමලය" },
  { value: "Kurunegala", label: "Kurunegala", si: "කුරුණෑගල" },
  { value: "Puttalam", label: "Puttalam", si: "පුත්තලම" },
  { value: "Anuradhapura", label: "Anuradhapura", si: "අනුරාධපුර" },
  { value: "Polonnaruwa", label: "Polonnaruwa", si: "පොළොන්නරුව" },
  { value: "Badulla", label: "Badulla", si: "බදුල්ල" },
  { value: "Monaragala", label: "Monaragala", si: "මොණරාගල" },
  { value: "Ratnapura", label: "Ratnapura", si: "රත්නපුර" },
  { value: "Kegalle", label: "Kegalle", si: "කෑගල්ල" },
]

// Polling divisions are now served from backend API: GET /api/polling-divisions
// This file only contains electoral districts and years constants

// Electoral years (recent years for enrollment)
export const ELECTORAL_YEARS = Array.from({ length: 11 }, (_, i) => 2025 - i)
