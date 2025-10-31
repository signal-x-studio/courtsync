import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.Cf8hTae6.js","_app/immutable/chunks/BVP2IYXq.js","_app/immutable/chunks/CAX-FWec.js","_app/immutable/chunks/CplIWc7m.js"];
export const stylesheets = ["_app/immutable/assets/0.D_Jrc0dQ.css"];
export const fonts = [];
