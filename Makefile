APP_LIST=annex application-list aquarium blob falling-blocks hextris memory-match solar-system youtube jamendo

package:
	mkdir -p package
	for i in $(APP_LIST); do \
		cd $$i; \
		$(MAKE) package; \
		cp package/* ../package; \
		cd ..; \
	done

%/package:
	cd `dirname $@` && $(MAKE) package

.PHONY: clean
clean:
	rm -rf package

.PHONY: cleanall
cleanall:
	rm -rf package
	for i in $(APP_LIST); do \
		cd $$i; \
		rm -rf package; \
		cd ..; \
	done
