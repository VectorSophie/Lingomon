# Lingomon - Gotta Catch 'Em All!

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub issues](https://img.shields.io/github/issues/VectorSophie/lingomon.svg)](https://github.com/VectorSophie/lingomon/issues)
[![GitHub stars](https://img.shields.io/github/stars/VectorSophie/lingomon.svg)](https://github.com/VectorSophie/lingomon/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

![Lingomon Icon](lingomon.png)

Welcome to Lingomon, the browser extension that turns vocabulary building into an adventure! Every new word you encounter becomes a collectible creature in your personal WordDex.

## What is Lingomon?

Lingomon is an educational browser extension that makes learning new words fun and engaging. As you browse the web, you can "catch" interesting words by right-clicking them. Each word has a rarity tier (just like your favorite collecting games!), complete with bright, colorful popups and a tier system that turns vocabulary building into an exciting journey.

## Features

- **Catch Words**: Right-click any word on any website to add it to your WordDex
- **Real Frequency-Based Rarity**: Words assigned tiers based on actual linguistic data from Datamuse API
  - Toggle between English and Korean UI
  - Korean-English dictionary lookup for Korean words
  - Automatic translation of English definitions to Korean
  - Translated badges and interface elements
- **Beautiful Popups(v1.6)**: Enjoy vibrant, color-coded notifications when you catch a new word
- **WordDex(v1.6)**: View your entire collection with frequency scores and rarity tiers
- **Dictionary Integration(v1.6)**: Get definitions and etymology for words you catch
- **Persistent Storage(v1.6)**: Your WordDex is saved locally and never lost
- **Dark Mode(v1.6)**: Toggle between light and dark themes
- **Statistics & Charts(v1.6)**: Track your collection with visual analytics
- **Badges & Achievements(v1.6)**: Unlock badges for milestones(Also find some secret easter eggs on the way!)
- **Daily Streaks(v1.6)**: Build vocabulary learning habits
- **Quiz Mode(v1.6)**: Test your knowledge of caught words
- **Multi-language Support(v1.7)**: English + Korean (**[Add your language!](https://github.com/VectorSophie/lingomon/issues/new?template=language_request.md)**)
- **Battle Mode(v1.8)**: Make teams of words you collected and battle active users
- **Profiles(v1.8)**: View your fellow catchers and battle them!
- **Context preservation(v1.8)**: Preserves where you caught the word
- **Custom tags(v1.8)**: You can tag and filter words as you want!
- **Cloud storage(v1.8)**: Now your data is secure and able to load everywhere!
- **Science Expansion(v1.8.1)**: Catch chemical elements, planets, and species to see real scientific data!
- **RPG Update(v1.8.2)**: 
  - **Evolution System:** Train words in quiz to level them up and evolve into stronger forms (Bronze ★, Silver ★★, Gold ★★★)!
  - **Daily Training:** Earn SRS (Spaced Repetition System) XP to make words battle-ready.
  - **Tech Cards 2.0:** Matrix-themed cards for programming terms, powered by Semantic Context7 AI.

## Want Your Language in Lingomon?

**No coding required!** Help me add support for your language:

1. Fill out the [Language Request Template](.github\ISSUE_TEMPLATE\language_request.md)
2. Research free dictionary APIs (I'll guide you!)
3. Submit as a [GitHub issue](https://github.com/VectorSophie/lingomon/issues/new?template=language_request.md)
4. I implement it and credit you!

**Priority Languages:** Spanish, French, German, Japanese, Portuguese, Arabic, Chinese, Hindi, Russian

See [How to Request a Language](.github\ISSUE_TEMPLATE\language_request.md) for detailed instructions.

## Installation

### From Web Store (Recommended)
- **Chrome/Edge/Brave:** Coming soon to Chrome Web Store
- **Firefox:** Coming soon to Firefox Add-ons

### From Source (Developers)
1. Download or clone this repository
   ```bash
   git clone https://github.com/VectorSophie/lingomon.git
   cd lingomon
   ```
2. Copy `config.example.js` to `config.js` (for Korean API support)
3. Open your browser's extension page:
   - Chrome: Navigate to `chrome://extensions/`
   - Firefox: Navigate to `about:debugging#/runtime/this-firefox`
   - Edge: Navigate to `edge://extensions/`
4. Enable "Developer mode" (toggle in the top right)
5. Click "Load unpacked" (Chrome/Edge) or "Load Temporary Add-on" (Firefox)
6. Select the Lingomon folder
7. The Lingomon icon should appear in your browser toolbar!

## How to Use

1. **Catch a word**: Right-click on any word while browsing and select "Catch this word!"
2. **View your WordDex**: Click the Lingomon icon in your browser toolbar
3. **Watch your collection grow**: Each word shows its rarity tier with a beautiful color

## Rarity Tiers

 Words are now classified based on **real linguistic frequency data** from the Google Trillion Word Corpus via **Datamuse API**! No more randomness - rarity reflects actual word usage in English.

### How Rarity Works

Each word's rarity is determined by its **frequency per million words** in real-world usage:
- **Primary Source:** Datamuse API (real-time linguistic data)
- **Fallback:** Local database (~400 common words)
- **Caching:** Frequency stored permanently with each word
- **Display:** Shows frequency score in word details (e.g., "76.07 per million")

### **<span style="color:#ebebeb"> Tier 1: COMMON</span>**
**≥ 100 per million** - Your everyday words, the foundation of language
- **Examples:** the (5000), and (2000), have (740), time (500), people (160)
- **Description:** Basic grammar, common verbs, everyday nouns
- **Usage:** Found in nearly every conversation and text

### **<span style="color:#a1ff96"> Tier 2: UNCOMMON</span>**
**25-99 per million** - Educated vocabulary and formal contexts
- **Examples:** friend (76), education (7.1), technology (3.6), government (1.34)
- **Description:** Formal nouns, business terms, specialized fields
- **Usage:** Common in writing but less frequent in casual speech

### **<span style="color:#96c7ff"> Tier 3: RARE</span>**
**5-24 per million** - Advanced vocabulary and academic writing
- **Examples:** based (5.0), special (4.4), interesting (3.9), significant (3.3)
- **Description:** Academic adjectives, sophisticated descriptors
- **Usage:** Found in professional discourse and literature

### **<span style="color:#b996ff"> Tier 4: EPIC</span>**
**1-4 per million** - High-level specialized vocabulary
- **Examples:** author (0.23), process (0.145), advanced (0.1), medical (0.012)
- **Description:** Technical jargon, specialized fields
- **Usage:** Academic papers, professional contexts

### **<span style="color:#fffa96"> Tier 5: LEGENDARY</span>**
**0.1-0.99 per million** - Rare, sophisticated vocabulary
- **Examples:** register (0.06), action (0.05), movie (0.02), story (0.004)
- **Description:** Highly specialized terms, uncommon contexts
- **Usage:** Specialized literature, advanced academic writing

### **<span style="color:#ff6969"> Tier 6: MYTHIC</span>**
**< 0.1 per million** - Extremely rare and archaic words
- **Examples:** ephemeral (0.003), serendipity (0.0025), juxtaposition (0.001), perspicacious (0.0002)
- **Description:** Literary devices, archaic terms, highly technical vocabulary
- **Usage:** Rare in modern usage, specialized academic/literary contexts

### Important Notes

- **Real Data:** Frequencies may surprise you! Common social words like "friend" are Uncommon (76/million), not super common.
- **API vs Intuition:** Linguistic frequency doesn't always match perceived commonness.
- **Legacy Words:** Words caught before v2.0 retain their old randomized rarity.
- **Unknown Words:** Words not in database/API default to Mythic.

## Frequency Scale Reference

```
5,000+  ████████████████████ Ultra-common (the, and, of)
1,000   ███████████████      Very common (for, by, this)
  100   ██████████           Common threshold
   25   ████                 Uncommon threshold
    5   ██                   Rare threshold
    1   █                    Epic threshold
  0.1   ▓                    Legendary threshold
< 0.1   ░                    Mythic (extremely rare)
```

## Word Distribution

Based on linguistic analysis:
- **Common (100+):** ~40% of word catches (everyday vocabulary)
- **Uncommon (25-99):** ~25% of catches (educated vocabulary)
- **Rare (5-24):** ~20% of catches (advanced vocabulary)
- **Epic (1-4):** ~10% of catches (specialized vocabulary)
- **Legendary (0.1-0.99):** ~4% of catches (rare vocabulary)
- **Mythic (<0.1):** ~1% of catches (extremely rare)

## Notes

- Words not found in the database or API are treated as **Mythic** (assumed < 0.1)
- The system uses **Datamuse API** for real-time lookup with local database fallback

## Privacy

Lingomon values your privacy:
- All data is stored locally in your browser
- No personal information is collected or transmitted
- External API calls:
  - [Free Dictionary API](https://dictionaryapi.dev/) - Word definitions and etymology (English)
  - [Datamuse API](https://www.datamuse.com/api/) - Real-time word frequency data (English)
  - [Korean Learners' Dictionary](https://krdict.korean.go.kr/) - Korean-English dictionary (Korean mode only)
  - [MyMemory Translation API](https://mymemory.translated.net/) - English-to-Korean translation (Korean mode only)
  - [DiceBear API](https://www.dicebear.com/) - Generates unique robot avatars for user profiles
- Fallback: Local frequency database used when APIs are unavailable

## Contributing

I welcome contributions of all kinds! Here are ways you can help:

### Add Language Support (Easiest!)
No coding required! Research dictionary APIs for your language and I'll implement it.
- **Submit:** [Create Language Request](https://github.com/VectorSophie/lingomon/issues/new?template=language_request.md)

### Report Bugs
Found a bug? Let me know!
- [Report a Bug](https://github.com/VectorSophie/lingomon/issues/new?template=bug_report.md)

### Suggest Features
Have an idea? I'd love to hear it!
- [Request a Feature](https://github.com/VectorSophie/lingomon/issues/new?template=feature_request.md)

### Code Contributions
Want to contribute code? Check out the guide:
- [Contributing Guide](.github/CONTRIBUTING.md)
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)

### Other Ways to Help
- Star this repo
- Share with friends
- Write a review on the Chrome Web Store (https://chromewebstore.google.com/detail/lingomon/panaoaejgjhkibbdmghgbgkmmkmcnkbo?hl=ko&utm_source=ext_sidebar)
Read the full [Contributing Guide](.github/CONTRIBUTING.md) for more details.

## Contributors

Thank you to all contributors!

### Language Support Contributors
<!-- Add contributors who submit language APIs -->
- **Korean** - VectorSophie (solo developer, original implementation)
- More coming soon! [Add your language](https://github.com/VectorSophie/lingomon/issues/new?template=language_request.md)

### Code Contributors
<!-- GitHub will auto-populate this -->
<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

Want to be listed here? Check out the [Contributing Guide](.github/CONTRIBUTING.md)!

## License

This project is open source and available for educational purposes.
Respect the AGPL 3.0 License!

---

Happy word catching! May your WordDex be filled with legendary finds!
