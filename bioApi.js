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

  // Ambiguous terms that are primarily Tech/Common but technically exist in Bio
  // We block these here so they fall through to TechAPI or Dictionary API
  ambiguousBlocklist: new Set([
      'python', 'java', 'ruby', 'rust', 'swift', 'shell', 'mouse', 'bug', 'virus', 'web', 'net', 'root', 'tree', 'monitor', 'ram', 'ant' 
  ]),

  // Lookup a word in the GBIF taxonomy backbone
  lookup: async function(word) {
    try {
      const lower = word.toLowerCase();
      
      // 0. Check Blocklist (Ambiguous Tech Terms)
      if (this.ambiguousBlocklist.has(lower)) {
          console.log(`BioAPI: Skipping ambiguous term "${word}" (reserved for Tech/Common)`);
          return null;
      }

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
      
      let pbdbData = null;
      
      // Parallel Check: Paleobiology Database (PBDB) for extinct/fossil context
      // Useful for "Deinosuchus", "Tyrannosaurus", etc.
      try {
          const pbdbController = new AbortController();
          const pbdbTimeout = setTimeout(() => pbdbController.abort(), 3000); // Fast timeout
          const pbdbUrl = `https://paleobiodb.org/data1.2/taxa/list.json?name=${encodeURIComponent(word)}&limit=1`;
          
          const pbdbRes = await fetch(pbdbUrl, { signal: pbdbController.signal });
          clearTimeout(pbdbTimeout);
          
          if (pbdbRes.ok) {
              const json = await pbdbRes.json();
              if (json.records && json.records.length > 0) {
                  pbdbData = json.records[0];
              }
          }
      } catch (e) {
          // PBDB failure is non-fatal
          console.log("PBDB check failed:", e);
      }

      // GBIF Validation
      if (data.matchType === "NONE" || data.confidence < 85) {
        // If GBIF failed but PBDB succeeded, we might still accept it as a fossil!
        if (pbdbData) {
            console.log("BioAPI: GBIF weak/none, but PBDB matched!", pbdbData);
            // Use PBDB data as primary
            const taxonRank = pbdbData.rnk ? getPbdbRankName(pbdbData.rnk) : 'taxon';
            const rarity = this.rankToRarity[taxonRank.toUpperCase()] || "epic";
            
            return {
                origin: `Prehistoric Life: ${pbdbData.nam} (${taxonRank})\nTime Period: ${formatPbdbInterval(pbdbData)}`,
                rarity: "legendary", // Fossils are cool
                tags: ["bio", "noun", "prehistoric", "fossil"],
                frequency: 0.01,
                source: "pbdb_api"
            };
        }
        return null;
      }

      // Filter: Ensure it has a kingdom defined
      if (!data.kingdom) {
        return null;
      }

      // Calculate Rarity based on Rank
      const rank = (data.rank || "").toUpperCase();
      let rarity = this.rankToRarity[rank] || "rare";

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
      
      // Merge PBDB data if available (Enrichment)
      if (pbdbData) {
          originText += `\n\n[Fossil Record Found]\nTime Period: ${formatPbdbInterval(pbdbData)}`;
          tags.push("prehistoric");
          rarity = "legendary"; // Boost rarity for fossils
      }
      
      console.log(`BioAPI: Found "${word}" -> ${data.scientificName} (${rank})`);

      return {
        origin: originText,
        rarity: rarity,
        tags: tags,
        frequency: 0.05, // Bio terms are generally rarer in common speech
        source: pbdbData ? "bio_api_fossil" : "gbif_api"
      };

    } catch (err) {
      console.error(`BioAPI Lookup Error for "${word}":`, err);
      return null;
    }
  }
};

// Helper to decode PBDB rank codes (integers)
function getPbdbRankName(code) {
    const ranks = { 3: "kingdom", 5: "phylum", 9: "class", 13: "order", 15: "family", 20: "genus", 23: "species" };
    return ranks[code] || "taxon";
}

function formatPbdbInterval(data) {
    return data.tei ? `${data.tei} - ${data.tli || 'Present'}` : "Prehistoric";
}

// Export for browser/worker environment
if (typeof self !== 'undefined') {
  self.BioAPI = BioAPI;
}
if (typeof window !== 'undefined') {
  window.BioAPI = BioAPI;
}
