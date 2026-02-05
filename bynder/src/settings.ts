import { BynderClient } from './client';
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
  client: BynderClient,
  assetType: ('image' | 'video' | 'other')[],
): Promise<EditorPluginAssetSourceFilterFields> {
  const metaProps: EditorPluginAssetSourceFilterFields = [];
  const allMetaProperties = await client.getAllMetaProperties(assetType);

  Object.keys(allMetaProperties).forEach((key) => {
    const metaProperty = allMetaProperties[key];
    metaProps.push({
      label: metaProperty.label,
      value: metaProperty.name,
      fields: metaProperty.options.map((option) => {
        return {
          label: option.label,
          value: option.name,
        };
      }),
    });
  });

  return metaProps;
}

export async function getSettings(
  type: SettingsType,
  client: BynderClient,
  assetType: ('image' | 'video' | 'other')[],
): Promise<any> {
  switch (type) {
    case 'global':
      return getSettingsForm(client, assetType);
    case 'team':
      return getSettingsForm(client, assetType);
    case 'workspace':
      return getSettingsForm(client, assetType);
  }
}

async function getSettingsForm(
  client: BynderClient,
  assetType: ('image' | 'video' | 'other')[],
): Promise<{ form: VevProps[] }> {
  const allMetaProperties = await client.getAllMetaProperties(assetType);

  const metaPropItems: VevProps[] = Object.keys(allMetaProperties).map((key) => {
    const metaProperty = allMetaProperties[key];
    metaProperty.options.unshift({ label: ' ', name: null });
    return {
      name: metaProperty.name,
      title: metaProperty.label,
      type: 'select',
      options: {
        multiselect: false,
        display: 'autocomplete',
        items: metaProperty.options.map((option) => {
          return {
            label: option.label,
            value: option.name,
          };
        }),
      },
    };
  });

  return {
    form: [
      {
        type: 'object',
        name: 'property_filter',
        title: 'Filter on meta data',
        fields: [...metaPropItems],
      },
    ],
  };
}

export type RequestProperties = {
  assetType?: 'image' | 'video' | 'other';
  filter?: { field: string; value: string }[];
  property_filter?: Record<string, string | null>;
};

export async function getPropertiesFromRequest(request: Request): Promise<RequestProperties> {
  return getPropertiesFromRequestBase<RequestProperties>(request, { normalizeAssetType: true });
}
