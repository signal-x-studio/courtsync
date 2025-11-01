

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/style-guide/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/style-guide/+page.ts";
export const imports = ["_app/immutable/nodes/3.CPfEE3VZ.js","_app/immutable/chunks/6L4z5Hrz.js","_app/immutable/chunks/DbUpsjvX.js","_app/immutable/chunks/ghclKoKz.js","_app/immutable/chunks/1c6Rvobr.js","_app/immutable/chunks/BdamqLsw.js"];
export const stylesheets = [];
export const fonts = [];
