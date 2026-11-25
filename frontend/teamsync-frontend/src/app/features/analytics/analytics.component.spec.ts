import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import AnalyticsComponent from './analytics.component';

describe('Analytics report downloads', () => {
  it('requests selected sections, preserves the default, and prevents an empty customized download', () => {
    TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const component = TestBed.createComponent(AnalyticsComponent).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const reportUrl = (req: { url: string }) => req.url.endsWith('/reports/projects/project-1');
    component.selectedProjectId = 'project-1';

    component.downloadReport('json');
    const standard = http.expectOne(reportUrl);
    expect(standard.request.params.has('sections')).toBe(false);
    standard.flush(null, { status: 400, statusText: 'Test response' });

    component.customizeReport = true;
    component.reportSections.forEach(section => { section.selected = section.key === 'progress'; });
    component.downloadReport('pdf');
    const custom = http.expectOne(reportUrl);
    expect(custom.request.params.get('sections')).toBe('progress');
    expect(custom.request.params.get('format')).toBe('pdf');
    expect(custom.request.params.get('download')).toBe('true');
    expect(custom.request.responseType).toBe('blob');
    custom.flush(null, { status: 400, statusText: 'Test response' });

    component.reportSections.forEach(section => { section.selected = false; });
    expect(component.canDownloadReport).toBe(false);
    component.downloadReport('csv');
    http.expectNone(reportUrl);
    http.verify();
  });
});
