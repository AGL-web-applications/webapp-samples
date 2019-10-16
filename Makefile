APP_LIST=annex application-list aquarium blob falling-blocks hextris hvac-enact memory-match solar-system youtube jamendo

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

