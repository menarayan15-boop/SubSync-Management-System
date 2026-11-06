import { useState, useEffect, useRef, useCallback } from 'react';
import { COMMUNITY_COMMENTS } from '../data/communityComments';

const STORAGE_QUEUE_KEY = 'subsync_dynamic_comment_queue';
const STORAGE_LAST_ID_KEY = 'subsync_last_comment_id';
const STORAGE_HISTORY_KEY = 'subsync_comment_history';

/**
 * Fisher-Yates shuffle algorithm to generate a fresh random permutation
 * of comment IDs, ensuring the first element is not equal to avoidId.
 */
function generateShuffledQueue(allComments, avoidId = null) {
  const ids = allComments.map((c) => c.id);
  
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }

  // If the first item in the newly shuffled list is the same as the last seen ID,
  // swap it with the last element so we never get an immediate consecutive duplicate.
  if (avoidId && ids.length > 1 && ids[0] === avoidId) {
    const swapIdx = ids.length - 1;
    [ids[0], ids[swapIdx]] = [ids[swapIdx], ids[0]];
  }

  return ids;
}

/**
 * Safely reads from sessionStorage
 */
function safeGetSession(key) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(key);
    }
  } catch (err) {
    // SessionStorage disabled or restricted
  }
  return null;
}

/**
 * Safely writes to sessionStorage
 */
function safeSetSession(key, value) {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(key, value);
    }
  } catch (err) {
    // SessionStorage disabled or restricted
  }
}

/**
 * Selects the next non-repeating comment ID from sessionStorage or fresh shuffle
 */
function getNextCommentId(allComments) {
  const lastId = safeGetSession(STORAGE_LAST_ID_KEY);
  let queue = null;

  try {
    const rawQueue = safeGetSession(STORAGE_QUEUE_KEY);
    if (rawQueue) {
      queue = JSON.parse(rawQueue);
    }
  } catch (e) {
    queue = null;
  }

  // If queue is exhausted or invalid, generate a fresh shuffled permutation
  if (!Array.isArray(queue) || queue.length === 0) {
    queue = generateShuffledQueue(allComments, lastId);
  }

  // Pop next candidate
  let nextId = queue.shift();

  // Guard against consecutive repeat if single-item queue or anomaly
  if (nextId === lastId && allComments.length > 1) {
    if (queue.length > 0) {
      const alternate = queue.shift();
      queue.push(nextId);
      nextId = alternate;
    } else {
      // Pick any other random id
      const candidates = allComments.filter((c) => c.id !== lastId);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      nextId = chosen.id;
    }
  }

  // Persist updated state
  safeSetSession(STORAGE_QUEUE_KEY, JSON.stringify(queue));
  safeSetSession(STORAGE_LAST_ID_KEY, nextId);

  return nextId;
}

/**
 * Custom React Hook: useDynamicComment
 * 
 * Manages random comment selection, non-repeating cycle, auto-rotation with hover pause,
 * and smooth transitions without causing layout shifts.
 */
export function useDynamicComment({
  autoRotate = true,
  interval = 9000,
  categoryFilter = null,
} = {}) {
  // Filter comments if a category is requested, otherwise use the full pool
  const activePool = categoryFilter
    ? COMMUNITY_COMMENTS.filter((c) => c.category === categoryFilter)
    : COMMUNITY_COMMENTS;

  // Initialize with initial non-repeating selection
  const [currentId, setCurrentId] = useState(() => {
    return getNextCommentId(activePool);
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const transitionTimeoutRef = useRef(null);
  const autoRotateIntervalRef = useRef(null);

  // Locate the actual comment object
  const currentComment = activePool.find((c) => c.id === currentId) || activePool[0];
  const currentIndex = activePool.findIndex((c) => c.id === currentId);

  /**
   * Transition cleanly to a target comment ID
   */
  const transitionToComment = useCallback((targetId) => {
    if (targetId === currentId) return;

    setIsTransitioning(true);
    safeSetSession(STORAGE_LAST_ID_KEY, targetId);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    // 250ms fade-out, update data, then fade back in
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentId(targetId);
      setIsTransitioning(false);
    }, 250);
  }, [currentId]);

  /**
   * Manually shuffle / pick next random unseen comment
   */
  const shuffleComment = useCallback(() => {
    const nextId = getNextCommentId(activePool);
    transitionToComment(nextId);
  }, [activePool, transitionToComment]);

  /**
   * Step to next sequential comment in the pool
   */
  const nextComment = useCallback(() => {
    const nextIdx = (currentIndex + 1) % activePool.length;
    transitionToComment(activePool[nextIdx].id);
  }, [currentIndex, activePool, transitionToComment]);

  /**
   * Step to previous sequential comment in the pool
   */
  const prevComment = useCallback(() => {
    const prevIdx = (currentIndex - 1 + activePool.length) % activePool.length;
    transitionToComment(activePool[prevIdx].id);
  }, [currentIndex, activePool, transitionToComment]);

  /**
   * Automatic rotation timer
   */
  useEffect(() => {
    if (!autoRotate || isPaused || activePool.length <= 1) {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
      return;
    }

    autoRotateIntervalRef.current = setInterval(() => {
      // Pick next non-repeating random comment from queue
      const nextId = getNextCommentId(activePool);
      transitionToComment(nextId);
    }, interval);

    return () => {
      if (autoRotateIntervalRef.current) {
        clearInterval(autoRotateIntervalRef.current);
      }
    };
  }, [autoRotate, isPaused, activePool, interval, transitionToComment]);

  // Clean up any pending transition timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return {
    comment: currentComment,
    index: currentIndex >= 0 ? currentIndex : 0,
    total: activePool.length,
    isTransitioning,
    isPaused,
    setIsPaused,
    shuffleComment,
    nextComment,
    prevComment,
    pool: activePool,
  };
}

