# Copyleaks plagiarism report

[![npm:badge]][npm:page]

This allows you to view Copyleaks plagiarism report on your website. The report is based on Copyleaks scan results you downloaded via [Copyleaks API][api]. By using this component you can view the report anytime without being restricted by the Copyleaks expiration policy and control access policy to the information for your users.

## [Demo][demo:repo]

![](https://app.copyleaks.com/assets/images/shared/opening-message-new.gif)

## Setup instructions
[<img src="https://user-images.githubusercontent.com/58811253/163325328-0cdb2900-9bff-45d1-86e3-0a53fc15e64c.png" width="50%">](https://player.vimeo.com/video/698567593?h=dca8fd648a "Copyleaks plagiarism report guide")

## Requirements

- You should have a [Copyleaks account][api:register] and be able to complete a successful scan and store the results on your end
- Server side application with access to stored Copyleaks reports
- A web application with Angular version 8.x +

## Integration

You must use this module with data generated by Copyleaks API. In general these are the steps you should follow:
1. Create an account on [Copyleaks][api:register]
2. Use [Copyleaks API][api] to scan for plagiarism
3. Use the [Export Methods][api:export] to extract data and save it on your server / cloud
4. Create http endpoints to access the stored data (completed, source, pdf-report, results)
5. Present the data in your website via Copyleaks plagiarism report

## Installation

Choose the version corresponding to your Angular version:

 Angular     | @copyleaks/plagiarism-report
 ----------- | -------------------
 13          | 4.x+
 9           | 3.x+              
 8           | 2.x+ 

Install using npm 

```bash
npm install --force
```

## Usage

> **Note:** Copyleaks plagiarism report is built to work with data received from [Copyleaks API](). The responsibility for storing the data and serving it is in your hands.

Add `CopyleaksReportModule, HttpClientModule` to your module's imports

```ts
//...
import { CopyleaksReportModule } from "@copyleaks/plagiarism-report";
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  imports: [
    // ...
    CopyleaksReportModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

Add the component to your template

```html
<cr-copyleaks-report> </cr-copyleaks-report>
```

Inject `CopyleaksService` to your Component

```ts
export class SomeComponent {
  constructor(private copyleaksService: CopyleaksService, private http: HttpClient) {
    //...
  }
}
```
```bash
ng serve --open
```

### Basic usage
> **Note:** This example assumes you have already downloaded and stored the data generated by copyleaks API

The component must be provided with the data generated by Copyleaks API.
As mentioned above, your server must store that data, so your front end could access it via http requests. That means your server should support serving the following data:

- Endpoint to get the Complete Result of a scan by `scan id`
- Endpoint to get the Source of a scan by `scan id`
- Endpoint to get a specific Result of a scan by `scan id` and a `result id`
- (optional) Endpoint to download the Pdf of a scan by `scan id`

**Example for the endpoints mentioned above:**
- `yourwebsite.com/copyleaks/{scanId}/completed`
- `yourwebsite.com/copyleaks/{scanId}/source`
- `yourwebsite.com/copyleaks/{scanId}/results/{resultId}`
- `yourwebsite.com/copyleaks/{scanId}/pdf`

Provide the data with `CopyleaksService` after downloading it from your server.

```ts
@Component({
  // ...
})
export class CopyleaksReportPageComponent implements OnInit {
	public config: CopyleaksReportConfig = {};

	constructor(
		private reportService: CopyleaksService,
		private scanService: ScanService,
		private activatedRoute: ActivatedRoute
	) { }

	ngOnInit(): void {
		const scanId = this.activatedRoute.snapshot.params.scanId;
		this._buildCopyleaksReportAsync(scanId);
	}

	private async _buildCopyleaksReportAsync(scanId: string) {
		try {
			/** crawled version handling */
			const source = await this.scanService.getCrawledVersionAsync(scanId);
			this.reportService.pushDownloadedSource(source);

			/** complete result handling */
			const complete = await this.scanService.getCompleteResultAsync(scanId);
			this.reportService.pushCompletedResult(complete);

			/**
			 * Scan results handling
			 *
			 * for more informations about completeResult.results please see
			 * https://api.copyleaks.com/documentation/v3/webhooks/completed
			 */
			const allResultsIds = [
				...complete.results.internet.map((r) => r.id),
				...complete.results.database.map((r) => r.id),
				...complete.results.batch.map((r) => r.id),
				...complete.results.repositories.map((r) => r.id),
			];
			await Promise.all(
				allResultsIds.map(async (id) => {
					const result = await this.scanService.getResultByIdAsync(scanId, id);
					this.reportService.pushScanResult({ id, result });
				})
			);
		} catch (error) {
			/** Handle error */
			console.error(error);
		}
	}
}
```
## Configuration

It is possible to configure the behavior, and the look and state of the report by providing a config via the following methods:

**Via component input property:**

> **Note:** You can pass the complete config or only a portion of it to the `config` input property

```html
<!-- some.component.html -->
<cr-copyleaks-report [config]="config"> </cr-copyleaks-report>
```

```ts
// some.component.ts
@Component({
  // ...
})
export class SomeComponent {
  //default config
  public config: CopyleaksReportConfig = {
    contentMode: "html",
    download: false,
    help: false,
    disableSuspectBackButton: false,
    options: {
      showPageSources: false,
      showOnlyTopResults: true,
      showRelated: true,
      showIdentical: true,
      showMinorChanges: true,
      setAsDefault: false
    },
    scanId: null,
    share: false,
    sourcePage: 1,
    suspectId: null,
    suspectPage: 1,
    viewMode: "one-to-many"
  };
}
```

**Via CopyleaksService:**

> **Note:** You can pass the complete config or only a portion of it to the `setConfig()` method

```ts
// some.component.ts
@Component({
  // ...
})
export class SomeComponent {
  // plagiarism report will be shown as html
  showHtml() {
    copyleaksService.setConfig({ contentMode: "html" });
  }
  //...
}
```

## Interaction

The component exposes the following events:

| name         | `$event`                | description                                    |
| ------------ | ----------------------- | ---------------------------------------------- |
| help         | `MouseEvent`            | emits when the user clicks the help button     |
| share        | `MouseEvent`            | emits when the user clicks the share button    |
| download     | `MouseEvent`            | emits when the user clicks the download button |
| configChange | `CopyleaksReportConfig` | emits when the config is changed               |

You can use it like so:

```html
<cr-copyleaks-report
  (configChange)="onConfigChange($event)"
  (help)="onHelpBtnClick($event)"
  (share)="onShareBtnClick($event)"
  (download)="onDownloadBtnClick($event)"
></cr-copyleaks-report>
```

## FAQ

**My website is not using Angular 8+, can I use this component?**

No, this component requires Angular 'v8.x'+.
Alternatively, you can create an Angular web application that uses this library and include it in your website using routing. This solution should work with any web framework.

**Can I modify this component for my own usage?**

Modifying the component is allowed according to the [License](./license).

## Accessibility
The [VPAT report (PDF)](https://copyleaks.com/accessibility/) can be downloaded from Copyleaks Commitment to Accessibility page 
## Additional Reading Sources

- [Showing Progress on the report](./ADVANCE_README_PROGRESS.md).
- [Real-Time usage](./ADVANCE_README_REAL_TIME.md).

[api]: https://api.copyleaks.com
[api:register]: https://api.copyleaks.com/account-ui/register
[api:completed]: https://api.copyleaks.com/documentation/v3/webhooks/completed
[api:newresult]: https://api.copyleaks.com/documentation/v3/webhooks/new-result
[api:export]: https://api.copyleaks.com/documentation/v3/downloads/export
[api:webhooks]: https://api.copyleaks.com/documentation/v3/webhooks
[api:submit:file]: https://api.copyleaks.com/documentation/v3/education/submit/file
[copyleaks]: https://copyleaks.com
[demo]: https://codesandbox.io/s/github/Copyleaks/plagiarism-report-demo/tree/master/?fontsize=14&hidenavigation=1&module=%2Fsrc%2Fapp%2Fapp.component.ts&theme=dark&view=preview
[demo:repo]: https://github.com/Copyleaks/plagiarism-report-demo
[npm:page]: https://www.npmjs.com/package/@copyleaks/plagiarism-report
[npm:badge]: https://img.shields.io/npm/v/@copyleaks/plagiarism-report.svg?style=flat-square
