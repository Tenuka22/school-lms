const ENUM_STYLES: Record<string, Record<string, string>> = {
  gender: {
    Male: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    Female:
      "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
  },
  nationality: {
    SriLankan:
      "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    DualCitizen:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    Other:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  },
  category: {
    CloseResident:
      "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    PastPupilChild:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    Sibling:
      "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    MOEOrUGCStaffChild:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    GovernmentTransferOfficerChild:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    OverseasArrival:
      "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    ArmedForcesReserved:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  medium_of_instruction: {
    Sinhala:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    Tamil:
      "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  },
  enrollment_status: {
    Draft:
      "bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    Pending:
      "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700",
    ProvisionallyApproved:
      "bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
    Approved:
      "bg-green-50 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
    Rejected:
      "bg-red-50 text-red-900 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
    Withdrawn:
      "bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    Removed:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  application_status: {
    Draft:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
    Submitted:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    DocsPending:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    UnderVerification:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    Verified:
      "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    Marked:
      "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    Shortlisted:
      "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800",
    Appealed:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    Finalized:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    Admitted:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    Rejected:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    Withdrawn:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  },
  batch_status: {
    Open: "bg-green-50 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
    Closed:
      "bg-slate-50 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    Archived:
      "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-900 dark:text-amber-200 dark:border-amber-700",
  },
  religion: {
    Buddhism:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    Hinduism:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    Islam:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    Christianity:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    Catholicism:
      "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    Other:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  },
  staff_employment_type: {
    Permanent:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    Temporary:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    Contract:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  },
  staff_type: {
    Teacher:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    Admin:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    Worker:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  student_status: {
    Active:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    Graduated:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    Removed:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  },
  guardian_flag: {
    staff:
      "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
    past_pupil:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    govt: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  income_level: {
    below_25000:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    "25000_50000":
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    "50000_100000":
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    "100000_200000":
      "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
    "200000_500000":
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    above_500000:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
  },
  relationship_type: {
    Father:
      "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    Mother:
      "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800",
    Guardian:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  },
  address_type: {
    Permanent:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    Temporary:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  residence_type: {
    Owned:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    Rented:
      "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    Relative:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    Other:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  },
}

const ENUM_LABELS: Record<string, Record<string, string>> = {
  gender: { Male: "Male", Female: "Female" },
  nationality: {
    SriLankan: "Sri Lankan",
    DualCitizen: "Dual Citizen",
    Other: "Other",
  },
  category: {
    CloseResident: "Close Resident",
    PastPupilChild: "Past Pupil's Child",
    Sibling: "Sibling",
    MOEOrUGCStaffChild: "MOE / UGC Staff Child",
    GovernmentTransferOfficerChild: "Govt Transfer Officer's Child",
    OverseasArrival: "Overseas Arrival",
    ArmedForcesReserved: "Armed Forces Reserved",
  },
  medium_of_instruction: { Sinhala: "Sinhala", Tamil: "Tamil" },
  enrollment_status: {
    Draft: "Draft",
    Pending: "Pending",
    ProvisionallyApproved: "Provisionally Approved",
    Approved: "Approved",
    Rejected: "Rejected",
    Withdrawn: "Withdrawn",
    Removed: "Removed",
  },
  application_status: {
    Draft: "Draft",
    Submitted: "Submitted",
    DocsPending: "Docs Pending",
    UnderVerification: "Under Verification",
    Verified: "Verified",
    Marked: "Marked",
    Shortlisted: "Shortlisted",
    Appealed: "Appealed",
    Finalized: "Finalized",
    Admitted: "Admitted",
    Rejected: "Rejected",
    Withdrawn: "Withdrawn",
  },
  batch_status: {
    Open: "Open",
    Closed: "Closed",
    Archived: "Archived",
  },
  religion: {
    Buddhism: "Buddhism",
    Hinduism: "Hinduism",
    Islam: "Islam",
    Christianity: "Christianity",
    Catholicism: "Catholicism",
    Other: "Other",
  },
  staff_employment_type: {
    Permanent: "Permanent",
    Temporary: "Temporary",
    Contract: "Contract",
  },
  staff_type: {
    Teacher: "Teacher",
    Admin: "Admin",
    Worker: "Worker",
  },
  student_status: {
    Active: "Active",
    Graduated: "Graduated",
    Removed: "Removed",
  },
  income_level: {
    below_25000: "Below LKR 25,000",
    "25000_50000": "LKR 25,000 – 50,000",
    "50000_100000": "LKR 50,000 – 100,000",
    "100000_200000": "LKR 100,000 – 200,000",
    "200000_500000": "LKR 200,000 – 500,000",
    above_500000: "Above LKR 500,000",
  },
  relationship_type: {
    Father: "Father",
    Mother: "Mother",
    Guardian: "Guardian",
  },
  address_type: {
    Permanent: "Permanent",
    Temporary: "Temporary",
  },
  residence_type: {
    Owned: "Owned",
    Rented: "Rented",
    Relative: "Relative",
    Other: "Other",
  },
}

export function getEnumLabel(column: string, value: string): string {
  return ENUM_LABELS[column]?.[value] ?? value
}

export function getEnumStyle(
  column: string,
  value: string
): string | undefined {
  return ENUM_STYLES[column]?.[value]
}
