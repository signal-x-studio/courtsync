

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const universal = {
  "load": null,
  "ssr": false
};
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.6AKdm_zW.js","_app/immutable/chunks/BNlA6_UX.js","_app/immutable/chunks/-KxTRp3Z.js","_app/immutable/chunks/CqIFxbK-.js","_app/immutable/chunks/TOAQLBvW.js","_app/immutable/chunks/BKCavI18.js","_app/immutable/chunks/Cy9E0dei.js","_app/immutable/chunks/CdWAJnwr.js"];
export const stylesheets = [];
export const fonts = [];
