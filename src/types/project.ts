import { LatLngTuple } from 'leaflet';

export interface Design {
  id: string;
  created_at?: string;
  project_id?: string;
  name: string;
  lastModified: Date;
  nameplate: string;
  field_segments?: FieldSegment[];
}

export interface ProjectData {
  id?: string;
  created_at?: string;
  projectName: string;
  description: string;
  address: string;
  projectType: 'Residential' | 'Commercial' | 'Industrial';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface MapSettings {
  center: [number, number];
  zoom: number;
}

export interface PanFile {
  [key:string]: string | number;
}

export interface Module {
  id: string;
  created_at: string;
  model_name: string;
  manufacturer?: string;
  technology?: string;
  max_power_pmp?: number;
  raw_pan_data?: PanFile;
  width?: number;  // in meters
  height?: number; // in meters
  voc?: number;
  isc?: number;
  vmp?: number;
  imp?: number;
  n_cells_in_series?: number;
  n_cells_in_parallel?: number;
  n_diodes?: number;
  p_nom_tol_low?: number;
  p_nom_tol_up?: number;
  mu_isc?: number;
  mu_voc_spec?: number;
  mu_pmp_req?: number;
  gamma_ref?: number;
  mu_gamma?: number;
  r_s?: number;
  r_sh_ref?: number;
  r_sh_0?: number;
  r_sh_exp?: number;
  i_l_ref?: number;
  i_o_ref?: number;
  data_source?: string;
}

export interface FieldSegment {
  id: string;
  points: LatLngTuple[];
  area: number; // in sq feet
  nameplate: number; // in kW
  moduleCount: number;
  moduleId?: string;
  moduleLayout?: LatLngTuple[][]; // Array of polygons for each module
  azimuth: number; // For orientation
  
  // New properties from image
  description?: string;
  rackingType?: 'Fixed Tilt' | 'Flush Mount';
  surfaceHeight?: number;
  rackingHeight?: number;
  moduleTilt?: number;
  orientation?: 'Portrait' | 'Landscape';
  frameSizeUp?: number;
  frameSizeWide?: number;
  rowSpacing?: number; // In feet
  spanRise?: number;
  moduleSpacing?: number; // In feet
  gcr?: number;
  frameSpacing?: number;
  setback?: number; // In feet
  alignment?: 'left' | 'center' | 'right' | 'justify';
}