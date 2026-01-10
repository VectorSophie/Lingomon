# Contributing to Lingomon

Thank you for your interest in contributing to Lingomon!

This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Language Support Requests](#language-support-requests)
4. [Reporting Bugs](#reporting-bugs)
5. [Suggesting Features](#suggesting-features)
6. [Code Contributions](#code-contributions)
7. [Development Setup](#development-setup)
8. [Pull Request Process](#pull-request-process)
9. [Style Guidelines](#style-guidelines)

---

## Code of Conduct

Be respectful, inclusive, and constructive. This is a solo developer project, and I appreciate all help to make language learning better for everyone.

**Expected behavior:**
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Gracefully accept constructive criticism
- Focus on what's best for the community

---

## How Can I Contribute?

There are many ways to contribute to Lingomon:

### 1. Add Language Support (NO CODING REQUIRED!)
The easiest way to contribute is by researching dictionary APIs for your language.

**See:** [LANGUAGE_REQUEST_TEMPLATE.md](../LANGUAGE_REQUEST_TEMPLATE.md)

**What you need to do:**
1. Find free dictionary/translation APIs for your language
2. Test them with a few words
3. Fill out the language request template
4. Submit as a GitHub issue
5. I'll implement it and credit you!

### 2. Report Bugs
Found a bug? Please report it!

**See:** [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md)

**What makes a good bug report:**
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/recordings
- Browser and extension version
- Error messages from console (F12 → Console)

### 3. Suggest Features
Have an idea? I'd love to hear it!

**See:** [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md)

**What makes a good feature request:**
- Clear description of the feature
- Problem it solves
- Use cases and examples
- Mockups or references (optional)

### 4. Improve Documentation
Documentation improvements are always welcome:
- Fix typos or unclear explanations
- Add examples
- Translate documentation
- Create tutorials or guides

### 5. Code Contributions
Submit code improvements, bug fixes, or new features!

**See:** [Development Setup](#development-setup) and [Pull Request Process](#pull-request-process)

### 6. Design Contributions
Help improve the UI/UX:
- Icon designs
- UI mockups
- Animation improvements
- Color scheme suggestions

### 7. Testing
Help test new features and report issues:
- Test beta versions
- Try edge cases
- Test on different browsers/OS
- Test with different languages

### 8. Spread the Word
- Share on social media
- Write blog posts or reviews
- Recommend to friends and teachers
- Leave a review on Chrome Web Store/Firefox Add-ons

---

## Language Support Requests

**The most impactful contribution!** Adding a new language opens Lingomon to millions of users.

### Process:

1. **Check existing requests:** Look at [open language request issues](https://github.com/[your-username]/lingomon/labels/language-request) to avoid duplicates

2. **Read the guide:** [LANGUAGE_REQUEST_TEMPLATE.md](../LANGUAGE_REQUEST_TEMPLATE.md) has detailed instructions

3. **Research APIs:** Find free dictionary/translation APIs for your language
   - Test them with actual requests
   - Verify they return good quality data
   - Check rate limits and terms of service

4. **Submit request:** Create a [new language request issue](https://github.com/[your-username]/lingomon/issues/new?template=language_request.md)

5. **I implement:** Usually takes 1-2 weeks depending on complexity

6. **Get credited:** You'll be credited in the changelog and README!

### Priority Languages:
- Spanish (500M+ speakers)
- French (280M+ speakers)
- German (135M+ speakers)
- Japanese (125M+ speakers)
- Portuguese (260M+ speakers)
- Mandarin Chinese (1B+ speakers)
- Arabic (420M+ speakers)
- Hindi (600M+ speakers)
- Russian (260M+ speakers)

---

## Reporting Bugs

### Before Submitting:

1. **Check existing issues:** Search [open issues](https://github.com/[your-username]/lingomon/issues) to avoid duplicates
2. **Update to latest version:** Make sure you're using the latest version
3. **Check the console:** Press F12 → Console tab and look for errors
4. **Try to reproduce:** Can you make it happen consistently?

### Submitting a Bug Report:

Use the [Bug Report Template](https://github.com/[your-username]/lingomon/issues/new?template=bug_report.md)

**Include:**
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or screen recording
- Browser, OS, and extension version
- Error messages from console
- Language mode (English/Korean/etc)

---

## Suggesting Features

I love feature ideas!

### Before Submitting:

1. **Check existing requests:** Search [feature requests](https://github.com/[your-username]/lingomon/labels/enhancement)
2. **Consider scope:** Does this fit Lingomon's purpose?
3. **Think about users:** Who would benefit from this?

### Submitting a Feature Request:

Use the [Feature Request Template](https://github.com/[your-username]/lingomon/issues/new?template=feature_request.md)

**Include:**
- Clear description of the feature
- Problem it solves
- How you envision it working
- Examples from other apps (if applicable)
- Who would benefit

---

## Code Contributions

### Technologies Used:

- **Vanilla JavaScript** (no frameworks - keeping it lightweight)
- **Chrome Extension Manifest V3**
- **Local Storage** (Chrome Storage API)
- **External APIs:**
  - Free Dictionary API (English definitions)
  - Datamuse API (word frequency)
  - Korean Learners' Dictionary (Korean)
  - MyMemory Translation API (translations)

### Code Areas:

- `manifest.json` - Extension configuration
- `background.js` - Service worker, context menu, API calls
- `content.js` - Content script for word catching animations
- `popup.js` / `popup.html` - Extension popup UI
- `animations.js` - Catch animations and popups
- `i18n.js` - Internationalization/translation system
- `wordFrequency.js` - Local word frequency database

---

## Development Setup

### Prerequisites:

- A Chromium-based browser (Chrome, Edge, Brave, etc.) or Firefox
- Text editor (VS Code, Sublime, etc.)
- Basic JavaScript knowledge

### Setup Steps:

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/lingomon.git
   cd lingomon
   ```

2. **Create API config** (for Korean support)
   ```bash
   cp config.example.js config.js
   # Edit config.js and add your Korean API key (or leave blank)
   ```

3. **Load extension in browser**

   **Chrome/Edge/Brave:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `lingomon` folder

   **Firefox:**
   - Go to `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from the folder

4. **Make changes and test**
   - Edit code files
   - Click "Reload" button on extension card to see changes
   - Test by right-clicking words on any webpage

5. **Check for errors**
   - Open browser console (F12)
   - Look for errors in red
   - Check extension's service worker console (in chrome://extensions → inspect views)

---

## Pull Request Process

### Before Submitting:

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Follow [Style Guidelines](#style-guidelines)
   - Test thoroughly
   - Comment your code where needed

3. **Test in multiple scenarios**
   - Test in Chrome AND Firefox (if possible)
   - Test in English and Korean modes
   - Test in dark mode
   - Test edge cases

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add Spanish language support"
   # or
   git commit -m "fix: quiz mode not showing definitions"
   ```

   **Commit message format:**
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style (formatting, etc.)
   - `refactor:` - Code refactoring
   - `perf:` - Performance improvements
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Click "Compare & pull request"
   - Fill out the [PR template](.github/PULL_REQUEST_TEMPLATE.md)
   - Link related issues

### PR Review Process:

1. **Automated checks:** (if we add them)
2. **Code review:** Maintainer reviews your code
3. **Feedback:** You may be asked to make changes
4. **Approval:** Once approved, PR will be merged
5. **Credit:** You'll be added to contributors!

### What Makes a Good PR:

✅ **Do:**
- Keep PRs focused (one feature/fix per PR)
- Write clear commit messages
- Add comments for complex logic
- Test thoroughly before submitting
- Respond to feedback promptly

❌ **Don't:**
- Submit huge PRs with multiple unrelated changes
- Break existing functionality
- Ignore code style guidelines
- Add unnecessary dependencies
- Submit untested code

---

## Style Guidelines

### JavaScript:

```javascript
// Use camelCase for variables and functions
const wordFrequency = 123;
function fetchDefinition(word) { ... }

// Use descriptive names
const userWordCount = 50; // Good
const x = 50; // Bad

// Add comments for complex logic
// Calculate rarity based on frequency per million words
function mapFrequencyToRarity(frequency) {
  if (frequency >= 100) return 'common';
  // ... etc
}

// Use const by default, let when needed, avoid var
const API_KEY = 'abc123';
let currentIndex = 0;

// Use async/await instead of .then() chains
async function getData() {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Handle errors gracefully
try {
  const data = await fetchData();
} catch (err) {
  console.error('Error fetching data:', err);
  showErrorMessage('Could not load data');
}
```

### HTML/CSS:

```html
<!-- Use semantic HTML -->
<button class="sort-btn" data-sort="alpha">A-Z</button>

<!-- Keep CSS organized -->
<style>
  /* Group related styles */
  .word-entry {
    border-bottom: 1px solid #e0e0e0;
    padding: 10px 0;
  }

  /* Dark mode variants */
  body.dark-mode .word-entry {
    border-bottom-color: #404040;
  }
</style>
```

### File Organization:

- Keep files focused (one responsibility)
- Use clear file names
- Add comments at the top explaining file's purpose
- Group related functions together

### Code Quality:

- **DRY (Don't Repeat Yourself):** Avoid duplicating code
- **KISS (Keep It Simple):** Simple solutions are better
- **YAGNI (You Aren't Gonna Need It):** Don't over-engineer
- **Readable > Clever:** Clear code > clever one-liners

---

## Questions?

- 💬 [Open a Discussion](https://github.com/[your-username]/lingomon/discussions)
- 🐛 [Report an Issue](https://github.com/[your-username]/lingomon/issues)
- 📧 Email: [your-email@example.com]
- 🐦 Twitter: [@YourHandle]

---

**Thank you for contributing to Lingomon!** 🙏

Every contribution, no matter how small, helps make language learning better for everyone.
