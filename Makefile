APP_LIST=hvac-enact youtube

package:
	mkdir -p package
	for i in $(APP_LIST); do \
		wgtpkg-pack $$i -o package/$$i.wgt; \
	done

.PHONY: clean
clean:
	rm -rf package

