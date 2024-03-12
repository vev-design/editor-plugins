export interface SearchResponse {
  total_count: number
  time: number
  next_cursor: string
  resources: Resource[]
}

export interface Resource {
  asset_id: string
  public_id: string
  folder: string
  filename: string
  format: string
  version: number
  duration: number
  resource_type: 'image' | 'video' | 'raw'
  type: string
  created_at: string
  uploaded_at: string
  bytes: number
  backup_bytes: number
  width: number
  height: number
  aspect_ratio: number
  pixels: number
  url: string
  secure_url: string
  status: string
  access_mode: string
  access_control: any
  etag: string
  created_by: any
  uploaded_by: any
}
