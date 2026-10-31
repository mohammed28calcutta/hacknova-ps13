export const mockEvaluate = {
  matched: [
    {
      id: 4,
      title: "Tata Capital Pankh Scholarship",
      provider: "Tata Capital",
      amount: "₹30,000/year",
      deadline: "In 7 days",
      daysLeft: 7,
      min_gpa: 7.0,
      max_income: 300000,
      category_eligible: ["All"],
      gender_eligible: "All",
      education_levels: ["UG"],
      required_docs: ["Aadhaar", "Marksheet", "Bank Passbook"],
      verified: true,
      status: "MATCHED",
      score: 100,
      passedRules: [
        "GPA 8.4 meets minimum 7.0",
        "Income is within the ₹3,00,000 limit",
        "Eligible for All categories",
        "Open to all genders",
        "Level UG is eligible",
        "All required documents available"
      ],
      failedRules: [],
      missingDocs: [],
      rationale: "You meet every requirement for Tata Capital Pankh Scholarship; apply before deadline."
    },
    {
      id: 5,
      title: "Reliance Foundation Undergraduate Scholarship",
      provider: "Reliance Foundation",
      amount: "₹2,00,000 (one-time)",
      deadline: "In 40 days",
      daysLeft: 40,
      min_gpa: 7.5,
      max_income: 250000,
      category_eligible: ["All"],
      gender_eligible: "All",
      education_levels: ["UG"],
      required_docs: ["Aadhaar", "Marksheet", "Bank Passbook"],
      verified: true,
      status: "MATCHED",
      score: 100,
      passedRules: [
        "GPA 8.4 meets minimum 7.5",
        "Income is within the ₹2,50,000 limit",
        "Eligible for All categories",
        "Open to all genders",
        "Level UG is eligible",
        "All required documents available"
      ],
      failedRules: [],
      missingDocs: [],
      rationale: "You meet every requirement for Reliance Foundation Undergraduate Scholarship; apply before deadline."
    },
    {
      id: 6,
      title: "Women in STEM Merit Grant",
      provider: "Education Trust",
      amount: "₹40,000/year",
      deadline: "In 25 days",
      daysLeft: 25,
      min_gpa: 8.0,
      max_income: 600000,
      category_eligible: ["All"],
      gender_eligible: "Female",
      education_levels: ["UG", "PG"],
      required_docs: ["Aadhaar", "Marksheet", "Bank Passbook"],
      verified: true,
      status: "MATCHED",
      score: 100,
      passedRules: [
        "GPA 8.4 meets minimum 8.0",
        "Income is within the ₹6,00,000 limit",
        "Open only to Female students",
        "Level UG is eligible",
        "All required documents available"
      ],
      failedRules: [],
      missingDocs: [],
      rationale: "You meet every requirement for Women in STEM Merit Grant; apply before deadline."
    },
    {
      id: 7,
      title: "State Merit Excellence Award",
      provider: "State Education Dept.",
      amount: "₹25,000/year",
      deadline: "In 45 days",
      daysLeft: 45,
      min_gpa: 7.0,
      max_income: 1200000,
      category_eligible: ["All"],
      gender_eligible: "All",
      education_levels: ["UG"],
      required_docs: ["Aadhaar", "Marksheet", "Bank Passbook"],
      verified: true,
      status: "MATCHED",
      score: 100,
      passedRules: [
        "GPA 8.4 meets minimum 7.0",
        "Income is within the ₹12,00,000 limit",
        "Eligible for All categories",
        "Open to all genders",
        "Level UG is eligible",
        "All required documents available"
      ],
      failedRules: [],
      missingDocs: [],
      rationale: "You meet every requirement for State Merit Excellence Award; apply before deadline."
    }
  ],
  partial: [
    {
      id: 1,
      title: "AICTE Pragati Scholarship for Girls",
      provider: "AICTE",
      amount: "₹50,000/year",
      deadline: "In 6 days",
      daysLeft: 6,
      min_gpa: 6.0,
      max_income: 800000,
      category_eligible: ["All"],
      gender_eligible: "Female",
      education_levels: ["UG", "Diploma"],
      required_docs: ["Aadhaar", "Marksheet", "Income Certificate", "Bank Passbook"],
      verified: true,
      status: "PARTIAL",
      score: 83,
      passedRules: [
        "GPA 8.4 meets minimum 6.0",
        "Income is within the ₹8,00,000 limit",
        "Open only to Female students",
        "Level UG is eligible"
      ],
      failedRules: [
        "Missing documents: Income Certificate"
      ],
      missingDocs: ["Income Certificate"],
      rationale: "You qualify on the criteria for AICTE Pragati Scholarship for Girls but still need: Income Certificate."
    },
    {
      id: 2,
      title: "Central Sector Scheme for College Students",
      provider: "Govt. of India",
      amount: "₹20,000/year",
      deadline: "In 20 days",
      daysLeft: 20,
      min_gpa: 8.0,
      max_income: 450000,
      category_eligible: ["All"],
      gender_eligible: "All",
      education_levels: ["UG"],
      required_docs: ["Aadhaar", "Marksheet", "Income Certificate", "Bank Passbook"],
      verified: true,
      status: "PARTIAL",
      score: 83,
      passedRules: [
        "GPA 8.4 meets minimum 8.0",
        "Income is within the ₹4,50,000 limit",
        "Level UG is eligible"
      ],
      failedRules: [
        "Missing documents: Income Certificate"
      ],
      missingDocs: ["Income Certificate"],
      rationale: "You qualify on the criteria for Central Sector Scheme for College Students but still need: Income Certificate."
    },
    {
      id: 3,
      title: "MahaDBT Post-Matric Scholarship",
      provider: "Maharashtra DBT",
      amount: "₹35,000/year",
      deadline: "In 5 days",
      daysLeft: 5,
      min_gpa: 5.5,
      max_income: 800000,
      category_eligible: ["OBC", "SC", "ST"],
      gender_eligible: "All",
      education_levels: ["UG", "PG", "Diploma"],
      required_docs: ["Aadhaar", "Marksheet", "Caste Certificate", "Income Certificate", "Bank Passbook"],
      verified: true,
      status: "PARTIAL",
      score: 83,
      passedRules: [
        "GPA 8.4 meets minimum 5.5",
        "Income is within the ₹8,00,000 limit",
        "Category OBC matches requirement"
      ],
      failedRules: [
        "Missing documents: Caste Certificate, Income Certificate"
      ],
      missingDocs: ["Caste Certificate", "Income Certificate"],
      rationale: "You qualify on the criteria for MahaDBT Post-Matric Scholarship but still need: Caste Certificate, Income Certificate."
    }
  ],
  ineligible: [
    {
      id: 8,
      title: "Top Class Education Scheme (SC)",
      provider: "Ministry of Social Justice",
      amount: "₹1,00,000/year",
      deadline: "In 12 days",
      daysLeft: 12,
      min_gpa: 6.0,
      max_income: 800000,
      category_eligible: ["SC"],
      gender_eligible: "All",
      education_levels: ["UG"],
      required_docs: ["Aadhaar", "Marksheet", "Caste Certificate", "Income Certificate", "Bank Passbook"],
      verified: true,
      status: "INELIGIBLE",
      score: 50,
      passedRules: ["GPA 8.4 meets minimum 6.0"],
      failedRules: ["Open only to SC category", "Missing documents: Caste Certificate, Income Certificate"],
      missingDocs: ["Caste Certificate", "Income Certificate"],
      rationale: "Not eligible for Top Class Education Scheme (SC): Open only to SC category."
    },
    {
      id: 9,
      title: "Merit-cum-Means Support Grant",
      provider: "Community Foundation",
      amount: "₹15,000/year",
      deadline: "In 18 days",
      daysLeft: 18,
      min_gpa: 6.5,
      max_income: 160000,
      category_eligible: ["All"],
      gender_eligible: "All",
      education_levels: ["UG", "Diploma"],
      required_docs: ["Aadhaar", "Marksheet", "Income Certificate"],
      verified: true,
      status: "INELIGIBLE",
      score: 67,
      passedRules: ["GPA 8.4 meets minimum 6.5"],
      failedRules: ["Income exceeds the ₹1,60,000 limit by ₹20,000", "Missing documents: Income Certificate"],
      missingDocs: ["Income Certificate"],
      rationale: "Not eligible for Merit-cum-Means Support Grant: Income exceeds the ₹1,60,000 limit by ₹20,000."
    },
    {
      id: 10,
      title: "PG Research Fellowship",
      provider: "Research Council",
      amount: "₹60,000/year",
      deadline: "In 35 days",
      daysLeft: 35,
      min_gpa: 8.5,
      max_income: 1000000,
      category_eligible: ["All"],
      gender_eligible: "All",
      education_levels: ["PG"],
      required_docs: ["Aadhaar", "Marksheet", "Bank Passbook"],
      verified: true,
      status: "INELIGIBLE",
      score: 50,
      passedRules: ["Income is within the ₹10,00,000 limit"],
      failedRules: ["GPA 8.4 is below the required 8.5", "Meant for PG students"],
      missingDocs: [],
      rationale: "Not eligible for PG Research Fellowship: Meant for PG students."
    }
  ]
};

export const mockReminders = {
  count: 3,
  alerts: [
    {
      id: 3,
      title: "MahaDBT Post-Matric Scholarship",
      deadline: "In 5 days",
      daysLeft: 5,
      missingDocs: ["Caste Certificate", "Income Certificate"]
    },
    {
      id: 1,
      title: "AICTE Pragati Scholarship for Girls",
      deadline: "In 6 days",
      daysLeft: 6,
      missingDocs: ["Income Certificate"]
    },
    {
      id: 4,
      title: "Tata Capital Pankh Scholarship",
      deadline: "In 7 days",
      daysLeft: 7,
      missingDocs: []
    }
  ]
};
