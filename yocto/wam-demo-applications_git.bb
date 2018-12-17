DESCRIPTION = "WAM demo applications for AGL"
LICENSE = "Apache-2.0"
LIC_FILES_CHKSUM = "\
    file://${COMMON_LICENSE_DIR}/Apache-2.0;md5=89aea4e17d99a7cacdbeed46a0096b10 \
"

inherit aglwgt

DEPENDS = "zip-native"
RDEPENDS_${PN} = "virtual/webruntime"

PR = "r0"

SRC_URI = "git://github.com/jaragunde/wam-demo-applications.git;branch=master"

S = "${WORKDIR}/git"
SRCREV = "611a0d2d2749c63cae55f60c4f86c9f5d6113904"
