export const PRESETS = {
  ananya: {
    name: "Ananya (First-Year Girl, OBC, Low Income)",
    gpa: 8.4,
    income: 180000,
    category: "OBC",
    gender: "Female",
    education_level: "UG",
    documents: ["Aadhaar", "Marksheet", "Bank Passbook"],
  },
  rohan: {
    name: "Rohan (General Male, High Income)",
    gpa: 7.2,
    income: 950000,
    category: "General",
    gender: "Male",
    education_level: "UG",
    documents: ["Aadhaar", "Marksheet", "Income Certificate", "Bank Passbook"],
  },
  priya: {
    name: "Priya (SC, Very Low Income, Top GPA)",
    gpa: 9.1,
    income: 90000,
    category: "SC",
    gender: "Female",
    education_level: "UG",
    documents: ["Aadhaar", "Marksheet", "Caste Certificate", "Income Certificate", "Bank Passbook"],
  },
};

export const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
export const GENDERS = ["Female", "Male", "Other"];
export const EDUCATION_LEVELS = ["UG", "PG", "Diploma"];
export const ALL_DOCUMENTS = [
  "Aadhaar",
  "Marksheet",
  "Bank Passbook",
  "Income Certificate",
  "Caste Certificate",
];
