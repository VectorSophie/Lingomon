# Privacy Policy for Lingomon

**Last Updated:** January 26, 2026

## 1. Introduction
Lingomon ("we", "our", or "us") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our Chrome Extension.

## 2. Data Collection and Usage

### 2.1. Local Data Storage
All gameplay data, including your "WordDex" (collected words), achievements, battle teams, and stats, is **primarily stored locally on your device** using Chrome's `chrome.storage.local` API. This data remains on your machine unless you explicitly choose to sync it via the optional multiplayer features.

### 2.2. External API Usage
Lingomon connects to the following third-party APIs solely to fetch word definitions, scientific data, and game assets:
*   **DictionaryAPI.dev**: To retrieve English word definitions.
*   **Datamuse API**: To determine word frequency and rarity.
*   **StackExchange API**: To identify technical/IT terms.
*   **PubChem (NIH)**: To retrieve chemical data (formulas, molecular weight) for the Chemistry module.
*   **Solar System OpenData**: To retrieve astronomical data for the Space module.
*   **GBIF**: To retrieve biological taxonomy data.
*   **Korean Learners' Dictionary API**: To retrieve Korean definitions.
*   **Supabase**: Used *only* if you opt-in to the multiplayer Friend System (to store your Defense Team and fetch Leaderboards).
*   **DiceBear API**: To generate random robot avatars.

**No personal browsing history is sent to these services.** Only the specific word you select/catch is transmitted to fetch its definition.

### 2.3. User Identity (Multiplayer)
If you use the Battle Arena features:
*   We generate a random anonymous User ID.
*   We store your chosen display name, avatar, and battle team configuration in our cloud database.
*   We do **not** collect email addresses or real names.

## 3. Permissions
The extension requests the following permissions:
*   **Context Menus**: To allow you to right-click words to "catch" them.
*   **Storage**: To save your game progress locally.
*   **Host Permissions**: To connect to the definition APIs listed above.

## 4. Data Security
Communication with external APIs is performed over secure HTTPS connections. Your local data remains on your machine and is subject to your browser's security protections.

## 5. Contact
If you have questions about this policy, please open an issue on our [GitHub Repository](https://github.com/VectorSophie/Lingomon/issues).
