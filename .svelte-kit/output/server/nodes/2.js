

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.C8t87YaL.js","_app/immutable/chunks/BVP2IYXq.js","_app/immutable/chunks/CAX-FWec.js","_app/immutable/chunks/CplIWc7m.js","_app/immutable/chunks/CPr2jWSk.js","_app/immutable/chunks/mRf8aGA8.js","_app/immutable/chunks/5yCCTwAM.js","_app/immutable/chunks/9cGwFRh_.js"];
export const stylesheets = [];
export const fonts = [];
