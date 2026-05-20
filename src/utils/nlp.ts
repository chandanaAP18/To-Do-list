// NLP parser to extract reminders and tasks from text commands
export interface ParsedTask {
  title: string;
  dueDate: string; // ISO string
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export function parseNaturalLanguageTask(text: string): ParsedTask | null {
  const normalized = text.toLowerCase().trim();
  
  // Basic structures in EN/TE/FR/DE
  
  let taskTitle = "";
  let targetDate = new Date();
  let priority: 'low' | 'medium' | 'high' = 'medium';
  let category = "General";

  // Check for priority indicators (English, German, French)
  if (
    normalized.includes("urgent") || normalized.includes("important") || normalized.includes("asap") ||
    normalized.includes("dringend") || normalized.includes("wichtig") ||
    normalized.includes("urgente") || normalized.includes("prioritaire")
  ) {
    priority = 'high';
  } else if (
    normalized.includes("whenever") || normalized.includes("low priority") ||
    normalized.includes("niedrig") || normalized.includes("basse")
  ) {
    priority = 'low';
  }

  // Check for categories (English, German, French)
  if (
    normalized.includes("study") || normalized.includes("exam") || normalized.includes("homework") ||
    normalized.includes("lernen") || normalized.includes("hausaufgaben") ||
    normalized.includes("étudier") || normalized.includes("devoirs")
  ) {
    category = "Study";
  } else if (
    normalized.includes("buy") || normalized.includes("groceries") || normalized.includes("shopping") ||
    normalized.includes("kaufen") || normalized.includes("einkaufen") ||
    normalized.includes("acheter") || normalized.includes("courses")
  ) {
    category = "Personal";
  } else if (
    normalized.includes("meeting") || normalized.includes("work") || normalized.includes("call") ||
    normalized.includes("arbeit") || normalized.includes("besprechung") ||
    normalized.includes("réunion") || normalized.includes("travail")
  ) {
    category = "Work";
  }

  // Parse time e.g., "7 pm", "8:30 am", "19:00", "19h"
  let hours = 9; // default 9 AM
  let minutes = 0;
  
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm|h)?/i;
  const timeMatch = normalized.match(timeRegex);
  
  // Check for days: "tomorrow", "today", "next week" (English, French, German)
  let daysToAdd = 0;
  if (normalized.includes("tomorrow") || normalized.includes("demain") || normalized.includes("morgen")) {
    daysToAdd = 1;
  } else if (normalized.includes("day after tomorrow") || normalized.includes("après-demain") || normalized.includes("übermorgen")) {
    daysToAdd = 2;
  } else if (normalized.includes("next week") || normalized.includes("semaine prochaine") || normalized.includes("nächste woche")) {
    daysToAdd = 7;
  } else {
    // Weekdays in English, German, French
    const weekdays = [
      ["sunday", "sonntag", "dimanche"],
      ["monday", "montag", "lundi"],
      ["tuesday", "dienstag", "mardi"],
      ["wednesday", "mittwoch", "mercredi"],
      ["thursday", "donnerstag", "jeudi"],
      ["friday", "freitag", "vendredi"],
      ["saturday", "samstag", "samedi"]
    ];
    for (let i = 0; i < weekdays.length; i++) {
      if (weekdays[i].some(day => normalized.includes(day))) {
        const currentDay = targetDate.getDay();
        const targetDay = i;
        daysToAdd = (targetDay - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; 
        break;
      }
    }
  }

  // Calculate the target Date
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  // Set the hours and minutes
  if (timeMatch) {
    let parsedHour = parseInt(timeMatch[1], 10);
    const parsedMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    if (ampm === 'pm' && parsedHour < 12) {
      parsedHour += 12;
    } else if (ampm === 'am' && parsedHour === 12) {
      parsedHour = 0;
    }
    
    hours = parsedHour;
    minutes = parsedMin;
  }
  
  targetDate.setHours(hours, minutes, 0, 0);

  // Extract Task Title
  let cleanText = normalized
    // English
    .replace(/remind me/g, "")
    .replace(/to\s+/, "")
    .replace(/tomorrow/g, "")
    .replace(/today/g, "")
    .replace(/next week/g, "")
    // French
    .replace(/rappelle-moi/g, "")
    .replace(/de\s+/, "")
    .replace(/à\s+/, "")
    .replace(/demain/g, "")
    .replace(/aujourd'hui/g, "")
    .replace(/semaine prochaine/g, "")
    // German
    .replace(/erinnere mich/g, "")
    .replace(/zu\s+/, "")
    .replace(/um\s+/, "")
    .replace(/morgen/g, "")
    .replace(/heute/g, "")
    .replace(/nächste woche/g, "")
    // Time regexes
    .replace(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/gi, "")
    .replace(/on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // If title was stripped completely, default to the original normalized text
  if (cleanText.length < 3) {
    cleanText = text;
  } else {
    // Capitalize first letter
    cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
  }

  taskTitle = cleanText;

  return {
    title: taskTitle,
    dueDate: targetDate.toISOString(),
    priority,
    category
  };
}
