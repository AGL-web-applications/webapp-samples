# WAM demo applications

A collection of HTML5 demos to be run on the AGL platform together
with the Web Application Manager (WAM) component from
[webOS Open Source Edition](http://www.webosose.org/).

WAM is available in AGL, starting in the Flounder 6.0.5 and Guppy
7.0.0 releases. Images must be built with the `agl-html5-framework`
feature enabled.

## Building

Run `make package` to package the apps in the format required by
AGL. Then, copy them to your board and install with `afm-util add
$package.wgt`.

For integration with AGL Yocto layers, the aglwrt bbclass can be
used to run the proper target and copy the generated files to the
image.

## Adding new demos

Just add the application files in a new directory, provide a
`config.xml` file and modify the Makefile to add your application
to the `APP_LIST`.
