APP_LIST=application-list aquarium blob examples falling-blocks hextris jamendo memory-match solar-system youtube

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
