const fs = require('fs');

// Example script to procedurally generate the remaining parameter records
const categories = [
  "Science/Physics", "History", "Mathematics", "Technology/Programming",
  "Health & Wellness", "Finance/Economics", "Geography/Travel",
  "Food/Recipes", "Philosophy/Self-Help", "Creative/General"
];

const generateRulesAndResponses = (startId, count) => {
  const rules = [];
  const responses = [];

  for (let i = 0; i < count; i++) {
    const idNum = startId + i;
    const catIndex = i % categories.length;
    const category = categories[catIndex];

    rules.push({
      id: `RULE_${idNum}`,
      triggers: [`Procedural trigger ${idNum}`, `Keyword ${idNum}`],
      regex: `(?i)procedural trigger ${idNum}`,
      bitmask: Math.pow(2, catIndex),
      priority: 85,
      response_ids: [`RESP_${idNum}`],
      confidence: 0.85,
      web_fallback: false
    });

    responses.push({
      id: `RESP_${idNum}`,
      category: category,
      content: `This is an auto-generated procedural response for the ${category} parameter ${idNum}. Use this template to rapidly scale S.W.E.I's rule engine structure. Sources: S.W.E.I Base.`
    });
  }

  fs.writeFileSync('rules_batch_procedural.json', JSON.stringify(rules, null, 2));
  fs.writeFileSync('responses_batch_procedural.json', JSON.stringify(responses, null, 2));
  console.log(`Generated ${count} procedural parameters successfully.`);
};

// Generates the remaining 950 records to reach the 1,000 count
generateRulesAndResponses(751, 950);
