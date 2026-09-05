import type { ResourceDef, ResourceMatch } from "./types";

/**
 * Registry of MCP resources. Resources are added at construction time
 * (see resources/index.ts) and matched against incoming `resources/read` URIs
 * either by exact match or by uriTemplate placeholder substitution.
 */
export class ResourceRegistry {
    private readonly defs: ResourceDef[] = [];

    register(...defs: ResourceDef[]): void {
        for (const d of defs) {
            if (!d.uri && !d.uriTemplate) {
                throw new Error(`ResourceDef "${d.name}" must define uri or uriTemplate`);
            }
            this.defs.push(d);
        }
    }

    /** All fixed-URI resources (for resources/list). */
    listFixed(): Array<{ uri: string; name: string; description: string; mimeType: string }> {
        return this.defs
            .filter((d) => d.uri !== undefined)
            .map((d) => ({
                uri: d.uri!,
                name: d.name,
                description: d.description,
                mimeType: d.mimeType || "application/json",
            }));
    }

    /** All template URIs (for resources/templates/list). */
    listTemplates(): Array<{ uriTemplate: string; name: string; description: string; mimeType: string }> {
        return this.defs
            .filter((d) => d.uriTemplate !== undefined)
            .map((d) => ({
                uriTemplate: d.uriTemplate!,
                name: d.name,
                description: d.description,
                mimeType: d.mimeType || "application/json",
            }));
    }

    /**
     * Match a concrete URI against the registry. Returns the matched definition
     * and extracted params, or null if no match.
     */
    match(uri: string): ResourceMatch | null {
        for (const d of this.defs) {
            if (d.uri === uri) return { def: d, params: {} };
            if (d.uriTemplate) {
                const re = uriTemplateToRegExp(d.uriTemplate);
                const m = re.exec(uri);
                if (m) {
                    const params: Record<string, string> = {};
                    try {
                        for (const [key, value] of Object.entries(m.groups || {})) {
                            // Cocos short UUIDs may contain '/' and '+'. Clients
                            // percent-encode template values to keep them in one segment.
                            params[key] = decodeURIComponent(value);
                        }
                    } catch {
                        return null; // Invalid percent encoding is not a valid resource URI.
                    }
                    return { def: d, params };
                }
            }
        }
        return null;
    }
}

/** Convert "cocos://node/{uuid}" → RegExp /^cocos:\/\/node\/(?<uuid>[^/]+)$/ */
function uriTemplateToRegExp(template: string): RegExp {
    const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const withGroups = escaped.replace(/\\\{(\w+)\\\}/g, "(?<$1>[^/]+)");
    return new RegExp("^" + withGroups + "$");
}
