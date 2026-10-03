import { parseDiagram, type ValidateOptions } from '../schema/validate.js';
import type { Diagram, TypedDiagram } from '../schema/types.js';

/**
 * Type-checks a definition at the call site. Node types other than the built-in
 * ones must be listed in the type parameter: defineDiagram<'queue'>({ ... }).
 */
export function defineDiagram<Custom extends string = never>(
  definition: TypedDiagram<NoInfer<Custom>>,
): TypedDiagram<Custom> {
  return definition;
}

export class DiagramSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DiagramSourceError';
  }
}

/**
 * Turns the single-string form used in MDX (and other content systems that
 * cannot pass objects or expressions) into a validated definition. Objects are
 * accepted too so the same call works on data loaded from a file or database.
 */
export function loadDiagram(source: string | object, options: ValidateOptions = {}): Diagram {
  if (typeof source === 'string') {
    let data: unknown;
    try {
      data = JSON.parse(source);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new DiagramSourceError(
        `The diagram definition is not valid JSON (${reason}). Pass the definition as a JSON string, for example definition='{"nodes":[{"id":"a"}]}'.`,
      );
    }
    return parseDiagram(data, options);
  }
  return parseDiagram(source, options);
}
