import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CuJK3KgY.js","_app/immutable/chunks/2ojvjqKR.js","_app/immutable/chunks/D8fu8Nzm.js","_app/immutable/chunks/nXSXTBA3.js"];
export const stylesheets = ["_app/immutable/assets/0.D7tIeSxj.css"];
export const fonts = [];
