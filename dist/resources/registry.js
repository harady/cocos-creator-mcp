"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceRegistry = void 0;
/**
 * Registry of MCP resources. Resources are added at construction time
 * (see resources/index.ts) and matched against incoming `resources/read` URIs
 * either by exact match or by uriTemplate placeholder substitution.
 */
class ResourceRegistry {
    constructor() {
        this.defs = [];
    }
    register(...defs) {
        for (const d of defs) {
            if (!d.uri && !d.uriTemplate) {
                throw new Error(`ResourceDef "${d.name}" must define uri or uriTemplate`);
            }
            this.defs.push(d);
        }
    }
    /** All fixed-URI resources (for resources/list). */
    listFixed() {
        return this.defs
            .filter((d) => d.uri !== undefined)
            .map((d) => ({
            uri: d.uri,
            name: d.name,
            description: d.description,
            mimeType: d.mimeType || "application/json",
        }));
    }
    /** All template URIs (for resources/templates/list). */
    listTemplates() {
        return this.defs
            .filter((d) => d.uriTemplate !== undefined)
            .map((d) => ({
            uriTemplate: d.uriTemplate,
            name: d.name,
            description: d.description,
            mimeType: d.mimeType || "application/json",
        }));
    }
    /**
     * Match a concrete URI against the registry. Returns the matched definition
     * and extracted params, or null if no match.
     */
    match(uri) {
        for (const d of this.defs) {
            if (d.uri === uri)
                return { def: d, params: {} };
            if (d.uriTemplate) {
                const re = uriTemplateToRegExp(d.uriTemplate);
                const m = re.exec(uri);
                if (m) {
                    const params = {};
                    try {
                        for (const [key, value] of Object.entries(m.groups || {})) {
                            // Cocos short UUIDs may contain '/' and '+'. Clients
                            // percent-encode template values to keep them in one segment.
                            params[key] = decodeURIComponent(value);
                        }
                    }
                    catch (_a) {
                        continue; // Invalid percent encoding: this def cannot match, try the next.
                    }
                    return { def: d, params };
                }
            }
        }
        return null;
    }
}
exports.ResourceRegistry = ResourceRegistry;
/** Convert "cocos://node/{uuid}" → RegExp /^cocos:\/\/node\/(?<uuid>[^/]+)$/ */
function uriTemplateToRegExp(template) {
    const escaped = template.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const withGroups = escaped.replace(/\\\{(\w+)\\\}/g, "(?<$1>[^/]+)");
    return new RegExp("^" + withGroups + "$");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnaXN0cnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcmVzb3VyY2VzL3JlZ2lzdHJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBOzs7O0dBSUc7QUFDSCxNQUFhLGdCQUFnQjtJQUE3QjtRQUNxQixTQUFJLEdBQWtCLEVBQUUsQ0FBQztJQThEOUMsQ0FBQztJQTVERyxRQUFRLENBQUMsR0FBRyxJQUFtQjtRQUMzQixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUMzQixNQUFNLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxrQ0FBa0MsQ0FBQyxDQUFDO1lBQzlFLENBQUM7WUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixDQUFDO0lBQ0wsQ0FBQztJQUVELG9EQUFvRDtJQUNwRCxTQUFTO1FBQ0wsT0FBTyxJQUFJLENBQUMsSUFBSTthQUNYLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUM7YUFDbEMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ1QsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFJO1lBQ1gsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJO1lBQ1osV0FBVyxFQUFFLENBQUMsQ0FBQyxXQUFXO1lBQzFCLFFBQVEsRUFBRSxDQUFDLENBQUMsUUFBUSxJQUFJLGtCQUFrQjtTQUM3QyxDQUFDLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFRCx3REFBd0Q7SUFDeEQsYUFBYTtRQUNULE9BQU8sSUFBSSxDQUFDLElBQUk7YUFDWCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLEtBQUssU0FBUyxDQUFDO2FBQzFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNULFdBQVcsRUFBRSxDQUFDLENBQUMsV0FBWTtZQUMzQixJQUFJLEVBQUUsQ0FBQyxDQUFDLElBQUk7WUFDWixXQUFXLEVBQUUsQ0FBQyxDQUFDLFdBQVc7WUFDMUIsUUFBUSxFQUFFLENBQUMsQ0FBQyxRQUFRLElBQUksa0JBQWtCO1NBQzdDLENBQUMsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxHQUFXO1FBQ2IsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUc7Z0JBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDO1lBQ2pELElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNoQixNQUFNLEVBQUUsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQzlDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUM7b0JBQ0osTUFBTSxNQUFNLEdBQTJCLEVBQUUsQ0FBQztvQkFDMUMsSUFBSSxDQUFDO3dCQUNELEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQzs0QkFDeEQscURBQXFEOzRCQUNyRCw4REFBOEQ7NEJBQzlELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDNUMsQ0FBQztvQkFDTCxDQUFDO29CQUFDLFdBQU0sQ0FBQzt3QkFDTCxTQUFTLENBQUMsaUVBQWlFO29CQUMvRSxDQUFDO29CQUNELE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDO2dCQUM5QixDQUFDO1lBQ0wsQ0FBQztRQUNMLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0o7QUEvREQsNENBK0RDO0FBRUQsZ0ZBQWdGO0FBQ2hGLFNBQVMsbUJBQW1CLENBQUMsUUFBZ0I7SUFDekMsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNoRSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3JFLE9BQU8sSUFBSSxNQUFNLENBQUMsR0FBRyxHQUFHLFVBQVUsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUM5QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBSZXNvdXJjZURlZiwgUmVzb3VyY2VNYXRjaCB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbi8qKlxuICogUmVnaXN0cnkgb2YgTUNQIHJlc291cmNlcy4gUmVzb3VyY2VzIGFyZSBhZGRlZCBhdCBjb25zdHJ1Y3Rpb24gdGltZVxuICogKHNlZSByZXNvdXJjZXMvaW5kZXgudHMpIGFuZCBtYXRjaGVkIGFnYWluc3QgaW5jb21pbmcgYHJlc291cmNlcy9yZWFkYCBVUklzXG4gKiBlaXRoZXIgYnkgZXhhY3QgbWF0Y2ggb3IgYnkgdXJpVGVtcGxhdGUgcGxhY2Vob2xkZXIgc3Vic3RpdHV0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgUmVzb3VyY2VSZWdpc3RyeSB7XG4gICAgcHJpdmF0ZSByZWFkb25seSBkZWZzOiBSZXNvdXJjZURlZltdID0gW107XG5cbiAgICByZWdpc3RlciguLi5kZWZzOiBSZXNvdXJjZURlZltdKTogdm9pZCB7XG4gICAgICAgIGZvciAoY29uc3QgZCBvZiBkZWZzKSB7XG4gICAgICAgICAgICBpZiAoIWQudXJpICYmICFkLnVyaVRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXNvdXJjZURlZiBcIiR7ZC5uYW1lfVwiIG11c3QgZGVmaW5lIHVyaSBvciB1cmlUZW1wbGF0ZWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5kZWZzLnB1c2goZCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKiogQWxsIGZpeGVkLVVSSSByZXNvdXJjZXMgKGZvciByZXNvdXJjZXMvbGlzdCkuICovXG4gICAgbGlzdEZpeGVkKCk6IEFycmF5PHsgdXJpOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgZGVzY3JpcHRpb246IHN0cmluZzsgbWltZVR5cGU6IHN0cmluZyB9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRlZnNcbiAgICAgICAgICAgIC5maWx0ZXIoKGQpID0+IGQudXJpICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAubWFwKChkKSA9PiAoe1xuICAgICAgICAgICAgICAgIHVyaTogZC51cmkhLFxuICAgICAgICAgICAgICAgIG5hbWU6IGQubmFtZSxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogZC5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICBtaW1lVHlwZTogZC5taW1lVHlwZSB8fCBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKiogQWxsIHRlbXBsYXRlIFVSSXMgKGZvciByZXNvdXJjZXMvdGVtcGxhdGVzL2xpc3QpLiAqL1xuICAgIGxpc3RUZW1wbGF0ZXMoKTogQXJyYXk8eyB1cmlUZW1wbGF0ZTogc3RyaW5nOyBuYW1lOiBzdHJpbmc7IGRlc2NyaXB0aW9uOiBzdHJpbmc7IG1pbWVUeXBlOiBzdHJpbmcgfT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5kZWZzXG4gICAgICAgICAgICAuZmlsdGVyKChkKSA9PiBkLnVyaVRlbXBsYXRlICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAubWFwKChkKSA9PiAoe1xuICAgICAgICAgICAgICAgIHVyaVRlbXBsYXRlOiBkLnVyaVRlbXBsYXRlISxcbiAgICAgICAgICAgICAgICBuYW1lOiBkLm5hbWUsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGQuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICAgICAgbWltZVR5cGU6IGQubWltZVR5cGUgfHwgXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWF0Y2ggYSBjb25jcmV0ZSBVUkkgYWdhaW5zdCB0aGUgcmVnaXN0cnkuIFJldHVybnMgdGhlIG1hdGNoZWQgZGVmaW5pdGlvblxuICAgICAqIGFuZCBleHRyYWN0ZWQgcGFyYW1zLCBvciBudWxsIGlmIG5vIG1hdGNoLlxuICAgICAqL1xuICAgIG1hdGNoKHVyaTogc3RyaW5nKTogUmVzb3VyY2VNYXRjaCB8IG51bGwge1xuICAgICAgICBmb3IgKGNvbnN0IGQgb2YgdGhpcy5kZWZzKSB7XG4gICAgICAgICAgICBpZiAoZC51cmkgPT09IHVyaSkgcmV0dXJuIHsgZGVmOiBkLCBwYXJhbXM6IHt9IH07XG4gICAgICAgICAgICBpZiAoZC51cmlUZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlID0gdXJpVGVtcGxhdGVUb1JlZ0V4cChkLnVyaVRlbXBsYXRlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtID0gcmUuZXhlYyh1cmkpO1xuICAgICAgICAgICAgICAgIGlmIChtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMobS5ncm91cHMgfHwge30pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ29jb3Mgc2hvcnQgVVVJRHMgbWF5IGNvbnRhaW4gJy8nIGFuZCAnKycuIENsaWVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwZXJjZW50LWVuY29kZSB0ZW1wbGF0ZSB2YWx1ZXMgdG8ga2VlcCB0aGVtIGluIG9uZSBzZWdtZW50LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtc1trZXldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTsgLy8gSW52YWxpZCBwZXJjZW50IGVuY29kaW5nOiB0aGlzIGRlZiBjYW5ub3QgbWF0Y2gsIHRyeSB0aGUgbmV4dC5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBkZWY6IGQsIHBhcmFtcyB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5cbi8qKiBDb252ZXJ0IFwiY29jb3M6Ly9ub2RlL3t1dWlkfVwiIOKGkiBSZWdFeHAgL15jb2NvczpcXC9cXC9ub2RlXFwvKD88dXVpZD5bXi9dKykkLyAqL1xuZnVuY3Rpb24gdXJpVGVtcGxhdGVUb1JlZ0V4cCh0ZW1wbGF0ZTogc3RyaW5nKTogUmVnRXhwIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGVtcGxhdGUucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICAgIGNvbnN0IHdpdGhHcm91cHMgPSBlc2NhcGVkLnJlcGxhY2UoL1xcXFxcXHsoXFx3KylcXFxcXFx9L2csIFwiKD88JDE+W14vXSspXCIpO1xuICAgIHJldHVybiBuZXcgUmVnRXhwKFwiXlwiICsgd2l0aEdyb3VwcyArIFwiJFwiKTtcbn1cbiJdfQ==