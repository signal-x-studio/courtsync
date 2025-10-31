import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.BANv9R1B.js","_app/immutable/chunks/CPsmpoqW.js","_app/immutable/chunks/DbuvHMYe.js","_app/immutable/chunks/3PS-k3-E.js"];
export const stylesheets = ["_app/immutable/assets/0.D_Jrc0dQ.css"];
export const fonts = [];
