/**
 * Calculates a "Match Percentage" between two users based on their interests and fantasies.
 */
export function calculateVibeScore(userInterests: string[] = [], matchInterests: string[] = []): number {
    if (!userInterests.length || !matchInterests.length) {
        // Return a base "curiosity" score if no shared data is available
        return 40 + Math.floor(Math.random() * 20);
    }

    const s1 = new Set(userInterests.map(i => i.toLowerCase().trim()));
    const s2 = new Set(matchInterests.map(i => i.toLowerCase().trim()));

    const intersection = new Set([...s1].filter(x => s2.has(x)));
    
    // Calculate ratio based on the target user's interests (discovery perspective)
    const baseMatch = (intersection.size / s2.size) * 100;
    
    // Normalize to a sweet spot (between 60% and 99%)
    // Even if zero overlap, there's always a minimum "Vibe Potential"
    const score = 60 + (baseMatch * 0.39);
    
    // Add a tiny bit of deterministic randomness based on the interest strings
    // to make it feel less like a simple count
    const seed = (userInterests.join('').length + matchInterests.join('').length) % 5;
    
    return Math.min(99.9, Math.round(score + seed));
}
