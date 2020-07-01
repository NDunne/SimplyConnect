LESSSOURCES := $(shell find * -type f -wholename "functions/public/css/*.less")

CSSFILES := $(subst less,min.css, $(LESSSOURCES))

JSSOURCES := $(shell find * -type f -wholename "functions/public/scripts/*.js" | grep -v -e '.min')

MINJSFILES := $(subst js,min.js, $(JSSOURCES))

.SUFFIXES: .less .css .min.css .min.js

all: cssless minjs

cssless: $(CSSFILES)

%.min.css: %.css
	minify $< > $@

%.css: %.less
	lessc $< $@

minjs: $(MINJSFILES)

%.min.js: %.js
	minify $< > $@

clean:
	rm functions/public/css/*.css
	rm functions/public/scripts/*.min.js
