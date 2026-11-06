import { TESTIMONIALS_DATA } from '../data/testimonialsData.js';

const STORAGE_QUEUE_KEY = 'subsync_testimonial_queue';
const STORAGE_PREV_IDS_KEY = 'subsync_prev_testimonial_ids';

/**
 * Fisher-Yates shuffle algorithm to generate an unbiased random permutation of array items.
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Safely reads JSON from sessionStorage
 */
function safeGetSession(key) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (e) {
    // SessionStorage restricted or unavailable
  }
  return null;
}

/**
 * Safely writes JSON to sessionStorage
 */
function safeSetSession(key, value) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    // SessionStorage restricted or unavailable
  }
}

/**
 * Checks whether two arrays of IDs have identical items regardless of order
 */
function areSetsEqual(arr1, arr2) {
  if (!Array.isArray(arr1) || !Array.isArray(arr2) || arr1.length !== arr2.length) {
    return false;
  }
  const s1 = new Set(arr1);
  return arr2.every((item) => s1.has(item));
}

/**
 * Generates a fresh shuffled permutation of all testimonial IDs,
 * ensuring the first 3 items are not identical to prevIds.
 */
function generateFreshShuffledQueue(allTestimonials, prevIds = []) {
  const allIds = allTestimonials.map((t) => t.id);
  let shuffled = shuffleArray(allIds);

  // If the first 3 items match prevIds, shift or rotate them
  if (prevIds && prevIds.length === 3 && areSetsEqual(shuffled.slice(0, 3), prevIds)) {
    // Rotate the first 3 items to the end
    const head = shuffled.splice(0, 3);
    shuffled.push(...head);
  }

  return shuffled;
}

/**
 * Selects 3 dynamic, non-repeating testimonials for the homepage.
 * On every page load or refresh:
 *  1. Checks sessionStorage for existing queue & previous 3 displayed IDs.
 *  2. If queue has fewer than 3 items, reshuffles the full pool using Fisher-Yates.
 *  3. Pops 3 distinct items.
 *  4. Ensures the new triplet is never identical to the previous load.
 *  5. Saves state back to sessionStorage.
 */
export function getDynamicTestimonials(count = 3) {
  const allTestimonials = TESTIMONIALS_DATA;
  if (!allTestimonials || allTestimonials.length === 0) return [];
  if (allTestimonials.length <= count) return allTestimonials;

  const prevIds = safeGetSession(STORAGE_PREV_IDS_KEY) || [];
  let queue = safeGetSession(STORAGE_QUEUE_KEY);

  if (!Array.isArray(queue) || queue.length < count) {
    queue = generateFreshShuffledQueue(allTestimonials, prevIds);
  }

  // Pop candidate IDs
  let selectedIds = queue.splice(0, count);

  // Guard against consecutive identical selection
  if (prevIds.length === count && areSetsEqual(selectedIds, prevIds) && queue.length >= count) {
    // Swap with next batch in queue
    const alternateIds = queue.splice(0, count);
    queue.push(...selectedIds);
    selectedIds = alternateIds;
  }

  // Ensure selectedIds are 100% unique
  selectedIds = [...new Set(selectedIds)];
  while (selectedIds.length < count) {
    const remaining = allTestimonials.filter((t) => !selectedIds.includes(t.id));
    if (remaining.length === 0) break;
    const randomPick = remaining[Math.floor(Math.random() * remaining.length)];
    selectedIds.push(randomPick.id);
  }

  // Persist updated queue and selected IDs
  safeSetSession(STORAGE_QUEUE_KEY, queue);
  safeSetSession(STORAGE_PREV_IDS_KEY, selectedIds);

  // Map IDs to full testimonial objects
  return selectedIds
    .map((id) => allTestimonials.find((t) => t.id === id))
    .filter(Boolean);
}
