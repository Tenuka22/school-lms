"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InterviewMarks } from "./interview-shell"
import type { Guardian, Address, Student } from "@/lib/api-client/types.gen"
import type { DocumentFormData } from "../wizard/wizard-step-documents"
import {
  IconNote,
} from "@tabler/icons-react"

type CriterionOption = { value: number; label: string; labelSi?: string }

type Criterion = {
  key: string
  label: string
  labelSi: string
  description: string
  descriptionSi: string
  maxMarks: number
  type: "slider" | "select" | "number"
  options?: CriterionOption[]
}

type CategoryConfig = {
  label: string
  percentage: string
  circularRef: string
  criteria: Criterion[]
}

const CATEGORY_CRITERIA: Record<string, CategoryConfig> = {
  CloseResident: {
    label: "Close Resident",
    percentage: "50%",
    circularRef: "7.2",
    criteria: [
      {
        key: "residence_duration",
        label: "Property Ownership Duration",
        labelSi: "දේපල හිමිකම් කාලය",
        description: "Duration of property ownership in applicant/spouse/parent name. Looked back 5 years from June 30.",
        descriptionSi: "අයදුම්කරු/කලත්‍රයා/මව/පියාගේ නමින් දේපල හිමිකම් කාලය. ජුනි 30 දිනට පෙර වර්ෂ 5ක කාලය සලකා බලයි.",
        maxMarks: 20,
        type: "select",
        options: [
          { value: 20, label: "5+ years (20 pts)", labelSi: "වර්ෂ 5+ (ලකුණු 20)" },
          { value: 16, label: "4-5 years (16 pts)", labelSi: "වර්ෂ 4-5 (ලකුණු 16)" },
          { value: 12, label: "3-4 years (12 pts)", labelSi: "වර්ෂ 3-4 (ලකුණු 12)" },
          { value: 8, label: "2-3 years (8 pts)", labelSi: "වර්ෂ 2-3 (ලකුණු 8)" },
          { value: 4, label: "1-2 years (4 pts)", labelSi: "වර්ෂ 1-2 (ලකුණු 4)" },
          { value: 2, label: "6-12 months (2 pts)", labelSi: "මාස 6-12 (ලකුණු 2)" },
          { value: 1, label: "< 6 months (1 pt)", labelSi: "මාස 6ට අඩු (ලකුණු 1)" },
        ],
      },
      {
        key: "supporting_documents",
        label: "Supporting Residence Documents",
        labelSi: "පදිංචිය තහවුරු කරන අතිරේක ලේඛන",
        description: "Up to 5 supporting documents at 1 pt each. Electricity bill, water bill, tax bill, birth cert, bank book, vehicle registration.",
        descriptionSi: "ලේඛන 5ක් දක්වා එක් ලකුණු 1 බැගින්. විදුලි බිල්පත්, ජල බිල්පත්, බදු බිල්පත්, උප්පැන්න සහතික, බැංකු පොත, වාහන ලියාපදිංචි.",
        maxMarks: 5,
        type: "number",
      },
      {
        key: "electoral_registration",
        label: "Electoral Registration",
        labelSi: "ඡන්ද හිමි නාම ලේඛනයේ ලියාපදිංචිය",
        description: "Based on how many of the last 5 years parents/guardian are registered at the address. Per Table I.",
        descriptionSi: "අයදුම්කරන වර්ෂයට පෙර වර්ෂ 5ක් තුළ මව/පියා/නීත්‍යනුකූල භාරකරු ඡන්ද හිමි නාම ලේඛනයේ ලියාපදිංචි වසර ගණන. වගුව I බලන්න.",
        maxMarks: 25,
        type: "select",
        options: [
          { value: 25, label: "Both parents 5 yrs (25 pts)", labelSi: "මව/පියා දෙදෙනාම වර්ෂ 5 (25)" },
          { value: 20, label: "One parent 5 yrs + spouse 4 yrs (20 pts)", labelSi: "එක් අයෙක් වර්ෂ 5 + කලත්‍රයා වර්ෂ 4 (20)" },
          { value: 16, label: "One parent 5 yrs + spouse 3 yrs (16 pts)", labelSi: "එක් අයෙක් වර්ෂ 5 + කලත්‍රයා වර්ෂ 3 (16)" },
          { value: 14, label: "One parent 5 yrs + spouse 2 yrs (14 pts)", labelSi: "එක් අයෙක් වර්ෂ 5 + කලත්‍රයා වර්ෂ 2 (14)" },
          { value: 12, label: "One parent 5 yrs + spouse 1 yr (12 pts)", labelSi: "එක් අයෙක් වර්ෂ 5 + කලත්‍රයා වර්ෂ 1 (12)" },
          { value: 10, label: "One parent 5 yrs only (10 pts)", labelSi: "එක් අයෙක් වර්ෂ 5 පමණි (10)" },
        ],
      },
      {
        key: "proximity_to_school",
        label: "Proximity to School",
        labelSi: "පාසලට ආසන්නතාව",
        description: "Straight-line distance from home main gate to school office. Max 50 pts if no nearer govt school. Deduction of 5 pts per nearer school.",
        descriptionSi: "නිවසේ ප්‍රධාන දොරටුවේ සිට පාසල් කාර්යාලයට සෘජු දුර. ආසන්න රජයේ පාසලක් නොමැති නම් උපරිම 50. සෑම ආසන්න පාසලකටම 5 බැගින් අඩු කරයි.",
        maxMarks: 50,
        type: "number",
      },
    ],
  },
  PastPupilChild: {
    label: "Past Pupil / Alumni",
    percentage: "25%",
    circularRef: "7.3",
    criteria: [
      {
        key: "years_studied",
        label: "Years Studied at School",
        labelSi: "පාසලේ ඉගෙනුම ලැබූ කාලය",
        description: "2 pts per grade completed (no credit for repeating). Max 26.",
        descriptionSi: "සම්පූර්ණ කළ ශ්‍රේණියකට ලකුණු 2 බැගින් (නැවත රැඳීම සඳහා ලකුණු නැත). උපරිම 26.",
        maxMarks: 26,
        type: "number",
      },
      {
        key: "academic_achievements",
        label: "Academic Achievements",
        labelSi: "අධ්‍යාපන ජයග්‍රහණ",
        description: "Academic achievements during school years. Panel discretion with unanimous agreement.",
        descriptionSi: "පාසලේ ඉගෙනුම ලැබූ කාලය තුළ ලබාගත් අධ්‍යාපන ජයග්‍රහණ. සම්මුඛ පරීක්ෂණ මණ්ඩල අභිමතය.",
        maxMarks: 25,
        type: "number",
      },
      {
        key: "extra_curricular",
        label: "Extra-curricular Achievements",
        labelSi: "විෂය සමගාමී කටයුතු",
        description: "Sports, arts, and other extra-curricular achievements during school.",
        descriptionSi: "ක්‍රීඩා, කලා, වෙනත් විෂය සමගාමී ජයග්‍රහණ.",
        maxMarks: 25,
        type: "number",
      },
      {
        key: "alumni_membership",
        label: "Alumni Association & Contributions",
        labelSi: "ආදි ශිෂ්‍ය සංගමය හා දායකත්ව",
        description: "Alumni association membership and contributions to school. Max 6 pts for contributions. Total max 24.",
        descriptionSi: "ආදි ශිෂ්‍ය සංගම සාමාජිකත්වය හා පාසලේ දියුණුව සඳහා දායකත්ව. දායකත්ව සඳහා උපරිම 6. මුළු උපරිම 24.",
        maxMarks: 24,
        type: "number",
      },
    ],
  },
  Sibling: {
    label: "Sibling of Current Student",
    percentage: "14%",
    circularRef: "7.4",
    criteria: [
      {
        key: "sibling_grades",
        label: "Sibling's Grades Studied",
        labelSi: "සහෝදරයාගේ ඉගෙනුම් ලැබූ ශ්‍රේණි",
        description: "2 pts per grade the sibling has studied. Only one sibling counted. Max 20.",
        descriptionSi: "සහෝදරයා ඉගෙනුම ලැබූ ශ්‍රේණියකට ලකුණු 2 බැගින්. එක් සහෝදරයෙකුට පමණි. උපරිම 20.",
        maxMarks: 20,
        type: "number",
      },
      {
        key: "sibling_entry_grade",
        label: "Sibling Entered at Grade 1",
        labelSi: "සහෝදරයා ශ්‍රේණිය 1 දී ඇතුළත් වී ඇත",
        description: "+5 if the sibling entered at Grade 1 and is still studying.",
        descriptionSi: "සහෝදරයා ශ්‍රේණිය 1 දී ඇතුළත් වී දැන් ඉගෙනුම ලබන්නේ නම් +5.",
        maxMarks: 5,
        type: "select",
        options: [
          { value: 5, label: "Yes (5 pts)", labelSi: "ඔව් (ලකුණු 5)" },
          { value: 0, label: "No (0 pts)", labelSi: "නැත (ලකුණු 0)" },
        ],
      },
      {
        key: "multiple_siblings",
        label: "Multiple Siblings",
        labelSi: "බහු සහෝදරයින්",
        description: "+5 if 2+ siblings are currently studying at the school.",
        descriptionSi: "සහෝදරයින් දෙදෙනෙකු හෝ වැඩි දෙනෙකු දැන් පාසලේ ඉගෙනුම ලබන්නේ නම් +5.",
        maxMarks: 5,
        type: "select",
        options: [
          { value: 5, label: "Yes (5 pts)", labelSi: "ඔව් (ලකුණු 5)" },
          { value: 0, label: "No (0 pts)", labelSi: "නැත (ලකුණු 0)" },
        ],
      },
      {
        key: "school_contributions",
        label: "Contributions to School",
        labelSi: "පාසලට දායකත්ව",
        description: "Contributions by parents/guardians for school development. Max 6 for contributions. Total max 10.",
        descriptionSi: "මව්පියන්/භාරකරුවන් විසින් පාසලේ දියුණුව සඳහා ලබාදුන් දායකත්ව. දායකත්ව සඳහා උපරිම 6. මුළු උපරිම 10.",
        maxMarks: 10,
        type: "number",
      },
      {
        key: "property_ownership",
        label: "Property Ownership",
        labelSi: "දේපල හිමිකම",
        description: "Applicant/spouse name = 10; Parent name = 6; Lease = 4; Govt housing = 4; Other = 2.",
        descriptionSi: "අයදුම්කරු/කලත්‍රයා නම = 10; මව/පියා නම = 6; බදු ඔප්පු = 4; රජයේ නිවාස = 4; වෙනත් = 2.",
        maxMarks: 10,
        type: "select",
        options: [
          { value: 10, label: "Applicant/Spouse (10 pts)", labelSi: "අයදුම්කරු/කලත්‍රයා (10)" },
          { value: 6, label: "Parent (6 pts)", labelSi: "මව/පියා (6)" },
          { value: 4, label: "Lease (4 pts)", labelSi: "බදු ඔප්පු (4)" },
          { value: 4, label: "Govt housing (4 pts)", labelSi: "රජයේ නිවාස (4)" },
          { value: 2, label: "Other (2 pts)", labelSi: "වෙනත් (2)" },
        ],
      },
      {
        key: "supporting_documents",
        label: "Supporting Residence Documents",
        labelSi: "පදිංචිය තහවුරු අතිරේක ලේඛන",
        description: "0.1 pts per doc in applicant's name, 0.05 in parent's name. Max 2.",
        descriptionSi: "අයදුම්කරු නමින් ලේඛනයකට 0.1, මව/පියා නමින් 0.05. උපරිම 2.",
        maxMarks: 2,
        type: "number",
      },
      {
        key: "electoral_registration",
        label: "Electoral Registration",
        labelSi: "ඡන්ද හිමි නාම ලේඛනයේ ලියාපදිංචිය",
        description: "Based on parents'/guardian registration over last 5 years. Per Table II.",
        descriptionSi: "මව/පියා/භාරකරු පසුගිය වර්ෂ 5 තුළ ඡන්ද හිමි නාම ලේඛනයේ ලියාපදිංචි වසර ගණන. වගුව II බලන්න.",
        maxMarks: 18,
        type: "select",
        options: [
          { value: 18, label: "Both parents 5 yrs (18 pts)", labelSi: "දෙදෙනාම වර්ෂ 5 (18)" },
          { value: 16, label: "One parent 5 yrs + spouse 4 yrs (16 pts)", labelSi: "එක් අයෙක් 5 + කලත්‍රයා 4 (16)" },
          { value: 14, label: "One parent 5 yrs + spouse 3 yrs (14 pts)", labelSi: "එක් අයෙක් 5 + කලත්‍රයා 3 (14)" },
          { value: 12, label: "One parent 5 yrs + spouse 2 yrs (12 pts)", labelSi: "එක් අයෙක් 5 + කලත්‍රයා 2 (12)" },
          { value: 10, label: "One parent 5 yrs + spouse 1 yr (10 pts)", labelSi: "එක් අයෙක් 5 + කලත්‍රයා 1 (10)" },
          { value: 8, label: "One parent 5 yrs only (8 pts)", labelSi: "එක් අයෙක් 5 පමණි (8)" },
        ],
      },
    ],
  },
  MOEOrUGCStaffChild: {
    label: "MOE / UGC Staff Child",
    percentage: "6%",
    circularRef: "7.5",
    criteria: [
      {
        key: "service_and_contributions",
        label: "Service & National Contributions",
        labelSi: "සේවය හා ජාතික දායකත්ව",
        description: "Service at qualifying institution (2 pts/yr same school, 1.5 pts/yr other). Plus national contributions. Only applicants with marks here proceed.",
        descriptionSi: "සුදුසුකම් ලබන ආයතනයේ සේවය (එකම පාසලේ වර්ෂයකට 2, වෙනත් පාසලක 1.5). ජාතික දායකත්ව ද ඇතුළත්. මෙහි ලකුණු ඇති අය පමණක් ඉදිරියට.",
        maxMarks: 10,
        type: "number",
      },
      {
        key: "permanent_employment",
        label: "Permanent Employment",
        labelSi: "ස්ථිර සේවය",
        description: "1 pt per full year of permanent service. Max 20.",
        descriptionSi: "ස්ථිර සේවා වර්ෂයකට ලකුණු 1. උපරිම 20.",
        maxMarks: 20,
        type: "number",
      },
      {
        key: "difficult_area_service",
        label: "Difficult/Remote Area Service",
        labelSi: "අපහසු/දුර්ගම ප්‍රදේශ සේවය",
        description: "Currently in difficult area: 5 pts/yr (max 25). Previously: 3 pts/yr (max 15). Or distance 75+ km. Choose highest.",
        descriptionSi: "දැන් අපහසු ප්‍රදේශයේ නම් වර්ෂයකට 5 (උපරිම 25). පෙර: වර්ෂයකට 3 (උපරිම 15). හෝ දුර 70+ කි.මී. ඉහළම තෝරන්න.",
        maxMarks: 25,
        type: "number",
      },
      {
        key: "unused_leave",
        label: "Unused Leave Credits",
        labelSi: "නොබැගෑ නිවාඩු ණය",
        description: "20+ unused days per year = 2 pts/yr. Max 10.",
        descriptionSi: "වර්ෂයකට නොබැගෑ දින 20+ = වර්ෂයකට ලකුණු 2. උපරිම 10.",
        maxMarks: 10,
        type: "number",
      },
      {
        key: "residence_distance",
        label: "Distance: Residence to School",
        labelSi: "දුර: පදිංචියේ සිට පාසලට",
        description: "Shortest public transport route. <1km=10; 1-3km=8; 3-5km=6; 5+km=4.",
        descriptionSi: "කෙටිම පොදු ප්‍රවාහන මාර්ගය. <1කි.මී=10; 1-3කි.මී=8; 3-5කි.මී=6; 5+කි.මී=4.",
        maxMarks: 10,
        type: "select",
        options: [
          { value: 10, label: "Within 1 km (10 pts)", labelSi: "කි.මී 1ට අඩු (10)" },
          { value: 8, label: "1-3 km (8 pts)", labelSi: "කි.මී 1-3 (8)" },
          { value: 6, label: "3-5 km (6 pts)", labelSi: "කි.මී 3-5 (6)" },
          { value: 4, label: "Over 5 km (4 pts)", labelSi: "කි.මී 5+ (4)" },
        ],
      },
      {
        key: "posting_distance",
        label: "Distance: Posting to School",
        labelSi: "දුර: රාජකාරි ස්ථානයේ සිට පාසලට",
        description: "Distance from current posting to school. 100+km=25; 70-100=20; 40-70=15; 20-40=10; <20=5.",
        descriptionSi: "රාජකාරි ස්ථානයේ සිට පාසලට දුර. 100+කි.මී=25; 70-100=20; 40-70=15; 20-40=10; <20=5.",
        maxMarks: 25,
        type: "select",
        options: [
          { value: 25, label: "100+ km (25 pts)", labelSi: "කි.මී 100+ (25)" },
          { value: 20, label: "70-100 km (20 pts)", labelSi: "කි.මී 70-100 (20)" },
          { value: 15, label: "40-70 km (15 pts)", labelSi: "කි.මී 40-70 (15)" },
          { value: 10, label: "20-40 km (10 pts)", labelSi: "කි.මී 20-40 (10)" },
          { value: 5, label: "Under 20 km (5 pts)", labelSi: "කි.මී 20ට අඩු (5)" },
        ],
      },
    ],
  },
  GovernmentTransferOfficerChild: {
    label: "Govt Transfer Officer Child",
    percentage: "4%",
    circularRef: "7.6",
    criteria: [
      {
        key: "posting_distance",
        label: "Distance: Old to New Posting",
        labelSi: "දුර: පෙර සිට නව රාජකාරි ස්ථානයට",
        description: "Shortest public transport route between old and new posting. 150+km=35; 100-150=28; 50-100=21. Transfer within 5 years.",
        descriptionSi: "පෙර හා නව රාජකාරි ස්ථාන අතර කෙටිම පොදු ප්‍රවාහන මාර්ගය. 150+කි.මී=35; 100-150=28; 50-100=21. මාරුව වර්ෂ 5ක් ඇතුළත.",
        maxMarks: 35,
        type: "select",
        options: [
          { value: 35, label: "150+ km (35 pts)", labelSi: "කි.මී 150+ (35)" },
          { value: 28, label: "100-150 km (28 pts)", labelSi: "කි.මී 100-150 (28)" },
          { value: 21, label: "50-100 km (21 pts)", labelSi: "කි.මී 50-100 (21)" },
        ],
      },
      {
        key: "residence_distance",
        label: "Proximity: New Residence to School",
        labelSi: "ආසන්නතාව: නව පදිංචියේ සිට පාසලට",
        description: "No nearer govt school = 30 pts max. Deduction of 3 pts per nearer school.",
        descriptionSi: "ආසන්න රජයේ පාසලක් නොමැති නම් උපරිම 30. සෑම ආසන්න පාසලකටම 3 බැගින් අඩු කරයි.",
        maxMarks: 30,
        type: "number",
      },
      {
        key: "service_years",
        label: "Years of Government Service",
        labelSi: "රජයේ සේවා වර්ෂ",
        description: "1 pt per year. Max 10.",
        descriptionSi: "වර්ෂයකට ලකුණු 1. උපරිම 10.",
        maxMarks: 10,
        type: "number",
      },
      {
        key: "previous_posting",
        label: "Service at Previous Posting",
        labelSi: "පෙර රාජකාරි ස්ථානයේ සේවය",
        description: "Duration at previous posting before transfer. 3+yrs=10; 2-3=8; 1-2=5.",
        descriptionSi: "මාරුවට පෙර පෙර රාජකාරි ස්ථානයේ සේවා කාලය. 3+වර්ෂ=10; 2-3=8; 1-2=5.",
        maxMarks: 10,
        type: "select",
        options: [
          { value: 10, label: "3+ years (10 pts)", labelSi: "වර්ෂ 3+ (10)" },
          { value: 8, label: "2-3 years (8 pts)", labelSi: "වර්ෂ 2-3 (8)" },
          { value: 5, label: "1-2 years (5 pts)", labelSi: "වර්ෂ 1-2 (5)" },
        ],
      },
      {
        key: "time_since_transfer",
        label: "Time Since Transfer",
        labelSi: "මාරුවෙන් පසු කාලය",
        description: "Time elapsed since transfer. <1yr=5; 1-2=4; 2-3=3; 3-4=2; 4-5=1.",
        descriptionSi: "මාරුවෙන් පසු ගතවූ කාලය. <1වර්ෂ=5; 1-2=4; 2-3=3; 3-4=2; 4-5=1.",
        maxMarks: 5,
        type: "select",
        options: [
          { value: 5, label: "Within 1 year (5 pts)", labelSi: "වර්ෂ 1ට අඩු (5)" },
          { value: 4, label: "1-2 years (4 pts)", labelSi: "වර්ෂ 1-2 (4)" },
          { value: 3, label: "2-3 years (3 pts)", labelSi: "වර්ෂ 2-3 (3)" },
          { value: 2, label: "3-4 years (2 pts)", labelSi: "වර්ෂ 3-4 (2)" },
          { value: 1, label: "4-5 years (1 pt)", labelSi: "වර්ෂ 4-5 (1)" },
        ],
      },
      {
        key: "unused_leave",
        label: "Unused Leave",
        labelSi: "නොබැගෑ නිවාඩු",
        description: "20+ unused days per year = 2 pts/yr. Max 10.",
        descriptionSi: "වර්ෂයකට නොබැගෑ දින 20+ = වර්ෂයකට ලකුණු 2. උපරිම 10.",
        maxMarks: 10,
        type: "number",
      },
    ],
  },
  OverseasArrival: {
    label: "Overseas Arrival",
    percentage: "1%",
    circularRef: "7.7",
    criteria: [
      {
        key: "duration_abroad",
        label: "Duration Abroad with Child",
        labelSi: "ළමයා සමඟ විදේශයේ කාලය",
        description: "Continuous period abroad with the child. Short breaks (<1 month) allowed. 3+yrs=25; 2-3=15; 1-2=10.",
        descriptionSi: "ළමයා සමඟ අඛණ්ඩව විදේශයේ ගත කළ කාලය. කෙටි නිවාඩු (<මාස 1) පිළිගනු ලැබේ. 3+වර්ෂ=25; 2-3=15; 1-2=10.",
        maxMarks: 25,
        type: "select",
        options: [
          { value: 25, label: "3+ years abroad (25 pts)", labelSi: "වර්ෂ 3+ විදේශයේ (25)" },
          { value: 15, label: "2-3 years (15 pts)", labelSi: "වර්ෂ 2-3 (15)" },
          { value: 10, label: "1-2 years (10 pts)", labelSi: "වර්ෂ 1-2 (10)" },
        ],
      },
      {
        key: "nature_of_stay",
        label: "Nature of Overseas Stay",
        labelSi: "විදේශ රටක රැඳීමේ ස්වභාවය",
        description: "Govt service/scholarship=40; Private studies=30; Private employment 2+yrs=25.",
        descriptionSi: "රජයේ සේවය/ශිෂ්‍යත්ව=40; පුද්ගලික අධ්‍යයන=30; පුද්ගලික සේවය වර්ෂ 2+=25.",
        maxMarks: 40,
        type: "select",
        options: [
          { value: 40, label: "Govt service/scholarship (40 pts)", labelSi: "රජයේ සේවය/ශිෂ්‍යත්ව (40)" },
          { value: 30, label: "Private studies abroad (30 pts)", labelSi: "පුද්ගලික අධ්‍යයන (30)" },
          { value: 25, label: "Private employment 2+ yrs (25 pts)", labelSi: "පුද්ගලික සේවය වර්ෂ 2+ (25)" },
        ],
      },
      {
        key: "proximity_to_school",
        label: "Proximity to School",
        labelSi: "පාසලට ආසන්නතාව",
        description: "No nearer govt school = 35 pts max. Deduction of 3.5 pts per nearer school.",
        descriptionSi: "ආසන්න රජයේ පාසලක් නොමැති නම් උපරිම 35. සෑම ආසන්න පාසලකටම 3.5 බැගින් අඩු කරයි.",
        maxMarks: 35,
        type: "number",
      },
    ],
  },
}

