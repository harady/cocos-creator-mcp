"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferencesTools = void 0;
const tool_base_1 = require("../tool-base");
class PreferencesTools {
    constructor() {
        this.categoryName = "preferences";
    }
    getTools() {
        return [
            {
                name: "preferences_get",
                description: "Get a preference value by key.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name (e.g. 'general', 'builder', 'engine')" },
                        key: { type: "string", description: "Preference key" },
                    },
                    required: ["protocol", "key"],
                },
            },
            {
                name: "preferences_set",
                description: "Set a preference value.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name" },
                        key: { type: "string", description: "Preference key" },
                        value: { description: "Value to set" },
                    },
                    required: ["protocol", "key", "value"],
                },
            },
            {
                name: "preferences_get_all",
                description: "Get all preferences for a given protocol.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name (e.g. 'general')" },
                    },
                    required: ["protocol"],
                },
            },
            {
                name: "preferences_reset",
                description: "Reset a preference to its default value.",
                inputSchema: {
                    type: "object",
                    properties: {
                        protocol: { type: "string", description: "Protocol name" },
                        key: { type: "string", description: "Preference key to reset" },
                    },
                    required: ["protocol", "key"],
                },
            },
        ];
    }
    async execute(toolName, args) {
        try {
            switch (toolName) {
                case "preferences_get": {
                    const value = Editor.Profile.getConfig(args.protocol, args.key);
                    return (0, tool_base_1.ok)({ success: true, protocol: args.protocol, key: args.key, value });
                }
                case "preferences_set":
                    Editor.Profile.setConfig(args.protocol, args.key, args.value);
                    return (0, tool_base_1.ok)({ success: true, protocol: args.protocol, key: args.key });
                case "preferences_get_all": {
                    const config = Editor.Profile.getConfig(args.protocol);
                    return (0, tool_base_1.ok)({ success: true, protocol: args.protocol, config });
                }
                case "preferences_reset":
                    Editor.Profile.removeConfig(args.protocol, args.key);
                    return (0, tool_base_1.ok)({ success: true, protocol: args.protocol, key: args.key });
                default:
                    return (0, tool_base_1.err)(`Unknown tool: ${toolName}`);
            }
        }
        catch (e) {
            return (0, tool_base_1.err)(e.message || String(e));
        }
    }
}
exports.PreferencesTools = PreferencesTools;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlZmVyZW5jZXMtdG9vbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdG9vbHMvcHJlZmVyZW5jZXMtdG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsNENBQXVDO0FBRXZDLE1BQWEsZ0JBQWdCO0lBQTdCO1FBQ2EsaUJBQVksR0FBRyxhQUFhLENBQUM7SUErRTFDLENBQUM7SUE3RUcsUUFBUTtRQUNKLE9BQU87WUFDSDtnQkFDSSxJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixXQUFXLEVBQUUsZ0NBQWdDO2dCQUM3QyxXQUFXLEVBQUU7b0JBQ1QsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNSLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLHFEQUFxRCxFQUFFO3dCQUNoRyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRTtxQkFDekQ7b0JBQ0QsUUFBUSxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQztpQkFDaEM7YUFDSjtZQUNEO2dCQUNJLElBQUksRUFBRSxpQkFBaUI7Z0JBQ3ZCLFdBQVcsRUFBRSx5QkFBeUI7Z0JBQ3RDLFdBQVcsRUFBRTtvQkFDVCxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1IsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsZUFBZSxFQUFFO3dCQUMxRCxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxnQkFBZ0IsRUFBRTt3QkFDdEQsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRTtxQkFDekM7b0JBQ0QsUUFBUSxFQUFFLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUM7aUJBQ3pDO2FBQ0o7WUFDRDtnQkFDSSxJQUFJLEVBQUUscUJBQXFCO2dC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YXRlZ29yeSwgVG9vbERlZmluaXRpb24sIFRvb2xSZXN1bHQgfSBmcm9tIFwiLi4vdHlwZXNcIjtcclxuaW1wb3J0IHsgb2ssIGVyciB9IGZyb20gXCIuLi90b29sLWJhc2VcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBQcmVmZXJlbmNlc1Rvb2xzIGltcGxlbWVudHMgVG9vbENhdGVnb3J5IHtcclxuICAgIHJlYWRvbmx5IGNhdGVnb3J5TmFtZSA9IFwicHJlZmVyZW5jZXNcIjtcclxuXHJcbiAgICBnZXRUb29scygpOiBUb29sRGVmaW5pdGlvbltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcInByZWZlcmVuY2VzX2dldFwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2V0IGEgcHJlZmVyZW5jZSB2YWx1ZSBieSBrZXkuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm90b2NvbCBuYW1lIChlLmcuICdnZW5lcmFsJywgJ2J1aWxkZXInLCAnZW5naW5lJylcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmVyZW5jZSBrZXlcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInByb3RvY29sXCIsIFwia2V5XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmZXJlbmNlc19zZXRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNldCBhIHByZWZlcmVuY2UgdmFsdWUuXCIsXHJcbiAgICAgICAgICAgICAgICBpbnB1dFNjaGVtYToge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogeyB0eXBlOiBcInN0cmluZ1wiLCBkZXNjcmlwdGlvbjogXCJQcm90b2NvbCBuYW1lXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAga2V5OiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByZWZlcmVuY2Uga2V5XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHsgZGVzY3JpcHRpb246IFwiVmFsdWUgdG8gc2V0XCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcm90b2NvbFwiLCBcImtleVwiLCBcInZhbHVlXCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJwcmVmZXJlbmNlc19nZXRfYWxsXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXQgYWxsIHByZWZlcmVuY2VzIGZvciBhIGdpdmVuIHByb3RvY29sLlwiLFxyXG4gICAgICAgICAgICAgICAgaW5wdXRTY2hlbWE6IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2w6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJvdG9jb2wgbmFtZSAoZS5nLiAnZ2VuZXJhbCcpXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVpcmVkOiBbXCJwcm90b2NvbFwiXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicHJlZmVyZW5jZXNfcmVzZXRcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlJlc2V0IGEgcHJlZmVyZW5jZSB0byBpdHMgZGVmYXVsdCB2YWx1ZS5cIixcclxuICAgICAgICAgICAgICAgIGlucHV0U2NoZW1hOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiB7IHR5cGU6IFwic3RyaW5nXCIsIGRlc2NyaXB0aW9uOiBcIlByb3RvY29sIG5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXk6IHsgdHlwZTogXCJzdHJpbmdcIiwgZGVzY3JpcHRpb246IFwiUHJlZmVyZW5jZSBrZXkgdG8gcmVzZXRcIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWQ6IFtcInByb3RvY29sXCIsIFwia2V5XCJdLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBdO1xyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGV4ZWN1dGUodG9vbE5hbWU6IHN0cmluZywgYXJnczogUmVjb3JkPHN0cmluZywgYW55Pik6IFByb21pc2U8VG9vbFJlc3VsdD4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodG9vbE5hbWUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJwcmVmZXJlbmNlc19nZXRcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gRWRpdG9yLlByb2ZpbGUuZ2V0Q29uZmlnKGFyZ3MucHJvdG9jb2wsIGFyZ3Mua2V5KTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwcm90b2NvbDogYXJncy5wcm90b2NvbCwga2V5OiBhcmdzLmtleSwgdmFsdWUgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwicHJlZmVyZW5jZXNfc2V0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgRWRpdG9yLlByb2ZpbGUuc2V0Q29uZmlnKGFyZ3MucHJvdG9jb2wsIGFyZ3Mua2V5LCBhcmdzLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb2soeyBzdWNjZXNzOiB0cnVlLCBwcm90b2NvbDogYXJncy5wcm90b2NvbCwga2V5OiBhcmdzLmtleSB9KTtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJwcmVmZXJlbmNlc19nZXRfYWxsXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSBFZGl0b3IuUHJvZmlsZS5nZXRDb25maWcoYXJncy5wcm90b2NvbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcHJvdG9jb2w6IGFyZ3MucHJvdG9jb2wsIGNvbmZpZyB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhc2UgXCJwcmVmZXJlbmNlc19yZXNldFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIEVkaXRvci5Qcm9maWxlLnJlbW92ZUNvbmZpZyhhcmdzLnByb3RvY29sLCBhcmdzLmtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG9rKHsgc3VjY2VzczogdHJ1ZSwgcHJvdG9jb2w6IGFyZ3MucHJvdG9jb2wsIGtleTogYXJncy5rZXkgfSk7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnIoYFVua25vd24gdG9vbDogJHt0b29sTmFtZX1gKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZXJyKGUubWVzc2FnZSB8fCBTdHJpbmcoZSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=