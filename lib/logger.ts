/**
 * Simple logger utility with verbosity control.
 */

let verboseEnabled = false;

/**
 * Sets the verbosity level for the logger.
 * @param v - True to enable verbose logging, false otherwise.
 */
export const setVerbose = (v: boolean) => { 
    verboseEnabled = v; 
    if (verboseEnabled) {
        console.log("[Logger] Verbose logging enabled."); // Log once when enabled
    }
};

/**
 * Log utility functions.
 */
export const log = {
  /** Log verbose messages, only if verbose mode is enabled. */
  verbose: (msg: string, ...args: any[]) => {
    if (verboseEnabled) console.debug(`[VERBOSE] ${msg}`, ...args);
  },
  /** Log informational messages (standard output). */
  info: (msg: string, ...args: any[]) => console.log(msg, ...args),
  /** Log warning messages. */
  warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
  /** Log error messages. */
  error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args),
}; 