// Technical Dictionary for IT and Biological Terms
// Now includes Stack Exchange API integration for dynamic lookup

const TECHNICAL_DATA = {
  // IT / Tech Terms (Static Fallback / High Priority Overrides)
  "algorithm": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A set of rules to be followed in calculations." },
  "api": { rarity: "common", tags: ["tech", "noun"], origin: "Application Programming Interface." },
  "backend": { rarity: "uncommon", tags: ["tech", "noun", "adjective"], origin: "The server-side of a software application." },
  "bandwidth": { rarity: "uncommon", tags: ["tech", "noun"], origin: "Maximum data transfer rate of a network." },
  "binary": { rarity: "uncommon", tags: ["tech", "noun", "adjective"], origin: "Relating to, using, or expressed in a system of numerical notation that has 2 rather than 10 as a base." },
  "bit": { rarity: "common", tags: ["tech", "noun"], origin: "The smallest unit of data in a computer." },
  "bug": { rarity: "common", tags: ["tech", "noun"], origin: "An error, flaw or fault in the design, development, or operation of computer software." },
  "byte": { rarity: "common", tags: ["tech", "noun"], origin: "A group of binary digits or bits (usually eight) operated on as a unit." },
  "cache": { rarity: "uncommon", tags: ["tech", "noun", "verb"], origin: "Hardware or software component that stores data so that future requests for that data can be served faster." },
  "cloud": { rarity: "common", tags: ["tech", "noun"], origin: "Servers that are accessed over the Internet, and the software and databases that run on those servers." },
  "code": { rarity: "common", tags: ["tech", "noun", "verb"], origin: "Instructions for a computer." },
  "compiler": { rarity: "rare", tags: ["tech", "noun"], origin: "A program that translates computer code written in one programming language into another language." },
  "cookie": { rarity: "common", tags: ["tech", "noun"], origin: "A small piece of data stored on the user's computer by the web browser." },
  "cyber": { rarity: "uncommon", tags: ["tech", "adjective"], origin: "Relating to or characteristic of the culture of computers, information technology, and virtual reality." },
  "data": { rarity: "common", tags: ["tech", "noun"], origin: "Facts and statistics collected together for reference or analysis." },
  "database": { rarity: "uncommon", tags: ["tech", "noun"], origin: "An organized collection of structured information, or data." },
  "debug": { rarity: "rare", tags: ["tech", "verb"], origin: "The process of identifying and removing errors from computer hardware or software." },
  "encryption": { rarity: "rare", tags: ["tech", "noun"], origin: "The process of encoding information." },
  "ethernet": { rarity: "rare", tags: ["tech", "noun"], origin: "A system for connecting a number of computer systems to form a local area network." },
  "firewall": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A network security system that monitors and controls incoming and outgoing network traffic." },
  "frontend": { rarity: "uncommon", tags: ["tech", "noun", "adjective"], origin: "The client-side of a software application." },
  "gigabyte": { rarity: "rare", tags: ["tech", "noun"], origin: "A unit of information equal to one billion (10^9) or 2^30 bytes." },
  "hacker": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A person who uses computers to gain unauthorized access to data." },
  "hardware": { rarity: "common", tags: ["tech", "noun"], origin: "The physical parts of a computer." },
  "html": { rarity: "uncommon", tags: ["tech", "noun"], origin: "HyperText Markup Language." },
  "internet": { rarity: "common", tags: ["tech", "noun"], origin: "A global computer network providing a variety of information and communication facilities." },
  "java": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A high-level, class-based, object-oriented programming language." },
  "javascript": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A programming language that is one of the core technologies of the World Wide Web." },
  "kernel": { rarity: "rare", tags: ["tech", "noun"], origin: "The core of an operating system." },
  "linux": { rarity: "rare", tags: ["tech", "noun"], origin: "An open-source Unix-like operating system kernel." },
  "malware": { rarity: "rare", tags: ["tech", "noun"], origin: "Software that is specifically designed to disrupt, damage, or gain unauthorized access to a computer system." },
  "memory": { rarity: "common", tags: ["tech", "noun"], origin: "The faculty by which the mind stores and remembers information; in computing, physical devices used to store programs or data." },
  "network": { rarity: "common", tags: ["tech", "noun"], origin: "A group or system of interconnected people or things." },
  "pixel": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A minute area of illumination on a display screen, one of many from which an image is composed." },
  "platform": { rarity: "common", tags: ["tech", "noun"], origin: "A group of technologies that are used as a base upon which other applications, processes or technologies are developed." },
  "program": { rarity: "common", tags: ["tech", "noun", "verb"], origin: "Provide (a computer or other machine) with coded instructions for the automatic performance of a particular task." },
  "protocol": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A set of rules governing the exchange or transmission of data between devices." },
  "python": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A high-level general-purpose programming language." },
  "router": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A device that forwards data packets between computer networks." },
  "script": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A program or sequence of instructions that is interpreted or carried out by another program." },
  "server": { rarity: "common", tags: ["tech", "noun"], origin: "A computer or computer program that manages access to a centralized resource or service in a network." },
  "software": { rarity: "common", tags: ["tech", "noun"], origin: "The programs and other operating information used by a computer." },
  "source": { rarity: "common", tags: ["tech", "noun"], origin: "A place, person, or thing from which something comes or can be obtained." },
  "sql": { rarity: "rare", tags: ["tech", "noun"], origin: "Structured Query Language." },
  "stack": { rarity: "common", tags: ["tech", "noun"], origin: "An abstract data type that serves as a collection of elements." },
  "syntax": { rarity: "rare", tags: ["tech", "noun"], origin: "The arrangement of words and phrases to create well-formed sentences in a language." },
  "terminal": { rarity: "uncommon", tags: ["tech", "noun"], origin: "An electronic or electromechanical hardware device that is used for entering data into, and displaying data from, a computer or a computing system." },
  "token": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A thing serving as a visible or tangible representation of a fact, quality, feeling, etc." },
  "url": { rarity: "uncommon", tags: ["tech", "noun"], origin: "Uniform Resource Locator." },
  "user": { rarity: "common", tags: ["tech", "noun"], origin: "A person who uses or operates something, especially a computer or other machine." },
  "variable": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A data item that may take on more than one value during the runtime of a program." },
  "vector": { rarity: "rare", tags: ["tech", "noun"], origin: "A quantity having direction as well as magnitude, especially as determining the position of one point in space relative to another." },
  "virus": { rarity: "uncommon", tags: ["tech", "noun"], origin: "A piece of code that is capable of copying itself and typically has a detrimental effect, such as corrupting the system or destroying data." },
  "web": { rarity: "common", tags: ["tech", "noun"], origin: "The World Wide Web." },
  "wifi": { rarity: "common", tags: ["tech", "noun"], origin: "A facility allowing computers, smartphones, or other devices to connect to the Internet or communicate with one another wirelessly within a particular area." },
  "window": { rarity: "common", tags: ["tech", "noun"], origin: "A rectangular section of the computer's display in a graphical user interface." }
};

