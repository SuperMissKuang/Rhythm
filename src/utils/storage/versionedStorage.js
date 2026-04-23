import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Versioned AsyncStorage helper.
 *
 * Wraps persisted data in an envelope:
 *   { schemaVersion: <number>, data: <anything> }
 *
 * On read, detects legacy (unversioned) data, runs migration functions in
 * sequence to bring old shapes up to the current version, and flags whether
 * the caller should persist the upgraded shape back to disk.
 *
 * Each migration is a pure function: (oldData) => newData. They run in order
 * from storedVersion+1 up to currentVersion. Missing migration for a version
 * is treated as a no-op (useful when adopting versioning for the first time,
 * where the on-disk shape already matches v1).
 *
 * Example usage:
 *   const CURRENT_VERSION = 2;
 *   const MIGRATIONS = {
 *     2: (v1cycles) => v1cycles.map(c => ({ ...c, period_length: null })),
 *   };
 *   const result = await readVersioned(KEY, CURRENT_VERSION, MIGRATIONS);
 *   if (result?.wasMigrated) await writeVersioned(KEY, result.data, CURRENT_VERSION);
 */

/**
 * Read and (if needed) migrate versioned data from AsyncStorage.
 *
 * @param {string} key - AsyncStorage key.
 * @param {number} currentVersion - The schema version the caller expects.
 * @param {Object.<number, function>} migrations - Map of target version -> migration fn.
 * @returns {Promise<{ data: any, wasMigrated: boolean } | null>}
 *   null if nothing is stored or the stored value can't be parsed.
 */
export async function readVersioned(key, currentVersion, migrations = {}) {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Corrupt JSON. Let the caller decide whether to clear the key.
    return null;
  }

  // Detect legacy (unversioned) data. Anything that isn't an object with a
  // numeric schemaVersion is treated as version 0.
  let storedVersion;
  let data;
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    typeof parsed.schemaVersion === "number"
  ) {
    storedVersion = parsed.schemaVersion;
    data = parsed.data;
  } else {
    storedVersion = 0;
    data = parsed; // legacy payload (e.g. a raw array)
  }

  if (storedVersion === currentVersion) {
    return { data, wasMigrated: false };
  }

  if (storedVersion > currentVersion) {
    // User likely downgraded the app. We can't safely migrate backward;
    // return the data as-is and hope fields are backward-compatible.
    console.warn(
      `[versionedStorage] Stored version (${storedVersion}) is newer than ` +
        `current (${currentVersion}) for key "${key}". Using as-is.`
    );
    return { data, wasMigrated: false };
  }

  // storedVersion < currentVersion → run migrations in sequence.
  let migrated = data;
  for (let v = storedVersion + 1; v <= currentVersion; v++) {
    const migrate = migrations[v];
    if (typeof migrate === "function") {
      migrated = migrate(migrated);
    }
    // Missing migration entry is a no-op. This is intentional: v1 adoption
    // often has nothing to change, and forcing a dummy migration is noise.
  }

  return { data: migrated, wasMigrated: true };
}

/**
 * Write data to AsyncStorage wrapped in a version envelope.
 *
 * @param {string} key - AsyncStorage key.
 * @param {any} data - The payload to persist.
 * @param {number} currentVersion - The schema version to stamp onto the envelope.
 * @returns {Promise<void>}
 */
export async function writeVersioned(key, data, currentVersion) {
  const envelope = { schemaVersion: currentVersion, data };
  await AsyncStorage.setItem(key, JSON.stringify(envelope));
}
