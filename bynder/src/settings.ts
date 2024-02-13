import { BynderClient } from "./client";
import { VevProps } from "@vev/react";

type settingsType = "global" | "workspace" | "team" | null;

export function getSettingsPath(url: string): settingsType {
  try {
    let settings = url.split("/").splice(-2)[0];
    let type = url.split("/").splice(-1)[0];

    if (
      settings === "settings" &&
      (type === "global" || type === "workspace" || type === "team")
    ) {
      return type;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function getSettings(
  type: settingsType,
  client: BynderClient,
  assetType: ("image" | "video")[]
): Promise<any> {
  switch (type) {
    case "global":
      return getWorkspaceSettings(client, assetType);
    case "team":
      return getWorkspaceSettings(client, assetType);
    case "workspace":
      return getWorkspaceSettings(client, assetType);
  }
}

async function getWorkspaceSettings(
  client: BynderClient,
  assetType: ("image" | "video")[]
): Promise<{ form: VevProps[] }> {
  const allMetaProperties = await client.getAllMetaProperties(assetType);

  const metaPropItems: VevProps[] = Object.keys(allMetaProperties).map(
    (key) => {
      const metaProperty = allMetaProperties[key];
      return {
        name: metaProperty.name,
        title: metaProperty.label,
        type: "select",
        options: {
          multiselect: true,
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
    form: [...metaPropItems],
  };
}
