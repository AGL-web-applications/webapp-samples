APP_NAME=

package:
	mkdir -p package
	# Use dir name as WGT_NAME, or use APP_NAME if set
	WGT_NAME="$(APP_NAME)"; \
	if test "$$WGT_NAME" = ""; then WGT_NAME=`basename $$PWD`; fi; \
	zip -r package/$$WGT_NAME.wgt * -x package/ \*~

.PHONY: clean
clean:
	rm -rf package

