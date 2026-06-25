const fs = require('fs');

const reasoningSubcategories = [
  "comparison", "tradeoff", "decision", "planning", "hypothesis", 
  "root_cause", "optimization", "evaluation", "decomposition", "forecast", 
  "strategy", "explanation", "teaching", "logic", "deduction", "induction",
  "abduction", "synthesis", "analysis", "reflection"
];

const toolSubcategories = [
  "search", "memory", "calculator", "code_execution", "file_access", 
  "image", "database", "api", "translation", "summarization", 
  "formatting", "extraction", "web_scraping", "chart_generation", "audio_processing",
  "email", "calendar", "notification", "authentication", "encryption"
];

const reasoningTemplates = [
  "Let me break this down for you.",
  "Here is a detailed comparison.",
  "Let's explore the pros and cons.",
  "Based on the criteria, here is a decision matrix.",
  "Let's create a step-by-step plan.",
  "Exploring that hypothesis...",
  "Let's analyze the root cause.",
  "Here are ways to optimize this.",
  "Let's evaluate the situation.",
  "Here is my forecast based on the data.",
  "Let's define a comprehensive strategy."
];

const toolTemplates = [
  "Searching for that information...",
  "Recalling from memory...",
  "Calculating the result...",
  "Executing the provided code...",
  "Reading the specified file...",
  "Analyzing the image...",
  "Running the database query...",
  "Making the API call...",
  "Translating the text...",
  "Summarizing the content...",
  "Formatting the data..."
];

const generateReasoning = (count) => {
  const reasoning = [];
  for (let i = 1; i <= count; i++) {
    const subcategory = reasoningSubcategories[Math.floor(Math.random() * reasoningSubcategories.length)];
    const idNum = String(i).padStart(3, '0');
    const priority = 70 + Math.floor(Math.random() * 20);
    const confidence = (0.85 + Math.random() * 0.1).toFixed(2);
    const success_rate = (parseFloat(confidence) + 0.01).toFixed(2);
    const failure_rate = (1 - parseFloat(success_rate)).toFixed(2);
    const activation_threshold = (0.65 + Math.random() * 0.15).toFixed(2);
    
    reasoning.push({
      "id": `reasoning-${subcategory}-${idNum}`,
      "intent_type": "atomic",
      "parent_router": `router-${subcategory}-001`,
      "category": "reasoning",
      "subcategory": subcategory,
      "version": 1,
      "status": "stable",
      "priority": priority,
      "triggers": [`analyze ${subcategory}`, `perform ${subcategory}`, `what about ${subcategory}`],
      "activation_threshold": parseFloat(activation_threshold),
      "routing_strategy": "multi_step",
      "requires_context": true,
      "requires_memory": Math.random() > 0.5,
      "requires_tools": false,
      "tool_dependencies": [],
      "clarifying_questions": [],
      "response_template": reasoningTemplates[Math.floor(Math.random() * reasoningTemplates.length)],
      "fallback_intents": ["router-reasoning-001"],
      "child_intents": [],
      "examples": [],
      "failure_cases": [],
      "confidence": parseFloat(confidence),
      "success_rate": parseFloat(success_rate),
      "failure_rate": parseFloat(failure_rate),
      "execution_cost": 2,
      "token_cost": 5,
      "reward_score": 0,
      "penalty_score": 0,
      "source": "reasoning_atomic_v1",
      "created": "2026-06-23",
      "last_updated": "2026-06-23"
    });
  }
  return reasoning;
};

const generateTools = (count) => {
  const tools = [];
  for (let i = 1; i <= count; i++) {
    const subcategory = toolSubcategories[Math.floor(Math.random() * toolSubcategories.length)];
    const idNum = String(i).padStart(3, '0');
    const priority = 70 + Math.floor(Math.random() * 20);
    const confidence = (0.85 + Math.random() * 0.1).toFixed(2);
    const success_rate = (parseFloat(confidence) + 0.01).toFixed(2);
    const failure_rate = (1 - parseFloat(success_rate)).toFixed(2);
    const activation_threshold = (0.70 + Math.random() * 0.15).toFixed(2);
    
    tools.push({
      "id": `tool-${subcategory}-${idNum}`,
      "intent_type": "atomic",
      "parent_router": `router-${subcategory}-001`,
      "category": "tool",
      "subcategory": subcategory,
      "version": 1,
      "status": "stable",
      "priority": priority,
      "triggers": [`use ${subcategory}`, `run ${subcategory}`, `execute ${subcategory}`],
      "activation_threshold": parseFloat(activation_threshold),
      "routing_strategy": "tool_augmented",
      "requires_context": true,
      "requires_memory": false,
      "requires_tools": true,
      "tool_dependencies": [`${subcategory}_tool`],
      "clarifying_questions": [],
      "response_template": toolTemplates[Math.floor(Math.random() * toolTemplates.length)],
      "fallback_intents": ["router-tool-001"],
      "child_intents": [],
      "examples": [],
      "failure_cases": [],
      "confidence": parseFloat(confidence),
      "success_rate": parseFloat(success_rate),
      "failure_rate": parseFloat(failure_rate),
      "execution_cost": 3,
      "token_cost": 5,
      "reward_score": 0,
      "penalty_score": 0,
      "source": "tool_atomic_v1",
      "created": "2026-06-23",
      "last_updated": "2026-06-23"
    });
  }
  return tools;
};

const reasoningData = generateReasoning(500);
const toolsData = generateTools(500);

fs.writeFileSync('reasoning_batch_1.json', JSON.stringify(reasoningData, null, 2));
fs.writeFileSync('tools_batch_1.json', JSON.stringify(toolsData, null, 2));

console.log('Generated 500 reasoning and 500 tools parameters successfully.');
