

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.D8SBNVpp.js","_app/immutable/chunks/C4ilCsHB.js","_app/immutable/chunks/DVX6VRk5.js","_app/immutable/chunks/DatUqRBN.js","_app/immutable/chunks/DOd7VXKj.js","_app/immutable/chunks/BA7jJIuj.js","_app/immutable/chunks/DQzpnLv7.js","_app/immutable/chunks/39mQBiRJ.js"];
export const stylesheets = [];
export const fonts = [];
