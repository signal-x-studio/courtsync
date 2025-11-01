

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.D0xeAivs.js","_app/immutable/chunks/2ojvjqKR.js","_app/immutable/chunks/D8fu8Nzm.js","_app/immutable/chunks/nXSXTBA3.js","_app/immutable/chunks/SwpKXNH_.js","_app/immutable/chunks/DpoftvwD.js","_app/immutable/chunks/yzwITP8F.js","_app/immutable/chunks/JnmbpHr6.js","_app/immutable/chunks/CPq9J1Yd.js"];
export const stylesheets = ["_app/immutable/assets/2.BdyjYDQ2.css"];
export const fonts = [];
