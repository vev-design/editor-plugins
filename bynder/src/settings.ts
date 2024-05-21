import { BynderClient } from "./client";
import { VevProps } from '@vev/utils';

type settingsType = "global" | "workspace" | "team" | "meta_fields" | null;

export type EditorPluginAssetSourceFilterField = {
  label: string;
  value: string;
  fields: { label: string; value: string }[];
};
export type EditorPluginAssetSourceFilterFields = EditorPluginAssetSourceFilterField[];

export function getSettingsPath(url: string): settingsType {
  try {
    let settings = url.split("/").splice(-2)[0];
    let type = url.split("/").splice(-1)[0];

    if (
      settings === "settings" &&
      (type === "global" ||
        type === "workspace" ||
        type === "team" ||
        type === "meta_fields")
    ) {
      return type;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function getMetaFields(
  client: BynderClient,
  assetType: ("image" | "video" | "other")[]
): Promise<EditorPluginAssetSourceFilterFields> {
  const metaProps: EditorPluginAssetSourceFilterFields = [];
  const allMetaProperties = await client.getAllMetaProperties(assetType);

  Object.keys(allMetaProperties).forEach(
    (key) => {
      const metaProperty = allMetaProperties[key];
      metaProps.push({
        label: metaProperty.label,
        value: metaProperty.name,
        fields: metaProperty.options.map((option) => {
          return {
            label: option.label,
            value: option.name
          };
        })
      })
    }
  );

  return metaProps;
}

export async function getSettings(
  type: settingsType,
  client: BynderClient,
  assetType: ("image" | "video" | "other")[]
): Promise<any> {
  switch (type) {
    case "global":
      return getSettingsForm(client, assetType);
    case "team":
      return getSettingsForm(client, assetType);
    case "workspace":
      return getSettingsForm(client, assetType);
  }
}

async function getSettingsForm(
  client: BynderClient,
  assetType: ("image" | "video" | "other")[]
): Promise<{ form: VevProps[] }> {
  const allMetaProperties = await client.getAllMetaProperties(assetType);

  const metaPropItems: VevProps[] = Object.keys(allMetaProperties).map(
    (key) => {
      const metaProperty = allMetaProperties[key];
      metaProperty.options.unshift({label: ' ', name: null})
      return {
        name: metaProperty.name,
        title: metaProperty.label,
        type: "select",
        options: {
          multiselect: false,
          display: "autocomplete",
          items: metaProperty.options.map((option) => {
            return {
              label: option.label,
              value: option.name,
            };
          }),
        },
      };
    }
  );

  return {
    form: [
      {
        type: "object",
        name: "property_filter",
        title: "Filter on meta data",
        fields: [...metaPropItems],
      },
    ],
  };
}

export type RequestProperties = {
  assetType?: "image" | "video" | "other";
  filter?: { field: string; value: string }[];
  property_filter?: Record<string, string | null>;
};

export async function getPropertiesFromRequest(
  request: Request
): Promise<RequestProperties> {
  try {
    const properties = await request.json();
    properties.assetType = properties.assetType.toLowerCase();
    return properties as RequestProperties;
  } catch (e) {
    console.log(e);
    console.log("No request body");
    return {};
  }
}
