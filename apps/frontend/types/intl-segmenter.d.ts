
declare namespace Intl {
  type SegmenterGranularity = "grapheme" | "word" | "sentence";

  interface SegmentData {
    segment: string;
    index: number;
    input: string;
    isWordLike?: boolean;
  }

  interface Segments {
    [Symbol.iterator](): IterableIterator<SegmentData>;
    containing(codeUnitIndex?: number): SegmentData;
  }

  interface Segmenter {
    segment(input: string): Segments;
    resolvedOptions(): {
      locale: string;
      granularity: SegmenterGranularity;
    };
  }

  interface SegmenterOptions {
    localeMatcher?: "lookup" | "best fit";
    granularity?: SegmenterGranularity;
  }

  const Segmenter: {
    new (locales?: string | string[], options?: SegmenterOptions): Segmenter;
    supportedLocalesOf(
      locales: string | string[],
      options?: { localeMatcher?: "lookup" | "best fit" }
    ): string[];
  };
}