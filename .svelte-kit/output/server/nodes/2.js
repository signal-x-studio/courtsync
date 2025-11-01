

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.Dd-p-gYV.js","_app/immutable/chunks/6L4z5Hrz.js","_app/immutable/chunks/DbUpsjvX.js","_app/immutable/chunks/ghclKoKz.js","_app/immutable/chunks/BHMDx88I.js","_app/immutable/chunks/1c6Rvobr.js","_app/immutable/chunks/DApip8Xv.js","_app/immutable/chunks/BdamqLsw.js","_app/immutable/chunks/CwzJpzwR.js"];
export const stylesheets = ["_app/immutable/assets/2.CyauGK4G.css"];
export const fonts = [];
