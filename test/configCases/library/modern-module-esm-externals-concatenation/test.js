it("should generate ESM externals when module concatenation is enabled", function () {
	// Test that we can require the built modules
	const testModule = __non_webpack_require__("./test.js");
	const mainModule = __non_webpack_require__("./main.js");

	// Check that exports are available
	expect(testModule).toBeDefined();
	expect(mainModule).toBeDefined();

	// Verify exports from test module
	expect(testModule.namedExport1).toBe("named-export-1");
	expect(testModule.namedExport2).toBe("named-export-2");
	expect(testModule.useImports).toBeDefined();
	expect(testModule.reexportedNamespace).toEqual({
		default: "default-export",
		named1: "named-export-1",
		named2: "named-export-2"
	});

	// Call the function to verify imports work
	const result = testModule.useImports();
	expect(result.named1).toBe("named-export-1");
	expect(result.named2).toBe("named-export-2");
	expect(result.ns.default).toBe("default-export");
	expect(result.def).toBe("default-export");
	expect(result.nested.value).toBe("nested-value");

	// Test deferred imports
	expect(mainModule.testDeferredNamespace).toBeDefined();
	expect(mainModule.testDeferredNamed).toBeDefined();
	expect(mainModule.testDeferredDefault).toBeDefined();
	expect(mainModule.evaluateDeferred).toBeDefined();

	// Test deferred namespace
	const deferredNs = mainModule.testDeferredNamespace();
	expect(deferredNs).toBeDefined();
	expect(deferredNs.default).toBe("default-export");
	expect(deferredNs.named1).toBe("named-export-1");
	expect(deferredNs.named2).toBe("named-export-2");

	// Test deferred named imports
	const deferredNamed = mainModule.testDeferredNamed();
	expect(deferredNamed.named1).toBe("named-export-1");
	expect(deferredNamed.named2).toBe("named-export-2");

	// Test deferred default import
	const deferredDefault = mainModule.testDeferredDefault();
	expect(deferredDefault).toBe("default-export");

	// Test evaluateDeferred
	const evaluated = mainModule.evaluateDeferred();
	expect(evaluated.ns.default).toBe("default-export");
	expect(evaluated.named.named1).toBe("named-export-1");
	expect(evaluated.def).toBe("default-export");

	// Test CommonJS deferred imports
	expect(mainModule.testDeferredCommonJsNamespace).toBeDefined();
	expect(mainModule.accessDeferredCommonJs).toBeDefined();

	// Test deferred CommonJS namespace
	const deferredCommonJs = mainModule.testDeferredCommonJsNamespace();
	expect(deferredCommonJs).toBeDefined();
	expect(deferredCommonJs.default).toBe("commonjs-default-export");
	expect(deferredCommonJs.named1).toBe("commonjs-named-1");

	// Test accessDeferredCommonJs to trigger deferredNamespaceObjectUsed
	const commonJsKeys = mainModule.accessDeferredCommonJs();
	expect(commonJsKeys).toContain("default");
	expect(commonJsKeys).toContain("named1");
	expect(commonJsKeys).toContain("named2");

	// Test selective exports
	expect(mainModule.useSelectiveExports).toBeDefined();
	expect(mainModule.getUnusedNamespace).toBeDefined();

	// Test selective export usage
	const selective = mainModule.useSelectiveExports();
	expect(selective.used).toBe("used-export");

	// Test unused namespace
	const unusedNs = mainModule.getUnusedNamespace();
	expect(unusedNs).toBeDefined();
	expect(unusedNs.default).toBe("totally-unused-default");
	expect(unusedNs.export1).toBe("totally-unused-1");
});