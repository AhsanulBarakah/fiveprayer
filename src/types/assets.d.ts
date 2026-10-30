/**
 * Asset module declarations.
 *
 * Webpack (via wp-scripts) turns these imports into emitted stylesheet files;
 * they have no exports to type, so a bare side-effect import must resolve.
 */

declare module '*.css';
