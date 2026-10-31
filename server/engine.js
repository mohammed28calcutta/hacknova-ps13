/**
 * HackNova PS13 - Matching Engine (CommonJS)
 */

function evaluateEligibility(student, scholarship) {
  const passedRules = [];
  const failedRules = [];
  let isHardFail = false;

  const studentDocs = Array.isArray(student.documents) ? student.documents : [];
  const reqDocs = Array.isArray(scholarship.required_docs) ? scholarship.required_docs : [];
  const catEligible = Array.isArray(scholarship.category_eligible) ? scholarship.category_eligible : ["All"];
  const eduLevels = Array.isArray(scholarship.education_levels) ? scholarship.education_levels : ["UG"];

  // 1. GPA Check
  const minGpa = Number(scholarship.min_gpa) || 0;
  const studentGpa = Number(student.gpa) || 0;
  if (studentGpa >= minGpa) {
    passedRules.push(`GPA ${studentGpa} meets the required ${minGpa}`);
  } else {
    failedRules.push(`GPA ${studentGpa} is below the required ${minGpa}`);
    // Shortfall greater than 0.5 is a hard failure; <= 0.5 is soft
    if (minGpa - studentGpa > 0.5) {
      isHardFail = true;
    }
  }

  // 2. Income Check (Hard failure)
  const maxIncome = Number(scholarship.max_income) || Infinity;
  const studentIncome = Number(student.income) || 0;
  if (studentIncome <= maxIncome) {
    passedRules.push(`Income is within the ₹${maxIncome.toLocaleString('en-IN')} limit`);
  } else {
    const diff = studentIncome - maxIncome;
    failedRules.push(`Income exceeds the ₹${maxIncome.toLocaleString('en-IN')} limit by ₹${diff.toLocaleString('en-IN')}`);
    isHardFail = true;
  }

  // 3. Category Check (Hard failure)
  const studentCat = student.category || "General";
  if (catEligible.includes("All") || catEligible.includes(studentCat)) {
    passedRules.push(`Category ${studentCat} matches requirement`);
  } else {
    failedRules.push(`Open only to ${catEligible.join(', ')} category`);
    isHardFail = true;
  }

  // 4. Gender Check (Hard failure)
  const studentGen = student.gender || "All";
  const genEligible = scholarship.gender_eligible || "All";
  if (genEligible === "All" || genEligible === studentGen) {
    passedRules.push(`Gender requirement met`);
  } else {
    failedRules.push(`Open only to ${genEligible} students`);
    isHardFail = true;
  }

  // 5. Education Level Check (Hard failure)
  const studentEdu = student.education_level || "UG";
  if (eduLevels.includes(studentEdu)) {
    passedRules.push(`Level ${studentEdu} is eligible`);
  } else {
    failedRules.push(`Meant for ${eduLevels.join(', ')} students`);
    isHardFail = true;
  }

  // 6. Documents Check (Soft failure)
  const missingDocs = reqDocs.filter(doc => !studentDocs.includes(doc));
  if (missingDocs.length === 0) {
    passedRules.push(`All required documents available`);
  } else {
    failedRules.push(`Missing documents: ${missingDocs.join(', ')}`);
  }

  // Determine Overall Status
  let status = "MATCHED";
  if (isHardFail) {
    status = "INELIGIBLE";
  } else if (failedRules.length > 0) {
    status = "PARTIAL";
  }

  // Calculate Score (0 to 100)
  const score = Math.round((passedRules.length / 6) * 100);

  // Exact Rationale Sentences
  let rationale = "";
  if (status === "MATCHED") {
    rationale = `You meet every requirement for ${scholarship.title}; apply before ${scholarship.deadline || 'deadline'}.`;
  } else if (status === "PARTIAL") {
    const missingText = missingDocs.length > 0 ? missingDocs.join(', ') : 'a slightly higher GPA';
    rationale = `You qualify on the criteria for ${scholarship.title} but still need: ${missingText}.`;
  } else {
    rationale = `Not eligible for ${scholarship.title}: ${failedRules[0] || 'criteria not met'}.`;
  }

  return {
    status,
    score,
    passedRules,
    failedRules,
    missingDocs,
    rationale
  };
}

function evaluateAll(student, scholarships) {
  const matched = [];
  const partial = [];
  const ineligible = [];

  for (const item of scholarships) {
    const evaluated = {
      ...item,
      ...evaluateEligibility(student, item)
    };

    if (evaluated.status === "MATCHED") {
      matched.push(evaluated);
    } else if (evaluated.status === "PARTIAL") {
      partial.push(evaluated);
    } else {
      ineligible.push(evaluated);
    }
  }

  // Sort by score descending, then by id ascending
  const sortFn = (a, b) => b.score - a.score || a.id - b.id;
  matched.sort(sortFn);
  partial.sort(sortFn);
  ineligible.sort(sortFn);

  return { matched, partial, ineligible };
}

module.exports = {
  evaluateEligibility,
  evaluateAll
};