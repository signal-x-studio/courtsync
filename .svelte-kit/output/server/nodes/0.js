import * as universal from '../entries/pages/_layout.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.U0o5klXR.js","_app/immutable/chunks/6L4z5Hrz.js","_app/immutable/chunks/DbUpsjvX.js","_app/immutable/chunks/ghclKoKz.js"];
export const stylesheets = ["_app/immutable/assets/0.BgoNo4cX.css"];
export const fonts = [];
