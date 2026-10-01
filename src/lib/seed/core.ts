import { addDays, format, subDays, subMonths, addMonths } from "date-fns";
import { mulberry32, type Rng } from "./random";
import type {
  AttendanceRecord,
  AttendanceStatus,
  BudgetLine,
  Client,
  Employee,
  Project,
  Supplier,
  User,
} from "@/lib/types";

export const SEED_VERSION = "1.0.0";

export interface CoreSeed {
  users: User[];
  employees: Employee[];
  clients: Client[];
  projects: Project[];
  suppliers: Supplier[];
  attendance: AttendanceRecord[];
  attendanceFrom: string;
  attendanceTo: string;
}

function iso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function hours(minutes: number): string {
  return (minutes / 60).toFixed(2);
}

export function buildCoreSeed(now: Date = new Date()): CoreSeed {
  const rng = mulberry32(20240517);
  const attendanceTo = now;
  const attendanceFrom = subDays(now, 29);

  const users: User[] = [
    {
      id: "usr_admin",
      name: "Amara Okonjo",
      email: "amara.okonjo@buildwell.demo",
      role: "admin",
      jobTitle: "Managing Director",
      employeeId: "emp_006",
      active: true,
    },
    {
      id: "usr_approver",
      name: "Daniel Reyes",
      email: "daniel.reyes@buildwell.demo",
      role: "approver",
      jobTitle: "Commercial Director",
      employeeId: "emp_005",
      active: true,
    },
    {
      id: "usr_procurement",
      name: "Priya Raman",
      email: "priya.raman@buildwell.demo",
      role: "procurement_officer",
      jobTitle: "Procurement Lead",
      employeeId: "emp_003",
      active: true,
    },
    {
      id: "usr_procurement_2",
      name: "Marcus Delgado",
      email: "marcus.delgado@buildwell.demo",
      role: "procurement_officer",
      jobTitle: "Procurement Officer",
      employeeId: "emp_004",
      active: true,
    },
    {
      id: "usr_engineer",
      name: "Yusuf Karim",
      email: "yusuf.karim@buildwell.demo",
      role: "site_engineer",
      jobTitle: "Project Engineer",
      employeeId: "emp_001",
      active: true,
    },
    {
      id: "usr_hr",
      name: "Hannah Nkemelu",
      email: "hannah.nkemelu@buildwell.demo",
      role: "hr_manager",
      jobTitle: "HR & Payroll Manager",
      employeeId: "emp_002",
      active: true,
    },
  ];

  const employees: Employee[] = [
    {
      id: "emp_001",
      employeeNo: "BW-1001",
      name: "Yusuf Karim",
      firstName: "Yusuf",
      lastName: "Karim",
      jobTitle: "Project Engineer",
      department: "site",
      projectId: "prj_2401",
      email: "yusuf.karim@buildwell.demo",
      phone: "+1 512 555 0142",
      nationality: "Lebanese",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 26)),
      baseMonthlySalary: "5400.00",
      bankAccountLast4: "4417",
      certifications: ["NEBOSH IGC", "OSHA 30-Hour"],
    },
    {
      id: "emp_002",
      employeeNo: "BW-1002",
      name: "Hannah Nkemelu",
      firstName: "Hannah",
      lastName: "Nkemelu",
      jobTitle: "HR & Payroll Manager",
      department: "hr",
      projectId: null,
      email: "hannah.nkemelu@buildwell.demo",
      phone: "+1 512 555 0177",
      nationality: "Nigerian",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 31)),
      baseMonthlySalary: "4900.00",
      bankAccountLast4: "9082",
      certifications: ["SHRM-CP", "CIPD Level 5"],
    },
    {
      id: "emp_003",
      employeeNo: "BW-1003",
      name: "Priya Raman",
      firstName: "Priya",
      lastName: "Raman",
      jobTitle: "Procurement Lead",
      department: "procurement",
      projectId: null,
      email: "priya.raman@buildwell.demo",
      phone: "+1 512 555 0190",
      nationality: "Indian",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 22)),
      baseMonthlySalary: "5100.00",
      bankAccountLast4: "3350",
      certifications: ["CIPS Level 3"],
    },
    {
      id: "emp_004",
      employeeNo: "BW-1004",
      name: "Marcus Delgado",
      firstName: "Marcus",
      lastName: "Delgado",
      jobTitle: "Procurement Officer",
      department: "procurement",
      projectId: null,
      email: "marcus.delgado@buildwell.demo",
      phone: "+1 512 555 0121",
      nationality: "Spanish",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 9)),
      baseMonthlySalary: "3750.00",
      bankAccountLast4: "7764",
      certifications: ["CIPS Foundation", "Forklift Licence"],
    },
    {
      id: "emp_005",
      employeeNo: "BW-1005",
      name: "Daniel Reyes",
      firstName: "Daniel",
      lastName: "Reyes",
      jobTitle: "Commercial Director",
      department: "commercial",
      projectId: null,
      email: "daniel.reyes@buildwell.demo",
      phone: "+1 512 555 0108",
      nationality: "American",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 40)),
      baseMonthlySalary: "7200.00",
      bankAccountLast4: "1298",
      certifications: ["MRICS", "PMP"],
    },
    {
      id: "emp_006",
      employeeNo: "BW-1006",
      name: "Amara Okonjo",
      firstName: "Amara",
      lastName: "Okonjo",
      jobTitle: "Managing Director",
      department: "commercial",
      projectId: null,
      email: "amara.okonjo@buildwell.demo",
      phone: "+1 512 555 0101",
      nationality: "British",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 58)),
      baseMonthlySalary: "9000.00",
      bankAccountLast4: "5503",
      certifications: ["FRICS", "MBA"],
    },
    {
      id: "emp_007",
      employeeNo: "BW-2007",
      name: "Robert Kamau",
      firstName: "Robert",
      lastName: "Kamau",
      jobTitle: "Site Foreman",
      department: "site",
      projectId: "prj_2401",
      email: "robert.kamau@buildwell.demo",
      phone: "+1 512 555 0163",
      nationality: "Kenyan",
      status: "active",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 18)),
      baseMonthlySalary: "2950.00",
      bankAccountLast4: "6621",
      certifications: ["SSSTS", "First Aid at Work"],
    },
    {
      id: "emp_008",
      employeeNo: "BW-2008",
      name: "Sarah Njoku",
      firstName: "Sarah",
      lastName: "Njoku",
      jobTitle: "Health & Safety Officer",
      department: "health_safety",
      projectId: "prj_2402",
      email: "sarah.njoku@buildwell.demo",
      phone: "+1 512 555 0155",
      nationality: "British",
      status: "on_leave",
      employmentType: "full_time",
      joinedOn: iso(subMonths(now, 14)),
      baseMonthlySalary: "4100.00",
      bankAccountLast4: "8845",
      certifications: ["NEBOSH Diplomas", "IOSH LMGS"],
    },
  ];

  const clients: Client[] = [
    {
      id: "cli_0001",
      code: "CL-001",
      companyName: "Meridian Development Group",
      sector: "Private developer — commercial & residential",
      contactName: "Rachel Osei",
      contactEmail: "rachel.osei@meridiandev.example",
      contactPhone: "+1 512 555 0301",
      billingAddress: "1100 Congress Avenue, Suite 2400",
      city: "Austin, TX",
      country: "United States",
      taxId: "US-74-8821904",
      currency: "USD",
      paymentTermsDays: 45,
      creditLimit: "1500000.00",
      outstandingBalance: "385400.00",
      status: "active",
      relationshipSince: iso(subMonths(now, 46)),
      projectIds: ["prj_2401", "prj_2403"],
      accountManagerUserId: "usr_approver",
      notes: "Monthly progress claims certified by their cost consultant. Retention released at practical completion.",
    },
    {
      id: "cli_0002",
      code: "CL-002",
      companyName: "Halcyon Infrastructure Partners",
      sector: "Public infrastructure authority",
      contactName: "Daniel Whitfield",
      contactEmail: "daniel.whitfield@halcyoninfra.example",
      contactPhone: "+1 614 555 0444",
      billingAddress: "77 Civic Plaza, Level 12",
      city: "Columbus, OH",
      country: "United States",
      taxId: "US-31-5590217",
      currency: "USD",
      paymentTermsDays: 30,
      creditLimit: "2000000.00",
      outstandingBalance: "1120750.00",
      status: "active",
      relationshipSince: iso(subMonths(now, 27)),
      projectIds: ["prj_2402"],
      accountManagerUserId: "usr_admin",
      notes: "Public procurement framework — all invoices require milestone verification and buy-out evidence.",
    },
  ];

  const towerBudget: BudgetLine[] = [
    budget("prj_2401", 1, "labour", "Direct site labour — tower envelope", "2180000.00", "1180000.00", "320000.00"),
    budget("prj_2401", 2, "materials", "Structural steel, rebar and concrete supply", "2640000.00", "2720000.00", "60000.00"),
    budget("prj_2401", 3, "equipment", "Tower crane, hoists and temporary power", "620000.00", "285000.00", "118000.00"),
    budget("prj_2401", 4, "subcontractors", "Curtain wall, glazing and roof plant", "1150000.00", "420000.00", "60000.00"),
    budget("prj_2401", 5, "professional_fees", "Design support, QS and testing", "180000.00", "122500.00", "0.00"),
    budget("prj_2401", 6, "permits", "Permits, bonds and statutory fees", "90000.00", "99000.00", "0.00"),
    budget("prj_2401", 7, "contingency", "Contingency held at head office", "310000.00", "90000.00", "82000.00"),
    budget("prj_2401", 8, "overhead", "Site establishment, security and welfare", "610000.00", "190000.00", "0.00"),
  ];

  const transitBudget: BudgetLine[] = [
    budget("prj_2402", 1, "labour", "Civil works labour — substructure and platforms", "3120000.00", "620000.00", "250000.00"),
    budget("prj_2402", 2, "materials", "Aggregate, cement and reinforcement", "4050000.00", "980000.00", "780000.00"),
    budget("prj_2402", 3, "equipment", "Excavators, cranes and piling rig", "1450000.00", "310000.00", "300000.00"),
    budget("prj_2402", 4, "subcontractors", "Piling, drainage and track bed packages", "1980000.00", "430000.00", "120000.00"),
    budget("prj_2402", 5, "professional_fees", "Civils consultancy and geotechnical", "340000.00", "130000.00", "0.00"),
    budget("prj_2402", 6, "permits", "Rail authority permits and lane closures", "260000.00", "180000.00", "60000.00"),
    budget("prj_2402", 7, "contingency", "Contingency for ground conditions", "480000.00", "40000.00", "0.00"),
    budget("prj_2402", 8, "overhead", "Compound running costs", "200000.00", "25000.00", "0.00"),
  ];

  const civicBudget: BudgetLine[] = [
    budget("prj_2403", 1, "labour", "Fit-out labour — levels 1–4", "780000.00", "0.00", "0.00"),
    budget("prj_2403", 2, "materials", "Joinery, flooring and FF&E", "960000.00", "0.00", "0.00"),
    budget("prj_2403", 3, "equipment", "Hoists and access for fit-out", "240000.00", "0.00", "0.00"),
    budget("prj_2403", 4, "subcontractors", "MEP, ceilings and glazed screens", "610000.00", "0.00", "0.00"),
    budget("prj_2403", 5, "professional_fees", "Interior design and acoustic consultancy", "130000.00", "0.00", "0.00"),
    budget("prj_2403", 6, "permits", "Building control and fire strategy", "90000.00", "0.00", "0.00"),
    budget("prj_2403", 7, "contingency", "Pre-construction contingency", "70000.00", "0.00", "0.00"),
    budget("prj_2403", 8, "overhead", "Site compound and security", "50000.00", "0.00", "0.00"),
  ];

  const projects: Project[] = [
    {
      id: "prj_2401",
      code: "PRJ-2401",
      name: "Meridian Riverside Tower — Phase 2",
      clientId: "cli_0001",
      type: "commercial",
      status: "active",
      siteAddress: "1400 Riverside Drive, Plot B",
      city: "Austin, TX",
      country: "United States",
      contractValue: "8450000.00",
      retentionPercent: "5.00",
      startDate: iso(subMonths(now, 8)),
      endDate: iso(addMonths(now, 4)),
      progressPercent: 62,
      siteManagerEmployeeId: "emp_007",
      engineerEmployeeIds: ["emp_001", "emp_007"],
      budgetLines: towerBudget,
      description:
        "18-storey commercial tower, core and envelope complete, curtain wall installation in progress on levels 12–18.",
    },
    {
      id: "prj_2402",
      code: "PRJ-2402",
      name: "Halcyon Transit Hub — Civil Works",
      clientId: "cli_0002",
      type: "infrastructure",
      status: "active",
      siteAddress: "Transit Hub Corridor, Chainage 4+200",
      city: "Columbus, OH",
      country: "United States",
      contractValue: "12900000.00",
      retentionPercent: "10.00",
      startDate: iso(subMonths(now, 3)),
      endDate: iso(addMonths(now, 12)),
      progressPercent: 34,
      siteManagerEmployeeId: "emp_001",
      engineerEmployeeIds: ["emp_001", "emp_008"],
      budgetLines: transitBudget,
      description:
        "Substructure, piling and platform civils for a regional transit interchange with associated drainage and track bed.",
    },
    {
      id: "prj_2403",
      code: "PRJ-2403",
      name: "Halcyon Civic Centre — Interior Fit-out",
      clientId: "cli_0002",
      type: "fit_out",
      status: "planning",
      siteAddress: "55 Mercer Street",
      city: "Columbus, OH",
      country: "United States",
      contractValue: "3180000.00",
      retentionPercent: "5.00",
      startDate: iso(addDays(addMonths(now, 1), 15)),
      endDate: iso(addMonths(now, 8)),
      progressPercent: 0,
      siteManagerEmployeeId: "emp_001",
      engineerEmployeeIds: ["emp_001"],
      budgetLines: civicBudget,
      description:
        "Pre-construction phase. Shop drawings in review, long-lead joinery and FF&E packages to be released at contract signature.",
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: "sup_0001",
      code: "SUP-001",
      name: "Steelcore Metals Ltd",
      categories: ["Structural steel", "Rebar", "Metalwork"],
      contactName: "Victor Alvarez",
      email: "orders@steelcore-metals.example",
      phone: "+1 214 555 0210",
      city: "Fort Worth, TX",
      country: "United States",
      taxId: "US-75-4410228",
      status: "approved",
      rating: 4.6,
      onTimeDeliveryPercent: 94,
      qualityRejectPercent: 1.2,
      paymentTermsDays: 30,
      totalSpend: "1842500.00",
      openPurchaseOrderCount: 3,
      bankVerified: true,
      insuranceExpiry: iso(addMonths(now, 8)),
    },
    {
      id: "sup_0002",
      code: "SUP-002",
      name: "ReadyMix Central",
      categories: ["Ready-mix concrete", "Grout", "Admixtures"],
      contactName: "Alicia Fontaine",
      email: "dispatch@readymixcentral.example",
      phone: "+1 512 555 0670",
      city: "Austin, TX",
      country: "United States",
      taxId: "US-74-9920113",
      status: "approved",
      rating: 4.2,
      onTimeDeliveryPercent: 88,
      qualityRejectPercent: 2.4,
      paymentTermsDays: 21,
      totalSpend: "1264000.00",
      openPurchaseOrderCount: 2,
      bankVerified: true,
      insuranceExpiry: iso(addMonths(now, 5)),
    },
    {
      id: "sup_0003",
      code: "SUP-003",
      name: "Volt & Pipe Systems",
      categories: ["Electrical", "Plumbing", "HVAC"],
      contactName: "Owen Fitzgerald",
      email: "commercial@voltpipe.example",
      phone: "+1 614 555 0288",
      city: "Columbus, OH",
      country: "United States",
      taxId: "US-31-7710345",
      status: "under_review",
      rating: 3.8,
      onTimeDeliveryPercent: 79,
      qualityRejectPercent: 4.1,
      paymentTermsDays: 45,
      totalSpend: "486300.00",
      openPurchaseOrderCount: 1,
      bankVerified: true,
      insuranceExpiry: iso(subDays(now, 21)),
    },
    {
      id: "sup_0004",
      code: "SUP-004",
      name: "Apex Scaffold & Access",
      categories: ["Scaffolding", "Formwork", "Edge protection"],
      contactName: "Tomas Brandt",
      email: "hire@apexaccess.example",
      phone: "+1 713 555 0333",
      city: "Houston, TX",
      country: "United States",
      taxId: "US-76-1180244",
      status: "approved",
      rating: 4.4,
      onTimeDeliveryPercent: 91,
      qualityRejectPercent: 0.8,
      paymentTermsDays: 30,
      totalSpend: "318900.00",
      openPurchaseOrderCount: 2,
      bankVerified: true,
      insuranceExpiry: iso(addMonths(now, 14)),
    },
    {
      id: "sup_0005",
      code: "SUP-005",
      name: "TerraCivil Equipment Hire",
      categories: ["Plant hire", "Groundworks", "Temporary works"],
      contactName: "Gareth Pryce",
      email: "accounts@terracivil.example",
      phone: "+1 469 555 0455",
      city: "Dallas, TX",
      country: "United States",
      taxId: "US-70-3340987",
      status: "approved",
      rating: 3.1,
      onTimeDeliveryPercent: 71,
      qualityRejectPercent: 5.6,
      paymentTermsDays: 14,
      totalSpend: "742150.00",
      openPurchaseOrderCount: 0,
      bankVerified: false,
      insuranceExpiry: iso(addDays(now, 46)),
    },
  ];

  return {
    users,
    employees,
    clients,
    projects,
    suppliers,
    attendance: buildAttendance(employees, attendanceFrom, attendanceTo, rng),
    attendanceFrom: iso(attendanceFrom),
    attendanceTo: iso(attendanceTo),
  };
}

