// Chemistry API (PubChem Integration + Local Elements)
// periodic table doesn't change, so we keep it local for speed.
// Compounds are fetched dynamically from PubChem.

const ELEMENTS = {
  "hydrogen": { symbol: "H", number: 1, mass: 1.008, group: "Nonmetal", rarity: "common" },
  "helium": { symbol: "He", number: 2, mass: 4.0026, group: "Noble Gas", rarity: "common" },
  "lithium": { symbol: "Li", number: 3, mass: 6.94, group: "Alkali Metal", rarity: "uncommon" },
  "beryllium": { symbol: "Be", number: 4, mass: 9.0122, group: "Alkaline Earth Metal", rarity: "rare" },
  "boron": { symbol: "B", number: 5, mass: 10.81, group: "Metalloid", rarity: "uncommon" },
  "carbon": { symbol: "C", number: 6, mass: 12.011, group: "Nonmetal", rarity: "common" },
  "nitrogen": { symbol: "N", number: 7, mass: 14.007, group: "Nonmetal", rarity: "common" },
  "oxygen": { symbol: "O", number: 8, mass: 15.999, group: "Nonmetal", rarity: "common" },
  "fluorine": { symbol: "F", number: 9, mass: 18.998, group: "Halogen", rarity: "uncommon" },
  "neon": { symbol: "Ne", number: 10, mass: 20.180, group: "Noble Gas", rarity: "uncommon" },
  "sodium": { symbol: "Na", number: 11, mass: 22.990, group: "Alkali Metal", rarity: "common" },
  "magnesium": { symbol: "Mg", number: 12, mass: 24.305, group: "Alkaline Earth Metal", rarity: "common" },
  "aluminum": { symbol: "Al", number: 13, mass: 26.982, group: "Post-Transition Metal", rarity: "common" },
  "silicon": { symbol: "Si", number: 14, mass: 28.085, group: "Metalloid", rarity: "common" },
  "phosphorus": { symbol: "P", number: 15, mass: 30.974, group: "Nonmetal", rarity: "uncommon" },
  "sulfur": { symbol: "S", number: 16, mass: 32.06, group: "Nonmetal", rarity: "uncommon" },
  "chlorine": { symbol: "Cl", number: 17, mass: 35.45, group: "Halogen", rarity: "common" },
  "argon": { symbol: "Ar", number: 18, mass: 39.948, group: "Noble Gas", rarity: "uncommon" },
  "potassium": { symbol: "K", number: 19, mass: 39.098, group: "Alkali Metal", rarity: "common" },
  "calcium": { symbol: "Ca", number: 20, mass: 40.078, group: "Alkaline Earth Metal", rarity: "common" },
  "titanium": { symbol: "Ti", number: 22, mass: 47.867, group: "Transition Metal", rarity: "rare" },
  "iron": { symbol: "Fe", number: 26, mass: 55.845, group: "Transition Metal", rarity: "common" },
  "copper": { symbol: "Cu", number: 29, mass: 63.546, group: "Transition Metal", rarity: "common" },
  "zinc": { symbol: "Zn", number: 30, mass: 65.38, group: "Transition Metal", rarity: "common" },
  "silver": { symbol: "Ag", number: 47, mass: 107.87, group: "Transition Metal", rarity: "rare" },
  "gold": { symbol: "Au", number: 79, mass: 196.97, group: "Transition Metal", rarity: "epic" },
  "mercury": { symbol: "Hg", number: 80, mass: 200.59, group: "Transition Metal", rarity: "rare" },
  "lead": { symbol: "Pb", number: 82, mass: 207.2, group: "Post-Transition Metal", rarity: "uncommon" },
  "uranium": { symbol: "U", number: 92, mass: 238.03, group: "Actinide", rarity: "epic" },
  "plutonium": { symbol: "Pu", number: 94, mass: 244, group: "Actinide", rarity: "legendary" }
};

const ChemAPI = {
  lookup: async function(word) {
    const lower = word.toLowerCase();
    
    // 1. Check Local Elements (Fast)
    if (ELEMENTS[lower]) {
      const el = ELEMENTS[lower];
      return {
        origin: `Element: ${word.charAt(0).toUpperCase() + word.slice(1)}\nSymbol: ${el.symbol}\nAtomic Number: ${el.number}\nGroup: ${el.group}\nMass: ${el.mass}`,
        rarity: el.rarity,
        tags: ["chem", "noun", "element"],
        frequency: 0.2,
        source: "chem_api_local",
        data: el
      };
    }

    // 2. Check PubChem API for Compounds (Async)
    try {
        // Skip short words or obvious non-chemicals to save bandwidth
        // Also skip 'sun' to avoid confusion with the Star
        if (word.length < 3 || lower === 'sun') return null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(lower)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`;
        
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data.PropertyTable && data.PropertyTable.Properties && data.PropertyTable.Properties.length > 0) {
                const prop = data.PropertyTable.Properties[0];
                
                // Determine rarity based on Molecular Weight (Just for fun/mechanic)
                // Heavier = Rarer? Or simple logic.
                const mw = parseFloat(prop.MolecularWeight);
                let rarity = 'uncommon';
                if (mw > 200) rarity = 'rare';
                if (mw > 500) rarity = 'epic';
                
                return {
                    origin: `Compound: ${prop.IUPACName || word}\nFormula: ${prop.MolecularFormula}\nWeight: ${prop.MolecularWeight}`,
                    rarity: rarity,
                    tags: ["chem", "noun", "compound"],
                    frequency: 0.1,
                    source: "pubchem_api",
                    data: prop
                };
            }
        }
    } catch (e) {
        console.log("PubChem API error:", e);
    }

    // 3. Fallback Heuristics
    if (lower.endsWith("ide") || lower.endsWith("ate") || lower.endsWith("ite") || lower.endsWith("acid")) {
       return {
         origin: "A chemical compound.",
         rarity: "uncommon",
         tags: ["chem", "noun"],
         frequency: 0.1,
         source: "chem_pattern"
       };
    }

    return null;
  }
};

if (typeof self !== 'undefined') self.ChemAPI = ChemAPI;
if (typeof window !== 'undefined') window.ChemAPI = ChemAPI;
