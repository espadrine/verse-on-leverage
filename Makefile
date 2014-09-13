all:
	node make
	zip z.zip .js index.html screen.css audiocr.mp3 audiopop.mp3

.PHONY: all
