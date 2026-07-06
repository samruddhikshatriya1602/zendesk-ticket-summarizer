import { TicketSummary } from '../types';

// Cache entry interface
interface CacheEntry {
    summary: TicketSummary;
    generatedAt: string;
    storedAt: number;
  }

// Create the in-memory store (Lives in server RAM; cleared when server restarts.)
const store = new Map<string, CacheEntry>();

export function getCacheKey(ticketId: number, updatedAt: string): string {
    return `${ticketId}:${updatedAt}`;
}

// Get the TTL for the cache (in milliseconds)
function getTtlMs(): number | null {
    const raw = process.env.SUMMARY_CACHE_TTL_MS;
    if (!raw || raw.trim() === '') return null;
  
    const ttl = Number(raw);
    if (!Number.isFinite(ttl) || ttl <= 0) return null;
  
    return ttl;
}

// Get the summary from the cache
export function get(
    ticketId: number,
    updatedAt: string
  ): { summary: TicketSummary; generatedAt: string } | null {
    const key = getCacheKey(ticketId, updatedAt);
    const entry = store.get(key);
  
    if (!entry) {
      return null;
    }
  
    const ttlMs = getTtlMs();
    if (ttlMs !== null && Date.now() - entry.storedAt > ttlMs) {
      store.delete(key);
      return null;
    }
  
    return {
      summary: entry.summary,
      generatedAt: entry.generatedAt,
    };
}


// Set the summary in the cache
export function set(
    ticketId: number,
    updatedAt: string,
    summary: TicketSummary
  ): void {
    const key = getCacheKey(ticketId, updatedAt);
  
    store.set(key, {
      summary,
      generatedAt: new Date().toISOString(),
      storedAt: Date.now(),
    });
}


// Clear the cache
export function clear(): void {
    store.clear();
  }