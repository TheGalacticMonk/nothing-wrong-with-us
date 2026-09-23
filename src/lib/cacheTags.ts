/** Cache tags shared by the data loaders (src/lib/content.ts) and the revalidation hooks. */
export const globalTag = (slug: string) => `global:${slug}`
export const collectionTag = (slug: string) => `collection:${slug}`
