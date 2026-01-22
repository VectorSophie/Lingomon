
# Lingomon Privacy Policy

Last updated: January 21, 2026

## Data Collection
Lingomon collects and stores the following data:
- **Vocabulary**: Words you select and catch from web pages.
- **Context**: The specific sentence where you found the word (to help you remember how it was used).
- **Definitions**: Word definitions and etymology fetched from dictionary APIs.
- **Statistics**: Website domains where words were caught, your achievements, streaks, and badges.
- **Profile**: Your username, avatar preference, and battle team configuration.
- **Language Preference**: Whether you are using English or Korean mode.

## Data Storage & Cloud Sync
- **Local Storage**: All data is initially stored locally on your device using Chrome's storage API.
- **Cloud Backup (New in v1.8)**: To prevent data loss and enable cross-device sync, your WordDex collection, stats, and profile are securely backed up to our cloud database (Supabase). This ensures you can restore your progress if you reinstall the extension or switch devices.
- **Authentication**: We use **Google Sign-In** (via Supabase Auth) to securely identify your account and manage your cloud backup.

## Multiplayer & Sharing
Lingomon includes multiplayer features (Battle Mode, Friend List).
- **Public Profile**: Your username, avatar, battle team, and win/loss statistics are visible to other Lingomon users to facilitate battles and leaderboards.
- **Private Data**: Your full WordDex collection and personal learning history are **NOT** shared with other users.

## Third-Party Services
Lingomon uses the following services to provide functionality:
- **Supabase** (supabase.com): Provides secure database storage, authentication, and real-time features for multiplayer.
- **Dictionary API** (api.dictionaryapi.dev): Provides English word definitions.
- **Datamuse API** (api.datamuse.com): Provides word frequency data.
- **Korean Learners' Dictionary API** (krdict.korean.go.kr): Provides Korean definitions.
- **MyMemory Translation API** (api.mymemory.translated.net): Provides translations.
- **DiceBear API** (api.dicebear.com): Generates robot avatars based on your User ID.

## Your Rights
- You can **export** your local data at any time (via Chrome Storage).
- You can **delete** your account and cloud data by contacting us or using the delete options within the extension (if available).
- You can use the extension without logging in, but cloud backup and multiplayer features will be unavailable.

## Contact
For questions or concerns, please open an issue at: [https://github.com/VectorSophie/Lingomon/issues](https://github.com/VectorSophie/Lingomon/issues)
