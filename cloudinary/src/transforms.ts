const splitRegex = /(https:\/\/res\.cloudinary\.com\/.*?\/.*?\/.*?\/)(.*)/;
const thumbnailTransforms = "h_200";
const videoThumbnailTransform = "h_200,du_2";

interface IASSET_TRANSFORMS {
  IMAGE: string;
  VIDEO: string;
  VIDEO_THUMB: string;
}
const ASSET_TRANSFORMS: IASSET_TRANSFORMS = {
  IMAGE: "h_200",
  VIDEO: "h_200,du_2,ac_none",
  VIDEO_THUMB: "h_200",
};

export function createThumbnail(
  url: string,
  transform: keyof IASSET_TRANSFORMS
) {
  try {
    if (transform == "VIDEO_THUMB") {
      const split = url.split(".");
      split[split.length - 1] = "png";
      url = split.join(".");
    }
    const match = url.match(splitRegex);
    return `${match[1]}${ASSET_TRANSFORMS[transform]}/${match[2]}`;
  } catch (e) {
    return url;
  }
}
