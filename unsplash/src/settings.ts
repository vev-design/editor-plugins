import { VevProps } from '@vev/utils';
import {
  SettingsType,
  getSettingsPath,
  getPropertiesFromRequest as getPropertiesFromRequestBase,
} from 'shared';

export { getSettingsPath };

async function getSettingsForm(): Promise<{ form: VevProps[] }> {
  return {
    form: [
      {
        name: 'selfHostAssets',
        title: 'Self host assets',
        type: 'boolean',
      },
    ],
  };
}

export async function getSettings(type: SettingsType): Promise<any> {
  switch (type) {
    case 'global':
      return getSettingsForm();
  }
}

export type RequestProperties = {
  selfHostAssets?: boolean;
  assetType?: 'IMAGE' | 'VIDEO' | 'OTHER';
  filter?: Record<string, string>;
};

export async function getPropertiesFromRequest(request: Request): Promise<RequestProperties> {
  return getPropertiesFromRequestBase<RequestProperties>(request);
}
