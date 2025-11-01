

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/style-guide/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/style-guide/+page.ts";
export const imports = ["_app/immutable/nodes/3.Bt3RioVq.js","_app/immutable/chunks/2ojvjqKR.js","_app/immutable/chunks/D8fu8Nzm.js","_app/immutable/chunks/nXSXTBA3.js","_app/immutable/chunks/DpoftvwD.js","_app/immutable/chunks/JnmbpHr6.js"];
export const stylesheets = [];
export const fonts = [];
