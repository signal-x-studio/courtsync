import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.DOpqkh9_.js","_app/immutable/chunks/BGoQ7gJS.js","_app/immutable/chunks/Pko6iT02.js","_app/immutable/chunks/Db87pd3s.js"];
export const stylesheets = ["_app/immutable/assets/0.D_Jrc0dQ.css"];
export const fonts = [];
