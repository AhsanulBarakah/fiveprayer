import { z } from 'zod';

// creating a schema for strings
const InputSchemaValid = z.object( {
	meta: z.string().optional(),
	value: z.string().optional(),
} );
// A meta save may carry any value the setting stores: a string, a list of
// locations, a printer object, parsed JSON, … The API accepts them all, so the
// type must too.
const InputAndSelectSchemaValid = z.object( {
	meta: z.string().optional(),
	value: z.unknown().optional(),
} );
const SelectIsValid = z.object( {
	meta: z.string().optional(),
	value: z.unknown().optional(),
} );
const SelectOptionIsValid = z.object( {
	// Meta key of the row the option belongs to, e.g. 'mfc_selected'.
	meta: z.string().optional(),
	name: z.string().optional(),
	method: z.string().optional(),
	location: z
		.object( {
			latitude: z.number(),
			longitude: z.number(),
		} )
		.optional(),
	// Calculation methods carry their own criteria (fajr, isha, asr, midnight,
	// dhuhr/maghrib offsets, iterations, enabled, …), so the shape is open —
	// the UI reads whichever keys the selected method stored.
	params: z.record( z.string(), z.unknown() ).optional(),
} );
const SelectSchemaValid = z.object( {
	id: z.string().optional(),
	// Every meta row the REST API returns carries its key.
	'meta-key': z.string(),
	value: z.unknown().optional(),
} );

// extract the inferred type
export type InputSchemaValid = z.infer< typeof InputSchemaValid >;
export type SelectSchemaValid = z.infer< typeof SelectSchemaValid >;
export type SelectOptionIsValid = z.infer< typeof SelectOptionIsValid >;
export type SelectIsValid = z.infer< typeof SelectIsValid >;
export type InputAndSelectSchemaValid = z.infer<
	typeof InputAndSelectSchemaValid
>;
