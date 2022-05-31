# WAM demo applications

A collection of HTML5 demos to be run on the AGL platform together
with the Web Application Manager (WAM) component from
[webOS Open Source Edition](http://www.webosose.org/).

WAM is available in AGL, starting in the Flounder 6.0.5 and Guppy
7.0.0 releases. Images must be built with the `agl-demo` feature
enabled and build `agl-ivi-demo-platform-html5`.

## Building

*This requires the changes from AGL Marlin*

Copy any of the applications to /usr/lib/wam_apps/APPID (being
APPID the id of the application). Then add to /usr/share/applications
a `.desktop` file to launch it.

See the examples in `meta-agl-demo` recipes.

## Adding new demos

Just add the application files in a new directory, including an
`appinfo.json` manifest file.
