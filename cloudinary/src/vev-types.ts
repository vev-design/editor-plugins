type ImageSizes = Record<number, string>;
type MetaData = Record<string, string>;

export interface BaseProjectAsset {
  key: string;
  mimeType: string; // https://www.iana.org/assignments/media-types/media-types.xhtml
  url: string;
  filename?: string;
  metaData?: MetaData;
  selfHosted?: boolean;
}

export interface ProjectImageAsset extends BaseProjectAsset {
  dimension?: { width: number; height: number };
  thumb?: string;
  imageSizes?: ImageSizes;
}

export interface ProjectVideoAsset extends BaseProjectAsset {
  videoThumbnail?: string;
  videoSample?: string;
  dimension?: { width: number; height: number };
  duration?: number;
  additionalSources: Omit<ProjectVideoAsset, 'additionalSources'>[];
}

export type ProjectAsset = BaseProjectAsset | ProjectImageAsset | ProjectVideoAsset;