function ScoringSlider({
  value,
  onChange,
  max,
}: {
  value: number
  onChange: (v: number) => void
  max: number
}) {
  return (
    <div className="space-y-1">
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

interface Props {
  category: string
  marks: Record<string, InterviewMarks>
  guardians: Guardian[]
  addresses: Array<{ address_id: string; address_type: string; residence_type: string; is_primary: boolean }>
  allAddresses: Address[]
  siblings: Student[]
  schools: Array<{ id: string; name_si?: string | null; name_en?: string | null }>
  documents: DocumentFormData[]
  onMarkChange: (category: string, subCriterion: string, marks: number) => void
  onNotesChange: (category: string, notes: string) => void
  onBack: () => void
  onNext: () => void
}

export function InterviewStepCategoryScoring({
  category,
  marks,
  onMarkChange,
  onNotesChange,
  onBack,
  onNext,
}: Props) {
  const categoryConfig = CATEGORY_CRITERIA[category]
  const currentMarks = marks[category] || {
    category,
    subCriteria: {},
    totalMarks: 0,
    notes: "",
  }

  const totalPossible = useMemo(() => {
    if (!categoryConfig) return 0
    return categoryConfig.criteria.reduce((sum, c) => sum + c.maxMarks, 0)
  }, [categoryConfig])

  if (!categoryConfig) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Category Scoring</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No category assigned. Please assign a category first.
          </p>
        </div>
        <div className="flex justify-start border-t pt-4">
          <Button variant="outline" onClick={onBack}>Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">
          {categoryConfig.label}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({categoryConfig.percentage} of seats)
          </span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Per circular section {categoryConfig.circularRef}, max score is 100 points.
          <span className="ml-1 text-xs">
            චක්‍රලේඛ වගුව {categoryConfig.circularRef} යටතේ උපරිම ලකුණු 100.
          </span>
        </p>
      </div>

      {/* Current Total */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-4">
        <div>
          <p className="text-sm font-medium">Current Total</p>
          <p className="text-xs text-muted-foreground">Out of {totalPossible}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-bold tabular-nums">{currentMarks.totalMarks}</span>
          <span className="text-sm text-muted-foreground"> / {totalPossible}</span>
        </div>
      </div>

      {/* Scoring Criteria */}
      <div className="space-y-4">
        {categoryConfig.criteria.map((criterion, index) => {
          const currentScore = currentMarks.subCriteria[criterion.key] || 0

          return (
            <Card key={criterion.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {index + 1}
                    </span>
                    <span>
                      {criterion.label}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {criterion.labelSi}
                      </span>
                    </span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Max: {criterion.maxMarks}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Instructions */}
                <div className="rounded-md bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{criterion.description}</p>
                  <p className="mt-0.5 text-[11px] text-blue-600 dark:text-blue-400">
                    {criterion.descriptionSi}
                  </p>
                </div>

                {/* Scoring Input */}
                {criterion.type === "select" && criterion.options ? (
                  <Select
                    value={String(currentScore)}
                    onValueChange={(v) => onMarkChange(category, criterion.key, Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select score..." />
                    </SelectTrigger>
                    <SelectContent>
                      {criterion.options.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                          {opt.labelSi && (
                            <span className="ml-1 text-xs text-muted-foreground">({opt.labelSi})</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={criterion.maxMarks}
                        value={currentScore || ""}
                        onChange={(e) => {
                          const val = Math.min(Math.max(0, Number(e.target.value)), criterion.maxMarks)
                          onMarkChange(category, criterion.key, val)
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">/ {criterion.maxMarks}</span>
                    </div>
                    <ScoringSlider
                      value={currentScore}
                      onChange={(v) => onMarkChange(category, criterion.key, v)}
                      max={criterion.maxMarks}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <IconNote className="size-4" />
            Interview Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentMarks.notes}
            onChange={(e) => onNotesChange(category, e.target.value)}
            placeholder="Record observations from the interview panel..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between border-t pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Proceed to Summary
        </Button>
      </div>
    </div>
  )
}
