// Bio API Integration using GBIF (Global Biodiversity Information Facility)
// Dynamically fetches taxonomic data for biological terms.

const BioAPI = {
  // Map taxonomic ranks to Lingomon rarities
  rankToRarity: {
    "KINGDOM": "common",
    "PHYLUM": "common",
    "CLASS": "uncommon",
    "ORDER": "uncommon",
    "FAMILY": "rare",
    "GENUS": "epic",
    "SPECIES": "legendary",
    "SUBSPECIES": "mythic"
  },

  // Lookup a word in the GBIF taxonomy backbone
  lookup: async function(word) {
    try {
      // Basic validation to avoid spamming API with obviously non-bio words
      if (!word || word.length < 3 || /[^a-zA-Z]/.test(word)) return null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Use the 'match' endpoint for fuzzy/best matching
      const url = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(word)}`;
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.log(`GBIF API Error: ${res.status}`);
        return null;
      }

      const data = await res.json();
      
      // Validation Logic
      // 1. matchType must not be NONE
      // 2. confidence should be reasonably high (e.g., > 80) to avoid false positives
      // 3. Must belong to a major kingdom (Animalia, Plantae, Fungi, etc.) to filter out noise
      
      if (data.matchType === "NONE" || data.confidence < 85) {
        return null;
      }

      // Filter: Ensure it has a kingdom defined
      if (!data.kingdom) {
        return null;
      }

      // Calculate Rarity based on Rank
      const rank = (data.rank || "").toUpperCase();
      const rarity = this.rankToRarity[rank] || "rare";

      // Build Origin/Definition Text
      let originText = `Scientific Name: ${data.scientificName}\n`;
      originText += `Rank: ${data.rank ? data.rank.toLowerCase() : 'Unknown'}\n`;
      originText += `Kingdom: ${data.kingdom}`;
      
      if (data.phylum) originText += ` > ${data.phylum}`;
      if (data.class) originText += ` > ${data.class}`;
      if (data.order) originText += ` > ${data.order}`;
      if (data.family) originText += ` > ${data.family}`;

      // Construct Tags
      const tags = ["bio", "noun"];
      if (data.kingdom) tags.push(data.kingdom.toLowerCase());
      
      console.log(`BioAPI: Found "${word}" -> ${data.scientificName} (${rank})`);

      return {
        origin: originText,
        rarity: rarity,
        tags: tags,
        frequency: 0.05, // Bio terms are generally rarer in common speech
        source: "gbif_api"
      };

    } catch (err) {
      console.error(`BioAPI Lookup Error for "${word}":`, err);
      return null;
    }
  }
};

// Export for browser/worker environment
if (typeof self !== 'undefined') {
  self.BioAPI = BioAPI;
}
if (typeof window !== 'undefined') {
  window.BioAPI = BioAPI;
}
