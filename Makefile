APP_LIST=annex application-list aquarium blob falling-blocks hextris hvac-enact memory-match solar-system youtube jamendo

package:
	mkdir -p package
	for i in $(APP_LIST); do \
		cd $$i; \
		zip -r ../package/$$i.wgt *; \
		cd ..; \
	done

%/package:
	cd `dirname $@` && $(MAKE) package

.PHONY: clean
clean:
	rm -rf package

