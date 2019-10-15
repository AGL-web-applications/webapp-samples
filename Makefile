APP_LIST=annex aquarium blob falling-blocks hextris html5-homescreen hvac-enact memory-match solar-system youtube jamendo

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

