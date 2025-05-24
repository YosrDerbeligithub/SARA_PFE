import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface DatasetAttributes {
  datasetId: number;
  name: string;
  attributes: AttributeNode[];
}

interface AttributeNode {
  name: string;
  path: string;
  children: AttributeNode[];
}

@Injectable({ providedIn: 'root' })
export class CustomDatasetService {
  private apiUrl = 'http://localhost:8081/datasets/attributes';

  constructor(private http: HttpClient) {}

  getDatasetAttributes(): Observable<DatasetAttributes[]> {
    return this.http.get<DatasetAttributes[]>(this.apiUrl).pipe(
      map(datasets =>
        datasets.map(ds => ({
          ...ds,
          attributes: this.normalizeAttributes(ds.attributes)
        }))
      )
    );
  }

  private normalizeAttributes(nodes: AttributeNode[]): AttributeNode[] {
    return nodes.map(node => ({
      ...node,
      children: this.normalizeAttributes(node.children)
    }));
  }
}