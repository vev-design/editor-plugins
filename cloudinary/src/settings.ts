import { VevProps } from "@vev/utils";

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

export type RequestProperties = { selfHostAssets?: boolean, assetType?: 'image' | 'video' | 'other' };

export async function getPropertiesFromRequest(
  request: Request
): Promise<RequestProperties> {
  let body = null;
  try {
    return await request.json();
  } catch (e) {
    console.log(e);
    console.log("No request body");
    return {};
  }
}
