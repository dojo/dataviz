/**
 * Provides the interface for the invalidate() method from dojo-widgets/mixins/createCachedRenderMixin.
 *
 * It's used in mixins that are designed to be used with a class that contains an invalidate() implementation. Using
 * this interface, and leaving invalidate() optional, better expresses the requirement than using an <any> hammer.
 */
export interface Invalidatable {
	invalidate?(): void;
}
