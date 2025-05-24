export interface DataRow {
  [key: string]: string | number | boolean | Date;
}
export interface Collaborator {
  email: string;
}export type VisibilityType = 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  createdAt: Date; 
  visibility: VisibilityType;
  collaborators: Collaborator[];
  owner:string
  rowCount: number;
  columnCount: number;
  payload: any[];
  schema?: any;
  data?: any[];
  updatedAt?: string;
  tags?:string[];

}


export interface DatasetDetails extends Omit<Dataset, 'data'> {
  collaborators: Collaborator[];
  schema?: any|null;
  payload: any;
  updatedAt: string;
  data?:any[];
}
export interface CreateDatasetRequest {
  name: string;
  description?: string;
  payload: any[];
  schema?: any;
  visibility: VisibilityType;
  collaborators:Collaborator[];
}