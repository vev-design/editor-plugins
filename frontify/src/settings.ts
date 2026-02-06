import { FrontifyClient } from './client';
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

export async function getSettings(type: SettingsType, client: FrontifyClient): Promise<any> {
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
  return getPropertiesFromRequestBase<RequestProperties>(request, { normalizeAssetType: true });
}
