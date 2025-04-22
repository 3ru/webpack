/*
	MIT License http://www.opensource.org/licenses/mit-license.php
*/

"use strict";

/** @typedef {import("./ObjectMiddleware").ObjectDeserializerContext} ObjectDeserializerContext */
/** @typedef {import("./ObjectMiddleware").ObjectSerializerContext} ObjectSerializerContext */

class AggregateErrorSerializer {
	/**
	 * @param {AggregateError} obj error
	 * @param {ObjectSerializerContext} context context
	 */
	serialize(obj, context) {
		context.write(obj.errors);
		context.write(obj.message);
		context.write(obj.stack);
		context.write(obj.cause);
	}

	/**
	 * @param {ObjectDeserializerContext} context context
	 * @returns {AggregateError} error
	 */
	deserialize(context) {
		const errors = context.read();
		// eslint-disable-next-line n/no-unsupported-features/es-builtins, n/no-unsupported-features/es-syntax
		const err = new AggregateError(errors);

		err.message = context.read();
		err.stack = context.read();
		err.cause = context.read();

		return err;
	}
}

module.exports = AggregateErrorSerializer;
