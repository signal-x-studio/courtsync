

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.2pQZATVs.js","_app/immutable/chunks/DrdcVeu4.js","_app/immutable/chunks/DrfFkH7i.js","_app/immutable/chunks/DzJyxCZ8.js","_app/immutable/chunks/BhAud1kW.js","_app/immutable/chunks/ClsaVdYO.js","_app/immutable/chunks/BVc7N6hh.js","_app/immutable/chunks/BoP2PCHn.js"];
export const stylesheets = [];
export const fonts = [];
