import { BrandfolderClient } from './client';
import { VevProps } from '@vev/utils';
import {
  SettingsType,
  EditorPluginAssetSourceFilterFields,
  getSettingsPath,
  getPropertiesFromRequest as getPropertiesFromRequestBase,
} from 'shared';

export { getSettingsPath };
export type { EditorPluginAssetSourceFilterFields };

export async function getMetaFields(
  client: BrandfolderClient,
  assetType: ('image' | 'video' | 'other')[],
): Promise<EditorPluginAssetSourceFilterFields> {
  const collections = await client.getCollections();
  const sections = await client.getSections();

  const metaProps: EditorPluginAssetSourceFilterFields = [];

  metaProps.push({
    label: 'Collection',
    value: 'collection',
    fields: collections.data.map((collection) => {
      return {
        label: collection.attributes.name,
        value: collection.attributes.name,
      };
    }),
  });

  metaProps.push({
    label: 'Section',
    value: 'section',
    fields: sections.data.map((section) => {
      return {
        label: section.attributes.name,
        value: section.attributes.name,
      };
    }),
  });

  return metaProps;
}

export async function getSettings(type: SettingsType, client: BrandfolderClient): Promise<any> {
  switch (type) {
    case 'global':
      return getSettingsForm(client);
    case 'team':
      return getSettingsForm(client);
    case 'workspace':
      return getSettingsForm(client);
  }
}

async function getSettingsForm(client: BrandfolderClient): Promise<{ form: VevProps[] }> {
  const brandfolders = await client.getBrandfolders();

  return {
    form: [
      {
        name: 'brandfolder_id',
        title: 'Brandfolder',
        type: 'select',
        options: {
          multiselect: false,
          display: 'autocomplete',
          items: brandfolders.data.map((bf) => {
            return {
              label: bf.attributes.name,
              value: bf.id,
            };
          }),
        },
      },
    ],
  };
}

export type RequestProperties = {
  assetType?: 'image' | 'video' | 'other';
  filter?: { field: string; value: string }[];
  property_filter?: Record<string, string | null>;
  brandfolder_id?: string;
};

export async function getPropertiesFromRequest(request: Request): Promise<RequestProperties> {
  return getPropertiesFromRequestBase<RequestProperties>(request, { normalizeAssetType: true });
}