// Heuristic Patterns
const PATTERNS = [
  { regex: /.*script$/, tag: "tech", rarity: "uncommon" },
  { regex: /^cyber.*/, tag: "tech", rarity: "uncommon" },
  { regex: /^micro.*/, tag: "tech", rarity: "uncommon" },
  { regex: /.*ware$/, tag: "tech", rarity: "uncommon" } // software, malware, firmware
];

const TechAPI = {
  // Common English words to avoid looking up on StackOverflow (to save API quota and avoid false positives)
  commonWords: new Set([
      'the', 'and', 'for', 'with', 'table', 'date', 'string', 'value', 'type', 'list', 'map', 'set', 'tree', 'graph', 'view', 'model', 'control', 'text', 'file', 'code', 'data', 'input', 'output',
      // Exclude Project Moon names from StackOverflow lookup to ensure Easter Egg precedence
      'sinclair', 'dante', 'gregor', 'ishmael', 'faust', 'heathcliff'
  ]),

  lookup: async function(word) {
    const lower = word.toLowerCase();
    
    // 1. Check Local Static Data (Fastest)
    if (TECHNICAL_DATA[lower]) {
      return {
        frequency: 0.5,
        source: 'tech_api_local',
        ...TECHNICAL_DATA[lower]
      };
    }
    
    // 2. Pattern match (Fast)
    for (const p of PATTERNS) {
      if (p.regex.test(lower)) {
        return {
          rarity: p.rarity,
          tags: [p.tag, "noun"],
          origin: "A specialized technical term.",
          frequency: 0.1,
          source: 'tech_pattern'
        };
      }
    }

    // 3. Stack Exchange API (Dynamic / Live)
    // Only fetch if it's NOT a very common word (unless it's strictly technical)
    if (!this.commonWords.has(lower) && word.length > 2) {
      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          
          // Use the Tags API to check if this is a recognized tech term
          const url = `https://api.stackexchange.com/2.3/tags/${encodeURIComponent(lower)}/info?site=stackoverflow`;
          
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (res.ok) {
              const data = await res.json();
              if (data.items && data.items.length > 0) {
                  const tagInfo = data.items[0];
                  
                  // Rarity based on tag usage count on StackOverflow
                  // More usage = More common in TECH (but maybe rare in English?)
                  // Actually, for a "Catching" game:
                  // High usage (Java) = Common/Uncommon
                  // Low usage (obscure lib) = Rare/Epic
                  let rarity = 'common';
                  const count = tagInfo.count;
                  
                  if (count < 1000) rarity = 'mythic';
                  else if (count < 10000) rarity = 'legendary';
                  else if (count < 50000) rarity = 'epic';
                  else if (count < 200000) rarity = 'rare';
                  else if (count < 1000000) rarity = 'uncommon';
                  
                  return {
                      origin: `Technical Term (StackOverflow)\nTagged ${count} times.\nCategory: Tech`,
                      rarity: rarity,
                      tags: ["tech", "noun"], // Assume noun for tags
                      frequency: 0.1,
                      source: 'stack_exchange_api',
                      data: tagInfo
                  };
              }
          } else if (res.status === 400 || res.status === 403 || res.status === 429) {
              // Rate limit hit or bad request -> Fail silently to fallback
              console.log("StackExchange API limit/error:", res.status);
          }
      } catch (e) {
          console.log("StackExchange API error:", e);
      }
    }
    
    return null;
  }
};

// Export for browser/worker environment
if (typeof self !== 'undefined') {
  self.TechAPI = TechAPI;
}
if (typeof window !== 'undefined') {
  window.TechAPI = TechAPI;
}