function budget(
  projectId: string,
  index: number,
  category: BudgetLine["category"],
  description: string,
  budgetAmount: string,
  actualAmount: string,
  committedAmount: string,
): BudgetLine {
  return {
    id: `bl_${projectId.slice(4)}_${String(index).padStart(2, "0")}`,
    projectId,
    code: `B-${projectId.slice(4)}-${String(index).padStart(2, "0")}`,
    category,
    description,
    budgetAmount,
    committedAmount,
    actualAmount,
  };
}

const LEAVE_NOTES = [
  "Annual leave approved",
  "Sick leave — medical certificate provided",
  "Unpaid personal leave",
  "Compassionate leave",
];

const ABSENCE_NOTES = [
  "Unscheduled absence — contact not answered",
  "No show, replacement crew notified",
  "Called in sick at 05:40",
  "Transport disruption, arrived after shift start",
];

function buildAttendance(
  employees: readonly Employee[],
  from: Date,
  to: Date,
  rng: Rng,
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let dayOffset = 0;

  for (let cursor = new Date(from); cursor <= to; cursor = addDays(cursor, 1)) {
    const date = iso(cursor);
    const weekday = cursor.getDay();
    dayOffset += 1;

    for (const [index, employee] of employees.entries()) {
      const roll = (rng.next() + index * 0.37) % 1;
      let status: AttendanceStatus;

      if (weekday === 0) {
        status = "holiday";
      } else if (employee.status === "inactive") {
        status = "absent";
      } else if (roll < 0.05) {
        status = "absent";
      } else if (roll < 0.1) {
        status = "leave";
      } else if (roll < 0.19) {
        status = "late";
      } else {
        status = "present";
      }

      if (employee.id === "emp_008" && dayOffset > 24) {
        status = "leave";
      }
      if (employee.id === "emp_002" && dayOffset === 9) {
        status = "leave";
      }
      if (employee.id === "emp_004" && dayOffset === 16) {
        status = "absent";
      }

      const isWorking = status === "present" || status === "late";
      const checkInMinutes = 6 * 60 + 40 + rng.int(0, status === "late" ? 55 : 40);
      const overtimeMinutes = isWorking
        ? dayOffset % 5 === 0
          ? 0
          : rng.int(0, 5) === 0
            ? rng.int(270, 320)
            : rng.int(60, 210)
        : 0;

      records.push({
        id: `att_${date.replace(/-/g, "")}_${employee.id.slice(4)}`,
        employeeId: employee.id,
        projectId: employee.projectId,
        date,
        status,
        checkIn: isWorking ? clock(checkInMinutes) : null,
        checkOut: isWorking ? clock(checkInMinutes + 480 + overtimeMinutes) : null,
        regularHours: isWorking ? "8.00" : "0.00",
        overtimeHours: hours(overtimeMinutes),
        note:
          status === "leave"
            ? rng.pick(LEAVE_NOTES)
            : status === "absent"
              ? rng.pick(ABSENCE_NOTES)
              : status === "late"
                ? "Late start — traffic"
                : null,
      });
    }
  }

  return records;
}

function clock(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60) % 24;
  const minutes = minutesFromMidnight % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
