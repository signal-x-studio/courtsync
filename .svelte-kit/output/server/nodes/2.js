

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.DokpuKSZ.js","_app/immutable/chunks/BGoQ7gJS.js","_app/immutable/chunks/Pko6iT02.js","_app/immutable/chunks/Db87pd3s.js","_app/immutable/chunks/BaKoRTVr.js","_app/immutable/chunks/DOfG5Qiu.js","_app/immutable/chunks/BqARAWy1.js","_app/immutable/chunks/YAZl1wJw.js"];
export const stylesheets = [];
export const fonts = [];
