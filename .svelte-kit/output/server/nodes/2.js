

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.BleoyIw1.js","_app/immutable/chunks/CR2NmSyQ.js","_app/immutable/chunks/DTDYVkq9.js","_app/immutable/chunks/C4fi0Pf4.js","_app/immutable/chunks/Dic7hVay.js","_app/immutable/chunks/Cpy35fQB.js","_app/immutable/chunks/DkSoYLQ2.js","_app/immutable/chunks/D9R81Zpj.js"];
export const stylesheets = [];
export const fonts = [];
