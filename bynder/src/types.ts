export interface BynderAPIAsset {
  description: string;
  id: string;
  copyright: string;
  type: string;
  idHash: string;
  height: number;
  datePublished: string;
  fileSize: number;
  brandId: string;
  name: string;
  extension: string[];
  userCreated: string;
  dateCreated: string;
  isPublic: number;
  propertyOptions: string[];
  orientation: string;
  dateModified: string;
  width: number;
  watermarked: number;
  limited: number;
  archive: number;
  property_Division: string[];
  property_subterritory: string[];
  property_brand0: string[];
  property_cropnew: string[];
  property_territorynew: string[];
  property_usagerightsnew: string[];
  property_subassettypenew: string[];
  property_assettypenew: string[];
  transformBaseUrl: string;
  thumbnails: BynderAPIThumbnails;
}

export interface BynderAPIThumbnails {
  mini: string;
  transformBaseUrl: string;
  webimage: string;
  thul: string;
}

export interface BynderMetaProperty {
  label: string;
  name: string;
  options?: BynderMetaProperty[];
}

export type BynderMetaProperties = Record<string, BynderMetaProperty>;

export type KVBynderMetaProperties = Record<string, KVBynderMetaProperty>;

export interface KVBynderMetaProperty {
  label: string;
  name: string;
  options?: Record<string, KVBynderMetaProperty>;
}

export interface Filter {
  property_filter: Record<string, string[]>
}
