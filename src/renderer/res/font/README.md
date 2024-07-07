## Why Wournal bundles Fonts

There are three reasons for including fonts in wournal:

1. It makes it possible to create portable documents that should look exactly
   the same no matter what OS+Browser combination is used. (Provided that the
   target OS+Browser renders SVG properly).
2. Using one single font for the UI should avoid layout issues on different
   OS+Browser combinations.
3. Listing available fonts on a system is only *sort of* possible in
   javascript. Since it is often used for fingerprinting, there will likely
   never be a stable API for that. Because of that, the only way to implement a
   font picker where users can pick from a range of fonts without having to know
   the exact name of these fonts is to bundle them with the application.

## Origin

The files in this directory where downloaded from
https://google-webfonts-helper.herokuapp.com/
