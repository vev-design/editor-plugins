import { Client } from "./client";

export type MetaFields = Record<string, string[]>;

export async function getMetaFields(client: Client): Promise<MetaFields> {
  const tags = await client.getTags();
  return { tags };
}
