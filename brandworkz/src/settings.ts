import { BrandworkzClient } from './client';
import { VevProps } from '@vev/utils';
import {
  EditorPluginAssetSourceFilterFields,
  getPropertiesFromRequest as getPropertiesFromRequestBase,
  getSettingsPath,
  SettingsType,
} from 'shared';

export { getSettingsPath };
export type { EditorPluginAssetSourceFilterFields };

export async function getMetaFields(
  client: BrandworkzClient,
  assetType: ('image' | 'video' | 'other')[],
): Promise<EditorPluginAssetSourceFilterFields> {
  const metaProps: EditorPluginAssetSourceFilterFields = [];

  metaProps.push({
    label: 'Libraries',
    value: 'library',
    fields: [],
  });

  return metaProps;
}

export async function getSettings(type: SettingsType, client: BrandworkzClient): Promise<any> {
  switch (type) {
    case 'global':
      return getSettingsForm(client);
    case 'team':
      return getSettingsForm(client);
    case 'workspace':
      return getSettingsForm(client);
  }
}

async function getSettingsForm(client: BrandworkzClient): Promise<{ form: VevProps[] }> {
  return {
    form: [
      {
        name: 'brand_id',
        title: 'Brand',
        type: 'select',
        options: {
          multiselect: false,
          display: 'autocomplete',
          items: [],
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
