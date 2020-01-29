APP_NAME=simple-launcher

package:
	mkdir -p package
	zip -r package/$(APP_NAME).wgt * -x package/ \*~

.PHONY: clean
clean:
	rm -rf package

