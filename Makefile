APP_LIST=annex hvac-enact memory-match youtube

package:
	mkdir -p package
	for i in $(APP_LIST); do \
		cd $$i; \
		zip -r ../package/$$i.wgt *; \
		cd ..; \
	done

.PHONY: clean
clean:
	rm -rf package

