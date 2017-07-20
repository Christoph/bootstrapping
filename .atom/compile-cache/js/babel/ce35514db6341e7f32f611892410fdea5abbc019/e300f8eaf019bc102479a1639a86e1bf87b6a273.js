'use babel';

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

Object.defineProperty(exports, '__esModule', {
  value: true
});

// Use this to provide a suggestion for single-word matches.
// Optionally set `wordRegExp` to adjust word-matching.

// Use this to provide a suggestion if it can have non-contiguous ranges.
// A primary use-case for this is Objective-C methods.

// The higher this is, the more precedence the provider gets. Defaults to 0.

// Must be unique. Used for analytics.

// The range(s) to underline to provide as a visual cue for clicking.

// The function to call when the underlined text is clicked.
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2NocmlzL3NvdXJjZS9ib290c3RyYXBwaW5nLy5hdG9tL3BhY2thZ2VzL2h5cGVyY2xpY2svbGliL3R5cGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQyIsImZpbGUiOiIvaG9tZS9jaHJpcy9zb3VyY2UvYm9vdHN0cmFwcGluZy8uYXRvbS9wYWNrYWdlcy9oeXBlcmNsaWNrL2xpYi90eXBlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmV4cG9ydCB0eXBlIEh5cGVyY2xpY2tQcm92aWRlciA9IHtcbiAgLy8gVXNlIHRoaXMgdG8gcHJvdmlkZSBhIHN1Z2dlc3Rpb24gZm9yIHNpbmdsZS13b3JkIG1hdGNoZXMuXG4gIC8vIE9wdGlvbmFsbHkgc2V0IGB3b3JkUmVnRXhwYCB0byBhZGp1c3Qgd29yZC1tYXRjaGluZy5cbiAgZ2V0U3VnZ2VzdGlvbkZvcldvcmQ/OiAoXG4gICAgdGV4dEVkaXRvcjogYXRvbSRUZXh0RWRpdG9yLFxuICAgIHRleHQ6IHN0cmluZyxcbiAgICByYW5nZTogYXRvbSRSYW5nZSxcbiAgKSA9PiBQcm9taXNlPD9IeXBlcmNsaWNrU3VnZ2VzdGlvbj4sXG5cbiAgd29yZFJlZ0V4cD86IFJlZ0V4cCxcblxuICAvLyBVc2UgdGhpcyB0byBwcm92aWRlIGEgc3VnZ2VzdGlvbiBpZiBpdCBjYW4gaGF2ZSBub24tY29udGlndW91cyByYW5nZXMuXG4gIC8vIEEgcHJpbWFyeSB1c2UtY2FzZSBmb3IgdGhpcyBpcyBPYmplY3RpdmUtQyBtZXRob2RzLlxuICBnZXRTdWdnZXN0aW9uPzogKFxuICAgIHRleHRFZGl0b3I6IGF0b20kVGV4dEVkaXRvcixcbiAgICBwb3NpdGlvbjogYXRvbSRQb2ludCxcbiAgKSA9PiBQcm9taXNlPD9IeXBlcmNsaWNrU3VnZ2VzdGlvbj4sXG5cbiAgLy8gVGhlIGhpZ2hlciB0aGlzIGlzLCB0aGUgbW9yZSBwcmVjZWRlbmNlIHRoZSBwcm92aWRlciBnZXRzLiBEZWZhdWx0cyB0byAwLlxuICBwcmlvcml0eT86IG51bWJlcixcblxuICAvLyBNdXN0IGJlIHVuaXF1ZS4gVXNlZCBmb3IgYW5hbHl0aWNzLlxuICBwcm92aWRlck5hbWU/OiBzdHJpbmcsXG59O1xuXG5leHBvcnQgdHlwZSBIeXBlcmNsaWNrU3VnZ2VzdGlvbiA9IHtcbiAgLy8gVGhlIHJhbmdlKHMpIHRvIHVuZGVybGluZSB0byBwcm92aWRlIGFzIGEgdmlzdWFsIGN1ZSBmb3IgY2xpY2tpbmcuXG4gIHJhbmdlOiA/YXRvbSRSYW5nZSB8ID9BcnJheTxhdG9tJFJhbmdlPixcblxuICAvLyBUaGUgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoZSB1bmRlcmxpbmVkIHRleHQgaXMgY2xpY2tlZC5cbiAgY2FsbGJhY2s6ICgoKSA9PiBtaXhlZCkgfCBBcnJheTx7cmlnaHRMYWJlbD86IHN0cmluZywgdGl0bGU6IHN0cmluZywgY2FsbGJhY2s6ICgpID0+IG1peGVkfT4sXG59O1xuIl19