SOURCES := $(shell find * -type f -wholename "functions/public/css/*.less")

CSSFILES := $(subst less,css, $(SOURCES))

STYLEPATH := "functions/public/css"

.SUFFIXES: .less .css

all: cssless

cssless: $(CSSFILES)

%.css: %.less
		lessc $< $@

clean:
	rm functions/public/css/*.css
