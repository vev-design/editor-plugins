export type SettingsType = 'global' | 'workspace' | 'team' | 'meta_fields' | 'asset_picker' | null;

export type EditorPluginAssetSourceFilterField = {
  label: string;
  value: string;
  fields: { label: string; value: string }[];
};

export type EditorPluginAssetSourceFilterFields = EditorPluginAssetSourceFilterField[];
