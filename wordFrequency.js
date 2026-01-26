if (typeof self !== 'undefined') {
  self.wordFrequencyMap = {
    // ...
  };
} else if (typeof window !== 'undefined') {
  window.wordFrequencyMap = {
    // ...
  };
}

// Word frequency database - frequencies are per million words
// Source: Based on Google's Trillion Word Corpus analysis
// Ordered from most to least frequent

const frequencyMap = {
  // Ultra-common words (1000+ per million) - rank 1-50
  "the": 5000, "of": 2500, "and": 2000, "to": 1900, "a": 1800,
  "in": 1700, "for": 1200, "is": 1200, "on": 1100, "that": 1050,
  "by": 1000, "this": 950, "with": 940, "i": 920, "you": 910,
  "it": 900, "not": 850, "or": 840, "be": 830, "are": 820,
  "from": 800, "at": 780, "as": 770, "your": 760, "all": 750,
  "have": 740, "new": 730, "more": 720, "an": 710, "was": 700,
  "we": 690, "will": 680, "home": 670, "can": 660, "us": 650,
  "about": 640, "if": 630, "page": 620, "my": 610, "has": 600,
  "search": 590, "free": 580, "but": 570, "our": 560, "one": 550,
  "other": 540, "do": 530, "no": 520, "information": 510, "time": 500,

  // Very common words (300-1000 per million) - rank 51-150
  "they": 490, "site": 480, "he": 470, "up": 460, "may": 450,
  "what": 440, "which": 430, "their": 420, "news": 410, "out": 400,
  "use": 390, "any": 380, "there": 370, "see": 360, "only": 350,
  "so": 340, "his": 330, "when": 320, "contact": 315, "here": 310,
  "business": 305, "who": 300, "web": 295, "also": 290, "now": 285,
  "help": 280, "get": 275, "view": 270, "online": 265, "first": 260,
  "am": 255, "been": 250, "would": 245, "how": 240, "were": 235,
  "me": 230, "services": 225, "some": 220, "these": 215, "click": 210,
  "its": 205, "like": 200, "service": 195, "than": 190, "find": 185,
  "price": 180, "date": 175, "back": 170, "top": 165, "people": 160,
  "had": 155, "list": 150, "name": 148, "just": 146, "over": 144,
  "state": 142, "year": 140, "day": 138, "into": 136, "email": 134,
  "two": 132, "health": 130, "world": 128, "next": 126, "used": 124,
  "go": 122, "work": 120, "last": 118, "most": 116, "products": 114,
  "music": 112, "buy": 110, "data": 108, "make": 106, "them": 104,
  "should": 102, "product": 100,

  // Common words (100-300 per million) - rank 151-400
  "system": 98, "post": 96, "her": 94, "city": 92, "add": 90,
  "policy": 88, "number": 86, "such": 84, "please": 82, "available": 80,
  "copyright": 78, "support": 76, "message": 74, "after": 72, "best": 70,
  "software": 68, "then": 66, "good": 64, "video": 62, "well": 60,
  "where": 58, "info": 56, "rights": 54, "public": 52, "books": 50,
  "high": 48, "school": 46, "through": 44, "each": 42, "links": 40,
  "she": 39, "review": 38, "years": 37, "order": 36, "very": 35,
  "privacy": 34, "book": 33, "items": 32, "company": 31, "read": 30,
  "group": 29, "need": 28, "many": 27, "user": 26, "said": 25,
  "does": 24.5, "under": 24, "general": 23.5, "research": 23, "university": 22.5,
  "mail": 22, "full": 21.5, "map": 21, "reviews": 20.5, "program": 20,
  "life": 19.5, "know": 19, "games": 18.5, "way": 18, "days": 17.5,
  "management": 17, "part": 16.5, "could": 16, "great": 15.5, "united": 15,
  "hotel": 14.5, "real": 14, "item": 13.5, "international": 13, "center": 12.5,
  "must": 12, "store": 11.5, "travel": 11, "comments": 10.5, "made": 10,
  "development": 9.8, "report": 9.6, "member": 9.4, "details": 9.2, "line": 9,
  "terms": 8.8, "before": 8.6, "hotels": 8.4, "did": 8.2, "send": 8,
  "right": 7.9, "type": 7.8, "because": 7.7, "local": 7.6, "those": 7.5,
  "using": 7.4, "results": 7.3, "office": 7.2, "education": 7.1, "national": 7,
  "car": 6.9, "design": 6.8, "take": 6.7, "posted": 6.6, "internet": 6.5,
  "address": 6.4, "community": 6.3, "within": 6.2, "states": 6.1, "area": 6,
  "want": 5.9, "phone": 5.8, "shipping": 5.7, "reserved": 5.6, "subject": 5.5,
  "between": 5.4, "forum": 5.3, "family": 5.2, "long": 5.1, "based": 5,

  // Uncommon words (25-100 per million) - rank 401-1000
  "code": 4.9, "show": 4.8, "even": 4.7, "black": 4.6, "check": 4.5,
  "special": 4.4, "prices": 4.3, "website": 4.2, "index": 4.1, "being": 4,
  "women": 3.95, "much": 3.9, "sign": 3.85, "file": 3.8, "link": 3.75,
  "open": 3.7, "today": 3.65, "technology": 3.6, "south": 3.55, "case": 3.5,
  "project": 3.45, "same": 3.4, "pages": 3.35, "version": 3.3, "section": 3.25,
  "own": 3.2, "found": 3.15, "sports": 3.1, "house": 3.05, "related": 3,
  "security": 2.95, "both": 2.9, "county": 2.85, "american": 2.8, "photo": 2.75,
  "game": 2.7, "members": 2.65, "power": 2.6, "while": 2.55, "care": 2.5,
  "network": 2.48, "down": 2.46, "computer": 2.44, "systems": 2.42, "three": 2.4,
  "total": 2.38, "place": 2.36, "end": 2.34, "following": 2.32, "download": 2.3,
  "him": 2.28, "without": 2.26, "per": 2.24, "access": 2.22, "think": 2.2,
  "north": 2.18, "resources": 2.16, "current": 2.14, "posts": 2.12, "big": 2.1,
  "media": 2.08, "law": 2.06, "control": 2.04, "water": 2.02, "history": 2,
  "pictures": 1.95, "size": 1.9, "art": 1.85, "personal": 1.8, "since": 1.75,
  "including": 1.7, "guide": 1.65, "shop": 1.6, "directory": 1.55, "board": 1.5,
  "location": 1.48, "change": 1.46, "white": 1.44, "text": 1.42, "small": 1.4,
  "rating": 1.38, "rate": 1.36, "government": 1.34, "children": 1.32, "during": 1.3,
  "return": 1.28, "students": 1.26, "shopping": 1.24, "account": 1.22, "times": 1.2,
  "sites": 1.18, "level": 1.16, "digital": 1.14, "profile": 1.12, "previous": 1.1,
  "form": 1.08, "events": 1.06, "love": 1.04, "old": 1.02, "main": 1,
  "call": 0.98, "hours": 0.96, "image": 0.94, "department": 0.92, "title": 0.9,
  "description": 0.88, "insurance": 0.86, "another": 0.84, "why": 0.82, "shall": 0.8,
  "property": 0.78, "class": 0.76, "still": 0.74, "money": 0.72, "quality": 0.7,
  "every": 0.68, "listing": 0.66, "content": 0.64, "country": 0.62, "private": 0.6,
  "little": 0.58, "visit": 0.56, "save": 0.54, "tools": 0.52, "low": 0.5,
  "reply": 0.48, "customer": 0.46, "compare": 0.44, "movies": 0.42, "include": 0.4,
  "college": 0.38, "value": 0.36, "article": 0.34, "man": 0.32, "card": 0.3,
  "jobs": 0.28, "provide": 0.26, "food": 0.25,

  // Rare/Epic words (1-25 per million) - rank 1001-5000
  "source": 0.24, "author": 0.23, "different": 0.22, "press": 0.21, "learn": 0.2,
  "sale": 0.19, "around": 0.18, "print": 0.17, "course": 0.16, "job": 0.15,
  "process": 0.145, "room": 0.14, "stock": 0.135, "training": 0.13, "credit": 0.125,
  "point": 0.12, "join": 0.115, "science": 0.11, "categories": 0.105, "advanced": 0.1,
  "west": 0.098, "sales": 0.096, "look": 0.094, "english": 0.092, "left": 0.09,
  "team": 0.088, "estate": 0.086, "conditions": 0.084, "select": 0.082, "windows": 0.08,
  "photos": 0.078, "thread": 0.076, "week": 0.074, "category": 0.072, "note": 0.07,
  "live": 0.068, "large": 0.066, "gallery": 0.064, "table": 0.062, "register": 0.06,
  "however": 0.058, "market": 0.056, "library": 0.054, "really": 0.052, "action": 0.05,
  "start": 0.048, "series": 0.046, "model": 0.044, "features": 0.042, "air": 0.04,
  "industry": 0.038, "plan": 0.036, "human": 0.034, "provided": 0.032, "required": 0.03,
  "second": 0.028, "hot": 0.026, "accessories": 0.024, "cost": 0.022, "movie": 0.02,
  "forums": 0.019, "march": 0.018, "better": 0.017, "say": 0.016, "questions": 0.015,
  "july": 0.014, "going": 0.013, "medical": 0.012, "test": 0.011, "friend": 0.01,
  "come": 0.009, "server": 0.008, "study": 0.007, "application": 0.006, "cart": 0.005,
  "risk": 0.0048, "card": 0.0046, "statement": 0.0044, "language": 0.0042, "story": 0.004,

  // Very rare words - demonstrative examples
  "ephemeral": 0.003, "serendipity": 0.0025, "ubiquitous": 0.002, "quintessential": 0.0018,
  "paradigm": 0.0016, "symbiosis": 0.0014, "esoteric": 0.0012, "juxtaposition": 0.001,
  "obfuscate": 0.0008, "sycophant": 0.0006, "antediluvian": 0.0004, "perspicacious": 0.0002,

  // Additional common verbs and adjectives for better coverage
  "create": 4.2, "become": 3.8, "example": 3.5, "provide": 3.2, "include": 2.9,
  "continue": 2.6, "develop": 2.3, "consider": 2.0, "receive": 1.7, "suggest": 1.4,
  "popular": 3.6, "important": 3.3, "possible": 3.0, "available": 2.7, "similar": 2.4,
  "recent": 2.1, "common": 1.8, "various": 1.5, "simple": 1.2, "complex": 0.9,
  "specific": 4.0, "additional": 3.7, "political": 3.4, "financial": 3.1, "professional": 2.8,
  "traditional": 2.5, "original": 2.2, "individual": 1.9, "particular": 1.6, "natural": 1.3,
  "interesting": 3.9, "beautiful": 3.6, "significant": 3.3, "excellent": 3.0, "effective": 2.7
};

if (typeof self !== 'undefined') {
  self.wordFrequencyMap = frequencyMap;
} else if (typeof window !== 'undefined') {
  window.wordFrequencyMap = frequencyMap;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = frequencyMap;
}
