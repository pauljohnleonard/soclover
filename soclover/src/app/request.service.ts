import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class RequestService {
  constructor(public http: HttpClient) {}

  get(path: string): Promise<any> {
    return this.http.get<any>(environment.API_URL + path).toPromise();
  }
}
