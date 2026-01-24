// Astronomy API (Solar System OpenData Integration + Local Fallback)
// Uses API for Solar System bodies, Local for Stars/Constellations

const CELESTIAL_BODIES = {
  // Local Fallback / Stars (API mainly covers Solar System)
  "sun": { type: "Star", rarity: "common", origin: "The star around which the earth orbits." },
  "star": { type: "Celestial Body", rarity: "common", origin: "A fixed luminous point in the night sky." },
  "galaxy": { type: "System", rarity: "uncommon", origin: "A system of millions or billions of stars, together with gas and dust." },
  "nebula": { type: "Cloud", rarity: "epic", origin: "A giant cloud of dust and gas in space." },
  "comet": { type: "Body", rarity: "rare", origin: "A celestial object consisting of a nucleus of ice and dust." },
  "asteroid": { type: "Body", rarity: "uncommon", origin: "A small rocky body orbiting the sun." },
  "blackhole": { type: "Singularity", rarity: "mythic", origin: "A region of space having a gravitational field so intense that no matter or radiation can escape." },
  "supernova": { type: "Explosion", rarity: "legendary", origin: "A star that suddenly increases greatly in brightness because of a catastrophic explosion." },
  "quasar": { type: "AGN", rarity: "mythic", origin: "A massive and extremely remote celestial object, emitting exceptionally large amounts of energy." },
  "constellation": { type: "Grouping", rarity: "uncommon", origin: "A group of stars forming a recognizable pattern." }
};

const CONSTELLATIONS = [
  "orion", "ursa major", "ursa minor", "cassiopeia", "scorpius", "sagittarius", 
  "leo", "gemini", "taurus", "andromeda", "pegasus", "draco"
];

const AstroAPI = {
  lookup: async function(word) {
    const lower = word.toLowerCase();
    
    // 1. Check Local DB first (Stars, Phenomena, etc)
    if (CELESTIAL_BODIES[lower]) {
      const body = CELESTIAL_BODIES[lower];
      return {
        origin: `${body.type}\n${body.origin}`,
        rarity: body.rarity,
        tags: ["astro", "noun", body.type.toLowerCase()],
        frequency: 0.1,
        source: "astro_api_local",
        data: body
      };
    }

    if (CONSTELLATIONS.includes(lower)) {
       return {
         origin: "A constellation of stars.",
         rarity: "epic",
         tags: ["astro", "noun", "constellation"],
         frequency: 0.05,
         source: "astro_api_local"
       };
    }

    // 2. Check Solar System OpenData API (Planets, Moons)
    try {
        if (word.length < 3) return null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const apiKey = (typeof CONFIG !== 'undefined' && CONFIG.ASTRO_API_KEY) ? CONFIG.ASTRO_API_KEY : null;
        const headers = {};
        if (apiKey) {
        }

        const url = `https://api.le-systeme-solaire.net/rest/bodies/${encodeURIComponent(lower)}`;
        
        const reqOptions = { signal: controller.signal };
        if (apiKey) {
             reqOptions.headers = { 'Authorization': `Bearer ${apiKey}` };
        }

        const res = await fetch(url, reqOptions);
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            
            // Determine rarity based on body type
            let rarity = 'common';
            const type = (data.bodyType || "").toLowerCase();
            
            if (type.includes('planet')) rarity = 'uncommon';
            if (type.includes('dwarf')) rarity = 'rare';
            if (type.includes('asteroid')) rarity = 'uncommon';
            if (type.includes('moon')) rarity = 'rare';
            if (type.includes('comet')) rarity = 'epic';
            
            // Major planets override
            if (['earth', 'mars', 'venus', 'jupiter', 'saturn'].includes(data.englishName.toLowerCase())) {
                rarity = 'rare'; // Make them a bit special
            }

            return {
                origin: `Celestial Body: ${data.englishName}\nType: ${data.bodyType}\nGravity: ${data.gravity} m/s²\nMean Radius: ${data.meanRadius} km`,
                rarity: rarity,
                tags: ["astro", "noun", type.replace(/\s+/g, '')],
                frequency: 0.05,
                source: "solar_system_api",
                data: data
            };
        }
    } catch (e) {
        console.log("Astro API error:", e);
    }

    return null;
  }
};

if (typeof self !== 'undefined') self.AstroAPI = AstroAPI;
if (typeof window !== 'undefined') window.AstroAPI = AstroAPI;
