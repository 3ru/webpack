"use strict";

require("./helpers/warmup-webpack");

const fs = require("fs");
const path = require("path");

describe("WatchSuspend", () => {
	if (process.env.NO_WATCH_TESTS) {
		// eslint-disable-next-line jest/no-disabled-tests
		it.skip("long running tests excluded", () => {});

		return;
	}

	jest.setTimeout(5000);

	describe("suspend and resume watcher", () => {
		const fixturePath = path.join(
			__dirname,
			"fixtures",
			`temp-watch-${Date.now()}`
		);
		const filePath = path.join(fixturePath, "file.js");
		const file2Path = path.join(fixturePath, "file2.js");
		const file3Path = path.join(fixturePath, "file3.js");
		const outputPath = path.join(__dirname, "js/WatchSuspend");
		const outputFile = path.join(outputPath, "bundle.js");
		let compiler = null;
		let watching = null;
		let onChange = null;

		beforeAll(() => {
			try {
				fs.mkdirSync(fixturePath);
			} catch (_err) {
				// skip
			}
			try {
				fs.writeFileSync(filePath, "'foo'", "utf8");
				fs.writeFileSync(file2Path, "'file2'", "utf8");
				fs.writeFileSync(file3Path, "'file3'", "utf8");
			} catch (_err) {
				// skip
			}

			const webpack = require("../");

			compiler = webpack({
				mode: "development",
				entry: filePath,
				output: {
					path: outputPath,
					filename: "bundle.js"
				}
			});
			watching = compiler.watch({ aggregateTimeout: 50 }, () => {});

			compiler.hooks.done.tap("WatchSuspendTest", () => {
				if (onChange) onChange();
			});
		});

		afterAll(() => {
			watching.close();
			compiler = null;
			try {
				fs.unlinkSync(filePath);
			} catch (_err) {
				// skip
			}
			try {
				fs.rmdirSync(fixturePath);
			} catch (_err) {
				// skip
			}
		});

		it("should compile successfully", (done) => {
			onChange = () => {
				expect(fs.readFileSync(outputFile, "utf8")).toContain("'foo'");
				onChange = null;
				done();
			};
		});

		it("should suspend compilation", (done) => {
			onChange = jest.fn();
			watching.suspend();
			fs.writeFileSync(filePath, "'bar'", "utf8");
			setTimeout(() => {
				expect(onChange.mock.calls).toHaveLength(0);
				onChange = null;
				done();
			}, 1000);
		});

		it("should resume compilation", (done) => {
			onChange = () => {
				expect(fs.readFileSync(outputFile, "utf8")).toContain("'bar'");
				onChange = null;
				done();
			};
			watching.resume();
		});

		for (const changeBefore of [false, true]) {
			for (const delay of [200, 1500]) {
				// eslint-disable-next-line no-loop-func
				it(`should not ignore changes during resumed compilation (changeBefore: ${changeBefore}, delay: ${delay}ms)`, async () => {
					// aggregateTimeout must be long enough for this test
					//  So set-up new watcher and wait when initial compilation is done
					await new Promise((resolve) => {
						watching.close(() => {
							watching = compiler.watch({ aggregateTimeout: 1000 }, () => {
								resolve();
							});
						});
					});
					return new Promise((resolve) => {
						if (changeBefore) fs.writeFileSync(filePath, "'bar'", "utf8");
						setTimeout(() => {
							watching.suspend();
							fs.writeFileSync(filePath, "'baz'", "utf8");

							onChange = "throw";
							setTimeout(() => {
								onChange = () => {
									expect(fs.readFileSync(outputFile, "utf8")).toContain(
										"'baz'"
									);
									expect(
										compiler.modifiedFiles && [...compiler.modifiedFiles].sort()
									).toEqual([filePath]);
									expect(
										compiler.removedFiles && [...compiler.removedFiles]
									).toEqual([]);
									onChange = null;
									resolve();
								};
								watching.resume();
							}, delay);
						}, 200);
					});
				});
			}
		}

		it("should not drop changes when suspended", (done) => {
			const aggregateTimeout = 50;
			// Trigger initial compilation with file2.js (assuming correct)
			fs.writeFileSync(
				filePath,
				'require("./file2.js"); require("./file3.js")',
				"utf8"
			);

			onChange = () => {
				// Initial compilation is done, start the test
				watching.suspend();

				// Trigger the first change (works as expected):
				fs.writeFileSync(file2Path, "'foo'", "utf8");

				// Trigger the second change _after_ aggregation timeout of the first
				setTimeout(() => {
					fs.writeFileSync(file3Path, "'bar'", "utf8");

					// Wait when the file3 edit is settled and re-compile
					setTimeout(() => {
						watching.resume();

						onChange = () => {
							onChange = null;
							expect(fs.readFileSync(outputFile, "utf8")).toContain("'bar'");
							done();
						};
					}, 200);
				}, aggregateTimeout + 50);
			};
		});
	});
});
