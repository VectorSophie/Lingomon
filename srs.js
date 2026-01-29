// srs.js - Spaced Repetition System (Leitner) Logic

const SRS_INTERVALS = [
    0,              // Level 0: Review Immediately (or ASAP)
    24 * 60 * 60 * 1000,       // Level 1: 1 Day
    3 * 24 * 60 * 60 * 1000,   // Level 2: 3 Days (Unlock Evo 1)
    7 * 24 * 60 * 60 * 1000,   // Level 3: 1 Week
    14 * 24 * 60 * 60 * 1000,  // Level 4: 2 Weeks
    30 * 24 * 60 * 60 * 1000   // Level 5: 1 Month (Unlock Evo 2)
];

const MAX_SRS_LEVEL = 5;

/**
 * Calculates the new SRS state for a word after a review.
 * @param {Object} currentSrs - Current SRS object { level, streak, nextReview }
 * @param {boolean} isCorrect - Whether the user answered correctly
 * @returns {Object} New SRS object
 */
function calculateSRS(currentSrs, isCorrect) {
    let { level, streak } = currentSrs || { level: 0, streak: 0 };
    
    // Safety check
    level = typeof level === 'number' ? level : 0;
    streak = typeof streak === 'number' ? streak : 0;

    if (isCorrect) {
        // Promotion
        if (level < MAX_SRS_LEVEL) {
            level++;
        }
        streak++;
    } else {
        // Demotion Logic
        // Option A: Reset to 0 (Harsh)
        // Option B: Drop 1 level (Forgiving)
        // Leitner usually resets to 0 or 1 on failure. Let's go with drop to 1 or 0 if already low.
        // Actually, for a game, dropping 1 level is better UX than full reset.
        if (level > 0) level--;
        streak = 0;
    }

    const interval = SRS_INTERVALS[level] || SRS_INTERVALS[0];
    const nextReview = Date.now() + interval;

    return {
        level,
        streak,
        nextReview,
        lastReviewed: Date.now()
    };
}

/**
 * Checks if a word is due for review
 * @param {Object} srs - SRS object
 * @returns {boolean}
 */
function isDue(srs) {
    if (!srs || !srs.nextReview) return true; // Treat as new if no data
    return Date.now() >= srs.nextReview;
}

/**
 * Gets a human-readable time until next review
 * @param {number} nextReviewTimestamp 
 * @returns {string}
 */
function getTimeUntilReview(nextReviewTimestamp) {
    const diff = nextReviewTimestamp - Date.now();
    if (diff <= 0) return "Now";
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
}

// Export for usage
if (typeof window !== 'undefined') {
    window.SRS = {
        calculateSRS,
        isDue,
        getTimeUntilReview,
        intervals: SRS_INTERVALS
    };
}
