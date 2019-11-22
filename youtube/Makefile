APP_NAME=

package:
	mkdir -p package
	# Use dir name as WGT_NAME, or use APP_NAME if set
	WGT_NAME="$(APP_NAME)" && [[ "$(APP_NAME)" == "" ]] && WGT_NAME=$${PWD##*/}; \
	zip -r package/$$WGT_NAME.wgt * -x package/ \*~

.PHONY: clean
clean:
	rm -rf package

