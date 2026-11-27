// Plain-JavaScript build of moshlySkins.ts (tsc, ES2020). Regenerate from the .ts; do not edit by hand.
/**
 * MoshlySkins — the skin "family" shared by every Moshly app (mixed model).
 *
 * Contract: docs/MOSHLY_SKINS.md in emptytown/moshly-days (reference: Days' sharedPrefs.ts).
 *   moshly_skin  = "<neo|legacy>.<updatedAtMs>"   cookie on .moshly.io (host-only on localhost)
 *   moshly_theme = "<light|dark>.<updatedAtMs>"
 * The newest token wins everywhere.
 *
 * Mixed model:
 *   - The FAMILY (Neo Brut / Legacy Purple, light / dark) is universal: picking it in any app
 *     or in the hub writes the shared cookie, and every app adopts it.
 *   - SPECIAL skins (e.g. Run's Coder, Time's Solari) belong to one app: picking one is stored
 *     only in that app, and it stays until a newer family choice arrives.
 *   - Skin pickers list the family first (Neo Brut, Legacy Purple), then the app's specials
 *     with a small "only in <app>" distinction.
 *
 * Source of truth: emptytown/moshly-modules (modules/MoshlySkins). Copy, do not edit the copy.
 */
export const FAMILY_NAMES = { neo: "Neo Brut", legacy: "Legacy Purple" };
const SKIN_COOKIE = "moshly_skin";
const THEME_COOKIE = "moshly_theme";
const ONE_YEAR_S = 60 * 60 * 24 * 365;
function parse(raw, values) {
    if (!raw)
        return null;
    let s = raw;
    try {
        s = decodeURIComponent(raw);
    }
    catch { /* keep raw */ }
    const i = s.lastIndexOf(".");
    const value = i > 0 ? s.slice(0, i) : s;
    const at = i > 0 ? Number(s.slice(i + 1)) : 0;
    if (!values.includes(value))
        return null;
    return { value: value, at: Number.isFinite(at) && at > 0 ? at : 0 };
}
function readCookie(name) {
    try {
        const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
        return m ? m[1] : null;
    }
    catch {
        return null;
    }
}
function writeCookie(name, token) {
    try {
        const host = window.location.hostname;
        const parts = [`${name}=${token}`, "Path=/", `Max-Age=${ONE_YEAR_S}`, "SameSite=Lax"];
        if (host === "moshly.io" || host.endsWith(".moshly.io"))
            parts.push("Domain=.moshly.io");
        if (window.location.protocol === "https:")
            parts.push("Secure");
        document.cookie = parts.join("; ");
    }
    catch { /* cookies blocked */ }
}
function readLocal(key) { try {
    return localStorage.getItem(key);
}
catch {
    return null;
} }
function writeLocal(key, v) { try {
    localStorage.setItem(key, v);
}
catch { /* blocked */ } }
/** The shared family choice (cookie), or null if never chosen in this browser. */
export function sharedFamily() {
    return parse(readCookie(SKIN_COOKIE), ["neo", "legacy"]);
}
/** The shared light/dark choice (cookie), or null. */
export function sharedMode() {
    return parse(readCookie(THEME_COOKIE), ["light", "dark"]);
}
/**
 * Which skin to show now: the newest of this app's own choice and the shared family choice.
 * New users (nothing stored anywhere) get Neo Brut.
 */
export function resolveSkin(setup) {
    const own = parse(readLocal(setup.storageKey), setup.skins);
    const shared = sharedFamily();
    if (shared && (!own || shared.at > own.at))
        return setup.family[shared.value];
    return own ? own.value : setup.family.neo;
}
/** The family a skin id belongs to, or null for an app-only special skin. */
export function familyOf(setup, skin) {
    if (skin === setup.family.neo)
        return "neo";
    if (skin === setup.family.legacy)
        return "legacy";
    return null;
}
/** The user picked a skin in this app. Family picks travel to every app; specials stay here. */
export function chooseSkin(setup, skin, at = Date.now()) {
    writeLocal(setup.storageKey, `${skin}.${at}`);
    const fam = familyOf(setup, skin);
    if (fam)
        writeCookie(SKIN_COOKIE, `${fam}.${at}`);
}
/** The user picked light or dark in this app (shared by every app). */
export function chooseMode(mode, at = Date.now()) {
    writeCookie(THEME_COOKIE, `${mode}.${at}`);
}
/** Order for skin pickers: family first (Neo Brut, Legacy Purple), then the app's specials. */
export function pickerOrder(setup) {
    const fam = [setup.family.neo, setup.family.legacy];
    return [...fam.map((id) => ({ id, special: false })), ...setup.skins.filter((s) => !fam.includes(s)).map((id) => ({ id, special: true }))];
}
/** Re-check when the user comes back (a newer family choice may have been made in another app). */
export function onReturn(cb) {
    const fire = () => { if (document.visibilityState !== "hidden")
        cb(); };
    window.addEventListener("focus", fire);
    document.addEventListener("visibilitychange", fire);
    return () => { window.removeEventListener("focus", fire); document.removeEventListener("visibilitychange", fire); };
}
