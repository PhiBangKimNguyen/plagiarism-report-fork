import { Component, ElementRef, HostBinding, HostListener, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { untilDestroy } from '../../../shared/operators/untilDestroy';
import { Match, MatchType, PostMessageEvent, MatchSelectEvent, MatchJumpEvent } from '../../models';
import { HighlightService } from '../../services/highlight.service';
import { ReportService } from '../../services/report.service';
import { truthy } from '../../utils/operators';
import iframeScript from './one-to-one-frame-helper';
import { EXCLUDE_MESSAGE } from '../../utils/constants';
import { withLatestFrom, filter, tap } from 'rxjs/operators';
import { findRespectiveStart } from '../../utils/highlight-helpers';
import { MatchService } from '../../services/match.service';
/** used for importing css as a string */
declare var require: any;
/** import css as a string */
const iframeStyle = require('./frame-helper-style.css') as any;
@Component({
	selector: 'iframe[cr-suspect-frame-helper]',
	template: '',
})
export class SuspectFrameHelperComponent implements OnInit, OnDestroy {
	constructor(
		public element: ElementRef<HTMLIFrameElement>,
		private reportService: ReportService,
		private matchService: MatchService,
		private highlightService: HighlightService,
		private renderer: Renderer2
	) {
		const css = renderer.createElement('style') as HTMLStyleElement;
		css.textContent = iframeStyle;
		this.style = css.outerHTML;
		const js = renderer.createElement('script') as HTMLScriptElement;
		js.textContent = iframeScript;
		this.script = js.outerHTML;
	}

	get frame() {
		return this.element.nativeElement.contentWindow;
	}
	@HostBinding('attr.seamless') readonly seamless = true;
	@HostBinding('attr.sandbox') readonly sandbox = 'allow-scripts';

	private style: string;
	private html: string;
	private script: string;
	private matches: Match[];

	/**
	 * Handles PostMessage events, making sure its from the correct iframe.
	 * @param event the default PostMessage event
	 */
	@HostListener('window:message', ['$event'])
	onFrameMessage(event: MessageEvent) {
		const { source, data } = event;
		if (source !== this.frame) {
			return;
		}
		const pmevent = data as PostMessageEvent;
		switch (pmevent.type) {
			case 'match-select':
				this.handleMatchSelect(pmevent);
				break;
			case 'match-warn':
				// TODO
				console.warn('match not found');
				break;
			default:
				console.error('unknown event', pmevent);
		}
	}

	/**
	 * Send a message to the iframe using PostMessage API
	 * @param data the data to post
	 */
	messageFrame(data: any) {
		if (this.frame) {
			this.frame.postMessage(data, '*');
		}
	}

	/**
	 * highlight a single match in the iframe
	 * @param index the index of the match to mark
	 */
	markSingleMatchInFrame(index: number) {
		this.messageFrame({ type: 'match-select', index } as MatchSelectEvent);
	}

	/**
	 * Render list of matches in the iframe's HTML
	 * @param matches the matches to render
	 */
	renderMatches(matches: Match[]) {
		this.matches = matches;
		const html = matches.reduceRight((prev: string, curr: Match, i: number) => {
			let slice = this.html.substring(curr.start, curr.end);
			switch (curr.type) {
				case MatchType.excluded:
					slice = `<span exclude title="${EXCLUDE_MESSAGE[curr.reason]}">${slice}</span>`;
					break;
				case MatchType.none:
					break;
				default:
					slice = `<span match data-type="${curr.type}" data-index="${i}" data-gid="${curr.gid}">${slice}</span>`;
					break;
			}
			return slice.concat(prev);
		}, '');
		this.renderer.setAttribute(this.element.nativeElement, 'srcdoc', html + this.style + this.script);
	}

	/**
	 * Handles the `match-select` event
	 * @param event the event object containing the match `index`
	 */
	handleMatchSelect(event: MatchSelectEvent) {
		this.matchService.setSuspectHtmlMatch(event.index !== -1 ? this.matches[event.index] : null);
	}
	/**
	 * Life-cycle method
	 * empty for `untilDestroy` rxjs operator
	 */
	ngOnDestroy() {}
	/**
	 * Life-cycle method
	 * subscribe to:
	 * - suspect changes
	 * - view mode changes
	 * - source and suspect html matches
	 */
	ngOnInit() {
		const { suspect$, viewMode$ } = this.reportService;
		const { sourceHtml$, jump$ } = this.matchService;
		const { suspectHtmlMatches$ } = this.highlightService;
		suspect$
			.pipe(
				untilDestroy(this),
				truthy()
			)
			.subscribe(suspect => suspect.result.html && (this.html = suspect.result.html.value));
		suspectHtmlMatches$.pipe(untilDestroy(this)).subscribe(matches => this.renderMatches(matches));
		jump$
			.pipe(
				untilDestroy(this),
				withLatestFrom(viewMode$),
				filter(([_, mode]) => mode === 'one-to-one')
			)
			.subscribe(([forward]) => this.messageFrame({ type: 'match-jump', forward } as MatchJumpEvent));
		sourceHtml$
			.pipe(
				tap(console.log),
				withLatestFrom(suspect$)
			)
			.subscribe(([match, suspect]) => {
				if (match && suspect) {
					const comparison = suspect.result.html.comparison[MatchType[match.type]];
					const [start] = findRespectiveStart(match.start, comparison, true);
					const found = this.matches.findIndex(m => m.start === start);
					this.markSingleMatchInFrame(found);
				} else {
					this.markSingleMatchInFrame(-1);
				}
			});
	}
}
