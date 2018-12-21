APP_LIST=annex aquarium blob falling-blocks hextris hvac-enact memory-match solar-system youtube

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

