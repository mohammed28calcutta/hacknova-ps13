// server/engine.js
// Scholarship eligibility engine. Pure functions, zero dependencies (CommonJS).
// Owner: Member 3. Used by server.js (Member 1).

const TOTAL_CHECKS = 6;
const SOFT_GPA_MARGIN = 0.5; // GPA shortfall up to this much is a "soft" failure

function rupees(n) {
  return "\u20B9" + Number(n).toLocaleString("en-IN");
}

function asArray(value, fallback) {
  return Array.isArray(value) ? value : fallback;
}

function evaluateEligibility(student, scholarship) {
  const s = student || {};
  const sch = scholarship || {};

  const gpa = Number(s.gpa) || 0;
  const income = Number.isFinite(Number(s.income)) ? Number(s.income) : Infinity;
  const category = s.category;
  const gender = s.gender;
  const level = s.education_level;
  const held = asArray(s.documents, []);

  const minGpa = Number(sch.min_gpa) || 0;
  const maxIncome = Number.isFinite(Number(sch.max_income)) ? Number(sch.max_income) : Infinity;
  const categories = asArray(sch.category_eligible, ["All"]);
  const genderRule = sch.gender_eligible || "All";
  const levels = asArray(sch.education_levels, ["UG"]);
  const requiredDocs = asArray(sch.required_docs, []);

  const passedRules = [];
  const failedRules = [];
  const hardFailures = [];
  let missingDocs = [];
  let gpaSoftFail = false;

  // 1. GPA
  if (gpa >= minGpa) {
    passedRules.push("GPA " + gpa + " meets the required " + minGpa);
  } else {
    const shortfall = Math.round((minGpa - gpa) * 100) / 100;
    const msg = "GPA " + gpa + " is below the required " + minGpa;
    failedRules.push(msg);
    if (shortfall <= SOFT_GPA_MARGIN) {
      gpaSoftFail = true;
    } else {
      hardFailures.push(msg);
    }
  }

  // 2. Income
  if (income <= maxIncome) {
    passedRules.push("Income is within the " + rupees(maxIncome) + " limit");
  } else {
    const msg = Number.isFinite(income)
      ? "Income exceeds the " + rupees(maxIncome) + " limit by " + rupees(income - maxIncome)
      : "Income not provided";
    failedRules.push(msg);
    hardFailures.push(msg);
  }

  // 3. Category
  if (categories.includes("All") || categories.includes(category)) {
    passedRules.push(
      categories.includes("All")
        ? "Open to all categories"
        : "Category " + category + " is eligible"
    );
  } else {
    const msg = "Open only to " + categories.join("/") + " category";
    failedRules.push(msg);
    hardFailures.push(msg);
  }

  // 4. Gender
  if (genderRule === "All" || genderRule === gender) {
    passedRules.push(
      genderRule === "All" ? "Open to all genders" : "Open to " + genderRule + " students"
    );
  } else {
    const msg = "Open only to " + genderRule + " students";
    failedRules.push(msg);
    hardFailures.push(msg);
  }

  // 5. Education level
  if (levels.includes(level)) {
    passedRules.push("Education level " + level + " is eligible");
  } else {
    const msg = "Meant for " + levels.join("/") + " students";
    failedRules.push(msg);
    hardFailures.push(msg);
  }

  // 6. Documents
  missingDocs = requiredDocs.filter(function (d) {
    return !held.includes(d);
  });
  if (missingDocs.length === 0) {
    passedRules.push("All required documents are ready");
  } else {
    failedRules.push("Missing documents: " + missingDocs.join(", "));
  }

  // Status
  let status;
  if (hardFailures.length > 0) {
    status = "INELIGIBLE";
  } else if (failedRules.length > 0) {
    status = "PARTIAL";
  } else {
    status = "MATCHED";
  }

  const score = Math.round((passedRules.length / TOTAL_CHECKS) * 100);
  const title = sch.title || "this scholarship";

  // Rationale (one sentence)
  let rationale;
  if (status === "MATCHED") {
    rationale = "You meet every requirement for " + title + "; apply before " + sch.deadline + ".";
  } else if (status === "PARTIAL") {
    const needs = missingDocs.slice();
    if (gpaSoftFail) needs.push("a slightly higher GPA");
    rationale =
      "You qualify on the criteria for " + title + " but still need: " + needs.join(", ") + ".";
  } else {
    rationale = "Not eligible for " + title + ": " + hardFailures[0] + ".";
  }

  return {
    status: status,
    score: score,
    passedRules: passedRules,
    failedRules: failedRules,
    missingDocs: missingDocs,
    rationale: rationale,
  };
}

function evaluateAll(student, scholarships) {
  const grouped = { matched: [], partial: [], ineligible: [] };
  const list = Array.isArray(scholarships) ? scholarships : [];

  list.forEach(function (sch) {
    const result = evaluateEligibility(student, sch);
    const item = Object.assign({}, sch, result);
    if (result.status === "MATCHED") grouped.matched.push(item);
    else if (result.status === "PARTIAL") grouped.partial.push(item);
    else grouped.ineligible.push(item);
  });

  const byScoreThenId = function (a, b) {
    return b.score - a.score || a.id - b.id;
  };
  grouped.matched.sort(byScoreThenId);
  grouped.partial.sort(byScoreThenId);
  grouped.ineligible.sort(byScoreThenId);

  return grouped;
}

module.exports = { evaluateEligibility, evaluateAll };
