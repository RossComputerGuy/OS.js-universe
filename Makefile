all: store-pkg terminal-pkg updater-pkg

pkg:
	@zip -r bin/${NAME}.zip ${NAME}

store-pkg:
	@make pkg NAME=store

terminal-pkg:
	@make pkg NAME=terminal

updater-pkg:
	@make pkg NAME=updater