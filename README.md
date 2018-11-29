# WAM demo applications

A collection of HTML5 demos to be run on the AGL platform together
with the Web Application Manager (WAM) component from
[webOS Open Source Edition](http://www.webosose.org/).

## Building

This is designed to be built with AGL Yocto layers. The provided
`make package` target works together with the aglwrt bbclass.

## Adding new demos

Just add the application files in a new directory, provide a
`config.xml` file and modify the Makefile to add your application
to the `APP_LIST`.
