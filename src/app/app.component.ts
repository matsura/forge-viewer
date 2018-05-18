import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ViewerService } from './viewer.service';

declare const Autodesk: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'app';
  accessToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Imp3dF9zeW1tZXRyaWNfa2V5In0.eyJjbGllbnRfaWQiOiJhOUJYUlFHQ0gyNU11bVplVGJJNm1aRUxIdmRHM0dUeCIsImV4cCI6MTUyNjY1MzM1Mywic2NvcGUiOlsiZGF0YTpyZWFkIiwiYnVja2V0OmNyZWF0ZSIsImRhdGE6d3JpdGUiLCJidWNrZXQ6cmVhZCJdLCJhdWQiOiJodHRwczovL2F1dG9kZXNrLmNvbS9hdWQvand0ZXhwNjAiLCJqdGkiOiIxcVNzTlhSMVJ0b0pVOGdTUWtNWFZRWkhrbmtRdmprM3lhTlA3ZUNLNlJQb0RUTmEycHdSc2U4M1dYMFByMTBNIn0.vkeFeFWQwfIGI4K1f_PI3_QasHTQOGB-MPbYR2-zQoo';
  urlBase = 'https://developer.api.autodesk.com/';
  viewer = undefined;
  loading = false;

  @ViewChild('viewerContainer') viewerContainer: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(private viewerService: ViewerService) {}

  ngAfterViewInit(): void {}

  onFileUpload(event): void {
    this.loading = true;
    this.viewerService.setToken(this.accessToken);
    this.viewerService.prepareFile(event.target.files[0])
      .subscribe((urn: string) => {

        this.loading = false;
        const options = {
          env: 'AutodeskProduction',
          accessToken: this.accessToken
        };
        const documentId = 'urn:' + urn;
        Autodesk.Viewing.Initializer(options, () => {

          Autodesk.Viewing.Document.load(documentId, (doc) => {

            // A document contains references to 3D and 2D viewables.
            const viewables = Autodesk.Viewing.Document.getSubItemsWithProperties(doc.getRootItem(), { 'type': 'geometry' }, true);
            if (viewables.length === 0) {
              console.error('Document contains no viewables.');
              return;
            }

            // Choose any of the available viewables
            const initialViewable = viewables[0];
            const svfUrl = doc.getViewablePath(initialViewable);
            const modelOptions = {
              sharedPropertyDbPath: doc.getPropertyDbPath()
            };

            this.viewer = new Autodesk.Viewing.Private.GuiViewer3D(this.viewerContainer.nativeElement);
            this.viewer.start(svfUrl, modelOptions, (model) => {
              console.log('onLoadModelSuccess()!');
              console.log('Validate model loaded: ' + (this.viewer.model === model));
              console.log(model);
              this.viewer.fitToView();
            }, () => console.error('model not loaded'));
          }, (err, a) => {
            console.log(err, a);
          });
        });
      });
  }

  ngOnDestroy(): void {
    if (this.viewer) {
      this.viewer.tearDown();
      this.viewer.finish();
      this.viewer = undefined;
    }
  }
}
