import { ScanResult } from './api-models/ScanResult';
import { ExcludeReason } from '.';

/**
 * Represents a `ScanResult` and its `id`
 */
export interface ResultItem {
	id: string;
	result: ScanResult;
}

export interface Range {
	start: number;
	end: number;
}

/**
 * Represents a suspected part of a scanned document content either **text** or **html**
 * @extends Range
 */
export interface Match extends Range {
	/**
	 * The suspicion type associated with this suspected match
	 */
	type: MatchType;
	/**
	 * The scan ids that are associated with this suspected match
	 */
	ids?: string[];
	/**
	 * associated group id - relevant to **html** content
	 */
	gid?: number;
	/**
	 * associated exclude reason - relevant to **excluded** match type
	 */
	reason?: ExcludeReason;
}

/**
 * Enum of possible kinds of suspicion a match could have
 */
export enum MatchType {
	excluded = -1,
	identical = 0,
	minorChanges = 1,
	relatedMeaning = 2,
	none = 3,
}

/**
 * Enum of possible kinds of an endpoint could have
 */
export enum EndpointKind {
	start,
	end,
}

/**
 * Represents a the actual string `content` that a `match` is representing
 */
export interface SlicedMatch {
	content: string;
	match: Match;
}

/**
 * Represents a numeric endpoint with an `index` and a `kind`.
 */
export interface Endpoint {
	index: number;
	kind: EndpointKind;
}
/**
 * Represents an endpoint in a `ScannedDocument` content, either **text** or **html**.
 */
export interface MatchEndpoint extends Endpoint {
	type: MatchType;
	ids?: string[];
	gid?: number;
	reason?: ExcludeReason;
}
export type SubjectResultKey = 'source' | 'suspected';
export type ComparisonKey = 'identical' | 'minorChanges' | 'relatedMeaning';
export type ContentKey = 'text' | 'html';
export type MatchUnit = 'chars' | 'words';
