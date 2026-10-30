import { z } from 'zod';

// creating a schema for strings


const CustomLocationSchemaValid = z.array( z.object( {
    
            id: z.string().optional(),
			country: z.string().optional(),
			city: z.string().optional(),
			lat: z.string().optional(),
			lng: z.string().optional(),
	
} ));

// extract the inferred type
export type CustomLocationSchemaValid = z.infer< typeof CustomLocationSchemaValid >;

