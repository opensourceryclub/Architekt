# Change Log

## v1.2.0 :rocket:

- Added support for controller partials
    * Files with a leading underscore are considered partials and will be ignored
    * Should be used to share functionality between controllers
- Asset directory is now recursively copied from the source directory to the output directory
- Added support for sass stylesheets
    * Files can be `.scss` or `.sass` files
    * Files with a leading underscore are considered partials and are ignored
    * `@import` resolves files in the stylesheet dir or in `node_modules`
    * stylesheets must be placed in the `stylesheets` subdirectory in your assets dir
- Output directory is now cleaned between builds
- Removed Herobrine

## v1.1.2 :rocket:

- Fixed bugs preventing rendering from working

## v1.1.1 :rocket:

- Architekt should now work with previous versions of node.

## v1.1.0 :rocket:

- Renamed `gen` command to `init`.
- Fixed a bug where partials would occasionally not load in time, causing rendering
to fail.
