

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.C8kMOLFm.js","_app/immutable/chunks/CPsmpoqW.js","_app/immutable/chunks/DbuvHMYe.js","_app/immutable/chunks/3PS-k3-E.js","_app/immutable/chunks/B7bXz0ip.js","_app/immutable/chunks/LW9aGJv8.js","_app/immutable/chunks/jxvN46yn.js","_app/immutable/chunks/CDuXX2Nv.js"];
export const stylesheets = [];
export const fonts = [];
