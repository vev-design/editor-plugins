import { FrontifyClient } from './client';
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
  client: FrontifyClient,
  assetType: ('image' | 'video' | 'other')[],
): Promise<EditorPluginAssetSourceFilterFields> {
  const libraries = await client.getMediaLibraries();

  const metaProps: EditorPluginAssetSourceFilterFields = [];

  metaProps.push({
    label: 'Libraries',
    value: 'library',
    fields: libraries.map((library) => {
      return {
        label: library.name,
        value: library.id,
      };
    }),
  });

  return metaProps;
}

export async function getSettings(type: settingsType, client: FrontifyClient): Promise<any> {
  switch (type) {
    case 'global':
      return getSettingsForm(client);
    case 'team':
      return getSettingsForm(client);
    case 'workspace':
      return getSettingsForm(client);
  }
}

async function getSettingsForm(client: FrontifyClient): Promise<{ form: VevProps[] }> {
  const brands = await client.getBrands();

  return {
    form: [
      {
        name: 'brand_id',
        title: 'Brand',
        type: 'select',
        options: {
          multiselect: false,
          display: 'autocomplete',
          items: brands.map((brand) => {
            return {
              label: brand.name,
              value: brand.id,
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
  brand_id?: string;
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
