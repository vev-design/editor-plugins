import { VevProps } from "@vev/utils";
import { MetaFields } from './metaFields';

type settingsType = "global" | "workspace" | "team" | "meta_fields" | null;
export function getPath(url: string): settingsType {
  try {
    let settings = url.split("/").splice(-2)[0];
    let type = url.split("/").splice(-1)[0];


    if (
      settings === "settings" &&
      (type === "global" || type === "workspace" || type === "team" || type === "meta_fields")
    ) {
      return type;
    }

    return null;
  } catch (e) {
    return null;
  }
}

async function getSettingsForm(): Promise<{ form: VevProps[] }> {
  return {
    form: [
      {
        name: "selfHostAssets",
        title: "Self host assets",
        type: "boolean",
      },
    ],
  };
}

export async function getSettings(type: settingsType): Promise<any> {
  switch (type) {
    case "global":
      return getSettingsForm();
  }
}

export type RequestProperties = {
  selfHostAssets?: boolean;
  assetType?: "IMAGE" | "VIDEO" | "OTHER";
  filter?: Record<string, string>;
};

export async function getPropertiesFromRequest(
  request: Request
): Promise<RequestProperties> {
  try {
    return await request.json();
  } catch (e) {
    console.log(e);
    console.log("No request body");
    return {};
  }
}
