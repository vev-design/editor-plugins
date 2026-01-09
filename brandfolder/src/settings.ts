import { BrandfolderClient } from './client';
import { VevProps } from '@vev/utils';

type settingsType = 'global' | 'workspace' | 'team' | 'meta_fields' | null;

export type EditorPluginAssetSourceFilterField = {
  label: string;
  value: string;
  fields: { label: string; value: string }[];
};

export type EditorPluginAssetSourceFilterFields = EditorPluginAssetSourceFilterField[];

export function getSettingsPath(url: string): settingsType {
  try {
    const settings = url.split('/').splice(-2)[0];
    const type = url.split('/').splice(-1)[0];

    if (
      settings === 'settings' &&
      (type === 'global' || type === 'workspace' || type === 'team' || type === 'meta_fields')
    ) {
      return type;
    }

    return null;
  } catch (e) {
    return null;
  }
}

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

export async function getSettings(type: settingsType, client: BrandfolderClient): Promise<any> {
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
  try {
    const properties = await request.json();

    if (properties.assetType) {
      properties.assetType = properties.assetType.toLowerCase();
    }

    return properties as RequestProperties;
  } catch (e) {
    console.log(e);
    console.log('No request body');
    return {};
  }
}
