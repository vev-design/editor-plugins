import { VevProps } from "@vev/utils";

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
  assetType?: "IMAGE" | "VIDEO" | "OTHER";
  filter?: { field: string; value: string }[];
  property_filter?: Record<string, string | null>;
};

export async function getPropertiesFromRequest(
  request: Request
): Promise<RequestProperties> {
  try {
    const properties = await request.json();
    return properties as RequestProperties;
  } catch (e) {
    console.log(e);
    console.log("No request body");
    return {};
  }
}

