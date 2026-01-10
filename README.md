# Lingomon - Gotta Catch 'Em All!

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub issues](https://img.shields.io/github/issues/lalalune/lingomon.svg)](https://github.com/lalalune/lingomon/issues)
[![GitHub stars](https://img.shields.io/github/stars/lalalune/lingomon.svg)](https://github.com/lalalune/lingomon/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

![Lingomon Icon](lingomon.png)

Welcome to Lingomon, the browser extension that turns vocabulary building into an adventure! Every new word you encounter becomes a collectible creature in your personal WordDex.

## What is Lingomon?

Lingomon is an educational browser extension that makes learning new words fun and engaging. As you browse the web, you can "catch" interesting words by right-clicking them. Each word has a rarity tier (just like your favorite collecting games!), complete with bright, colorful popups and a tier system that turns vocabulary building into an exciting journey.

## Features

- **Catch Words**: Right-click any word on any website to add it to your WordDex
- **Real Frequency-Based Rarity**: Words assigned tiers based on actual linguistic data from Datamuse API (NEW v2.0!)
- **Multi-language Support**: English + Korean (**[Add your language!](LANGUAGE_REQUEST_TEMPLATE.md)**)
  - Toggle between English and Korean UI
  - Korean-English dictionary lookup for Korean words
  - Automatic translation of English definitions to Korean
  - Translated badges and interface elements
- **Beautiful Popups**: Enjoy vibrant, color-coded notifications when you catch a new word
- **WordDex**: View your entire collection with frequency scores and rarity tiers
- **Dictionary Integration**: Get definitions and etymology for words you catch
- **Persistent Storage**: Your WordDex is saved locally and never lost
- **Dark Mode**: Toggle between light and dark themes
- **Statistics & Charts**: Track your collection with visual analytics
- **Badges & Achievements**: Unlock badges for milestones
- **Daily Streaks**: Build vocabulary learning habits
- **Quiz Mode**: Test your knowledge of caught words

## Want Your Language in Lingomon?

**No coding required!** Help me add support for your language:

1. Fill out the [Language Request Template](LANGUAGE_REQUEST_TEMPLATE.md)
2. Research free dictionary APIs (I'll guide you!)
3. Submit as a [GitHub issue](https://github.com/lalalune/lingomon/issues/new?template=language_request.md)
4. I implement it and credit you!

**Priority Languages:** Spanish, French, German, Japanese, Portuguese, Arabic, Chinese, Hindi, Russian

See [How to Request a Language](LANGUAGE_REQUEST_TEMPLATE.md) for detailed instructions.

## Installation

### From Web Store (Recommended)
- **Chrome/Edge/Brave:** Coming soon to Chrome Web Store
- **Firefox:** Coming soon to Firefox Add-ons

### From Source (Developers)
1. Download or clone this repository
   ```bash
   git clone https://github.com/lalalune/lingomon.git
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

**NEW in v2.0:** Words are now classified based on **real linguistic frequency data** from the Google Trillion Word Corpus via **Datamuse API**! No more randomness - rarity reflects actual word usage in English.

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

## Korean Language Support (v1.7+)

Lingomon now supports full Korean language interface with intelligent dictionary lookup:

### How Korean Mode Works

1. **Toggle Language**: Click the "KO" button in the popup to switch to Korean mode
2. **Smart Dictionary Lookup**:
   - **Korean words**: Direct lookup in Korean Learners' Dictionary
   - **English words**: Automatically translated to Korean, then looked up
   - **Fallback**: If Korean lookup fails, English definition is translated to Korean
3. **Fully Translated UI**: All interface elements, badges, and labels appear in Korean
4. **Part of Speech Translation**: Grammar terms (noun → 명사, verb → 동사, etc.)

### Korean APIs Used

- **Korean Learners' Dictionary** (krdict.korean.go.kr): Korean-English dictionary
- **MyMemory Translation API**: English-to-Korean translation for definitions

## Privacy

Lingomon values your privacy:
- All data is stored locally in your browser
- No personal information is collected or transmitted
- External API calls:
  - [Free Dictionary API](https://dictionaryapi.dev/) - Word definitions and etymology (English)
  - [Datamuse API](https://www.datamuse.com/api/) - Real-time word frequency data (English)
  - [Korean Learners' Dictionary](https://krdict.korean.go.kr/) - Korean-English dictionary (Korean mode only)
  - [MyMemory Translation API](https://mymemory.translated.net/) - English-to-Korean translation (Korean mode only)
- Fallback: Local frequency database used when APIs are unavailable

## Contributing

I welcome contributions of all kinds! Here are ways you can help:

### Add Language Support (Easiest!)
No coding required! Research dictionary APIs for your language and I'll implement it.
- **Guide:** [Language Request Template](LANGUAGE_REQUEST_TEMPLATE.md)
- **Submit:** [Create Language Request](https://github.com/lalalune/lingomon/issues/new?template=language_request.md)

### Report Bugs
Found a bug? Let me know!
- [Report a Bug](https://github.com/lalalune/lingomon/issues/new?template=bug_report.md)

### Suggest Features
Have an idea? I'd love to hear it!
- [Request a Feature](https://github.com/lalalune/lingomon/issues/new?template=feature_request.md)

### Code Contributions
Want to contribute code? Check out the guide:
- [Contributing Guide](.github/CONTRIBUTING.md)
- [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)

### Other Ways to Help
- Star this repo
- Share with friends
- Write a review on the Chrome Web Store (coming soon)
- Join discussions in [GitHub Discussions](https://github.com/lalalune/lingomon/discussions)

Read the full [Contributing Guide](.github/CONTRIBUTING.md) for more details.

## Contributors

Thank you to all contributors!

### Language Support Contributors
<!-- Add contributors who submit language APIs -->
- **Korean** - lalalune (solo developer, original implementation)
- _More coming soon! [Add your language](LANGUAGE_REQUEST_TEMPLATE.md)_

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
