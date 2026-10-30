/**
 * API Endpoints
 *
 * Central registry for all FivePrayer REST API endpoint paths.
 * All API calls should use this to ensure consistent endpoint URLs.
 *
 * @module api/endpoints
 */

/** Base prefix for all FivePrayer REST API endpoints */
const API_PREFIX = 'fiveprayer/v1';

/** Returns the base API endpoint path */
export const UseEndPoints = (): string => API_PREFIX;
