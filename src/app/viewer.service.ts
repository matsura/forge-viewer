import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/takeUntil';
import { of } from 'rxjs/observable/of';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class ViewerService {

  private token = '';
  private bucketKey = '-_sarajevo01';
  private baseUrl = 'https://developer.api.autodesk.com/';

  setToken(token: string): void {
    this.token = token;
  }

  constructor(private http: HttpClient) {}

  prepareFile(file: File): Observable<any> {

    const formattedToken = 'Bearer ' + this.token;
    const headers: HttpHeaders = (new HttpHeaders()).set('Authorization', formattedToken);
    return Observable.create((observer: Observer<any>) => {

      const uploadRequest = new XMLHttpRequest();
      uploadRequest.open('PUT', this.baseUrl + 'oss/v2/buckets/' + this.bucketKey + '/objects/' + file.name, true);
      uploadRequest.onreadystatechange = () => {

        if (uploadRequest.readyState === XMLHttpRequest.DONE) {
          const uploadResponse: { objectId: string } = JSON.parse(uploadRequest.response);
          const encodedUrn = btoa(uploadResponse.objectId);
          let nonPaddedUrn = '';
          for (let i = 0; i < encodedUrn.length; i++) {
            if (encodedUrn[i] === '=') {
              continue;
            }
            nonPaddedUrn += encodedUrn[i];
          }
          this.http
            .post(this.baseUrl + 'modelderivative/v2/designdata/job', {
              input: {
                urn: nonPaddedUrn
              },
              output: {
                formats: [
                  {
                    type: 'svf',
                    views: [
                      '2d',
                      '3d'
                    ]
                  }
                ]
              }
            }, { headers } )
            .subscribe((response: {}) => {

            const subscription: Subscription = Observable
              .interval(1000)
              .switchMap(() => this.http
                .get(this.baseUrl + 'modelderivative/v2/designdata/' + nonPaddedUrn + '/manifest', { headers }))
              .subscribe((jobResponse: { status: string, progress: string }) => {

                if (jobResponse.status === 'success' && jobResponse.progress === 'complete') {
                  observer.next(nonPaddedUrn);
                  subscription.unsubscribe();
                }
              });
            });
        }
      };
      uploadRequest.setRequestHeader('Authorization', formattedToken);
      uploadRequest.send(file);
    });
  }
}
