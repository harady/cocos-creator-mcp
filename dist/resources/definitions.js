"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_RESOURCES = exports.assetResource = exports.editorInfoResource = exports.projectEngineResource = exports.projectInfoResource = exports.prefabResource = exports.prefabListResource = exports.componentResource = exports.nodeComponentsResource = exports.nodeResource = exports.sceneHierarchyResource = exports.sceneListResource = exports.sceneCurrentResource = void 0;
/**
 * Resource definitions for v2.0.0. Each function delegates to Editor.Message
 * to fetch the underlying data — same logic as the corresponding read-only
 * tools, but exposed via URI instead of tool name.
 */
// ─── Scene ───
exports.sceneCurrentResource = {
    uri: "cocos://scene/current",
    name: "Current Scene",
    description: "Name and UUID of the currently open scene.",
    async read() {
        // query-current-scene は 3.8.x で動かないため query-node-tree のルートから取得
        const tree = await Editor.Message.request("scene", "query-node-tree");
        return {
            name: tree === null || tree === void 0 ? void 0 : tree.name,
            uuid: tree === null || tree === void 0 ? void 0 : tree.uuid,
        };
    },
};
exports.sceneListResource = {
    uri: "cocos://scene/list",
    name: "Scene List",
    description: "List of all .scene files in the project.",
    async read() {
        const assets = await Editor.Message.request("asset-db", "query-assets", {
            ccType: "cc.Scene",
        });
        return {
            scenes: (Array.isArray(assets) ? assets : []).map((a) => ({
                uuid: a.uuid,
                name: a.name,
                url: a.url,
            })),
        };
    },
};
exports.sceneHierarchyResource = {
    uri: "cocos://scene/hierarchy",
    name: "Scene Hierarchy",
    description: "Node tree of the currently open scene. Shallow (name, uuid, children) — for full dumps, use cocos://node/{uuid}.",
    async read() {
        const tree = await Editor.Message.request("scene", "query-node-tree");
        return { hierarchy: tree };
    },
};
// ─── Node / Component ───
exports.nodeResource = {
    uriTemplate: "cocos://node/{uuid}",
    name: "Node Dump",
    description: "Full property dump of a node by UUID. Includes components (__comps__).",
    async read({ uuid }) {
        const dump = await Editor.Message.request("scene", "query-node", uuid);
        if (!dump)
            throw new Error(`Node not found: ${uuid}`);
        return dump;
    },
};
exports.nodeComponentsResource = {
    uriTemplate: "cocos://node/{uuid}/components",
    name: "Node Components",
    description: "Components on a node (uuid + type) — lighter than the full node dump.",
    async read({ uuid }) {
        const dump = await Editor.Message.request("scene", "query-node", uuid);
        if (!dump)
            throw new Error(`Node not found: ${uuid}`);
        const comps = (dump.__comps__ || []).map((c) => {
            var _a, _b;
            return ({
                uuid: ((_b = (_a = c.value) === null || _a === void 0 ? void 0 : _a.uuid) === null || _b === void 0 ? void 0 : _b.value) || c.uuid,
                type: c.type,
            });
        });
        return { uuid, components: comps };
    },
};
exports.componentResource = {
    uriTemplate: "cocos://component/{uuid}",
    name: "Component Dump",
    description: "Full property dump of a component by component UUID (not node UUID).",
    async read({ uuid }) {
        const dump = await Editor.Message.request("scene", "query-component", uuid);
        if (!dump)
            throw new Error(`Component not found: ${uuid}`);
        return dump;
    },
};
// ─── Prefab ───
exports.prefabListResource = {
    uri: "cocos://prefab/list",
    name: "Prefab List",
    description: "All prefabs in the project (uuid + path).",
    async read() {
        const assets = await Editor.Message.request("asset-db", "query-assets", {
            ccType: "cc.Prefab",
        });
        return {
            prefabs: (Array.isArray(assets) ? assets : []).map((a) => ({
                uuid: a.uuid,
                name: a.name,
                url: a.url,
            })),
        };
    },
};
exports.prefabResource = {
    uriTemplate: "cocos://prefab/{uuid}",
    name: "Prefab Info",
    description: "Asset info for a prefab by UUID.",
    async read({ uuid }) {
        const info = await Editor.Message.request("asset-db", "query-asset-info", uuid);
        if (!info)
            throw new Error(`Prefab not found: ${uuid}`);
        return info;
    },
};
// ─── Project / Editor ───
exports.projectInfoResource = {
    uri: "cocos://project/info",
    name: "Project Info",
    description: "Project name and root path.",
    async read() {
        return {
            name: Editor.Project.name,
            path: Editor.Project.path,
            tmpDir: Editor.Project.tmpDir,
        };
    },
};
exports.projectEngineResource = {
    uri: "cocos://project/engine",
    name: "Engine Info",
    description: "Engine version and engine path.",
    async read() {
        try {
            const info = await Editor.Message.request("engine", "query-info");
            return info || {};
        }
        catch (_a) {
            return {};
        }
    },
};
exports.editorInfoResource = {
    uri: "cocos://editor/info",
    name: "Editor Info",
    description: "Cocos Creator editor version, install path, and language.",
    async read() {
        var _a, _b;
        return {
            version: Editor.App.version,
            path: Editor.App.path,
            home: Editor.App.home,
            language: ((_b = (_a = Editor.I18n) === null || _a === void 0 ? void 0 : _a.getLanguage) === null || _b === void 0 ? void 0 : _b.call(_a)) || "unknown",
        };
    },
};
// ─── Asset ───
exports.assetResource = {
    uriTemplate: "cocos://asset/{uuid}",
    name: "Asset Info",
    description: "Asset details by UUID (path, type, dependencies).",
    async read({ uuid }) {
        const info = await Editor.Message.request("asset-db", "query-asset-info", uuid);
        if (!info)
            throw new Error(`Asset not found: ${uuid}`);
        return info;
    },
};
exports.ALL_RESOURCES = [
    exports.sceneCurrentResource,
    exports.sceneListResource,
    exports.sceneHierarchyResource,
    exports.nodeResource,
    exports.nodeComponentsResource,
    exports.componentResource,
    exports.prefabListResource,
    exports.prefabResource,
    exports.projectInfoResource,
    exports.projectEngineResource,
    exports.editorInfoResource,
    exports.assetResource,
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcmVzb3VyY2VzL2RlZmluaXRpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBOzs7O0dBSUc7QUFFSCxnQkFBZ0I7QUFFSCxRQUFBLG9CQUFvQixHQUFnQjtJQUM3QyxHQUFHLEVBQUUsdUJBQXVCO0lBQzVCLElBQUksRUFBRSxlQUFlO0lBQ3JCLFdBQVcsRUFBRSw0Q0FBNEM7SUFDekQsS0FBSyxDQUFDLElBQUk7UUFDTiwrREFBK0Q7UUFDL0QsTUFBTSxJQUFJLEdBQUcsTUFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWUsQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUMvRSxPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxJQUFJO1lBQ2hCLElBQUksRUFBRSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsSUFBSTtTQUNuQixDQUFDO0lBQ04sQ0FBQztDQUNKLENBQUM7QUFFVyxRQUFBLGlCQUFpQixHQUFnQjtJQUMxQyxHQUFHLEVBQUUsb0JBQW9CO0lBQ3pCLElBQUksRUFBRSxZQUFZO0lBQ2xCLFdBQVcsRUFBRSwwQ0FBMEM7SUFDdkQsS0FBSyxDQUFDLElBQUk7UUFDTixNQUFNLE1BQU0sR0FBRyxNQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBZSxDQUFDLFVBQVUsRUFBRSxjQUFjLEVBQUU7WUFDN0UsTUFBTSxFQUFFLFVBQVU7U0FDckIsQ0FBQyxDQUFDO1FBQ0gsT0FBTztZQUNILE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLEVBQUUsQ0FB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S0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRTtRQUNmLE1BQU0sSUFBSSxHQUFHLE1BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFlLENBQUMsVUFBVSxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pGLElBQUksQ0FBQyxJQUFJO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN2RCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBQ0osQ0FBQztBQUVXLFFBQUEsYUFBYSxHQUFrQjtJQUN4Qyw0QkFBb0I7SUFDcEIseUJBQWlCO0lBQ2pCLDhCQUFzQjtJQUN0QixvQkFBWTtJQUNaLDhCQUFzQjtJQUN0Qix5QkFBaUI7SUFDakIsMEJBQWtCO0lBQ2xCLHNCQUFjO0lBQ2QsMkJBQW1CO0lBQ25CLDZCQUFxQjtJQUNyQiwwQkFBa0I7SUFDbEIscUJBQWE7Q0FDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgUmVzb3VyY2VEZWYgfSBmcm9tIFwiLi90eXBlc1wiO1xyXG5cclxuLyoqXHJcbiAqIFJlc291cmNlIGRlZmluaXRpb25zIGZvciB2Mi4wLjAuIEVhY2ggZnVuY3Rpb24gZGVsZWdhdGVzIHRvIEVkaXRvci5NZXNzYWdlXHJcbiAqIHRvIGZldGNoIHRoZSB1bmRlcmx5aW5nIGRhdGEg4oCUIHNhbWUgbG9naWMgYXMgdGhlIGNvcnJlc3BvbmRpbmcgcmVhZC1vbmx5XHJcbiAqIHRvb2xzLCBidXQgZXhwb3NlZCB2aWEgVVJJIGluc3RlYWQgb2YgdG9vbCBuYW1lLlxyXG4gKi9cclxuXHJcbi8vIOKUgOKUgOKUgCBTY2VuZSDilIDilIDilIBcclxuXHJcbmV4cG9ydCBjb25zdCBzY2VuZUN1cnJlbnRSZXNvdXJjZTogUmVzb3VyY2VEZWYgPSB7XHJcbiAgICB1cmk6IFwiY29jb3M6Ly9zY2VuZS9jdXJyZW50XCIsXHJcbiAgICBuYW1lOiBcIkN1cnJlbnQgU2NlbmVcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIk5hbWUgYW5kIFVVSUQgb2YgdGhlIGN1cnJlbnRseSBvcGVuIHNjZW5lLlwiLFxyXG4gICAgYXN5bmMgcmVhZCgpIHtcclxuICAgICAgICAvLyBxdWVyeS1jdXJyZW50LXNjZW5lIOOBryAzLjgueCDjgafli5XjgYvjgarjgYTjgZ/jgoEgcXVlcnktbm9kZS10cmVlIOOBruODq+ODvOODiOOBi+OCieWPluW+l1xyXG4gICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgbmFtZTogdHJlZT8ubmFtZSxcclxuICAgICAgICAgICAgdXVpZDogdHJlZT8udXVpZCxcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBzY2VuZUxpc3RSZXNvdXJjZTogUmVzb3VyY2VEZWYgPSB7XHJcbiAgICB1cmk6IFwiY29jb3M6Ly9zY2VuZS9saXN0XCIsXHJcbiAgICBuYW1lOiBcIlNjZW5lIExpc3RcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIkxpc3Qgb2YgYWxsIC5zY2VuZSBmaWxlcyBpbiB0aGUgcHJvamVjdC5cIixcclxuICAgIGFzeW5jIHJlYWQoKSB7XHJcbiAgICAgICAgY29uc3QgYXNzZXRzID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcImFzc2V0LWRiXCIsIFwicXVlcnktYXNzZXRzXCIsIHtcclxuICAgICAgICAgICAgY2NUeXBlOiBcImNjLlNjZW5lXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgc2NlbmVzOiAoQXJyYXkuaXNBcnJheShhc3NldHMpID8gYXNzZXRzIDogW10pLm1hcCgoYTogYW55KSA9PiAoe1xyXG4gICAgICAgICAgICAgICAgdXVpZDogYS51dWlkLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogYS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgdXJsOiBhLnVybCxcclxuICAgICAgICAgICAgfSkpLFxyXG4gICAgICAgIH07XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IHNjZW5lSGllcmFyY2h5UmVzb3VyY2U6IFJlc291cmNlRGVmID0ge1xyXG4gICAgdXJpOiBcImNvY29zOi8vc2NlbmUvaGllcmFyY2h5XCIsXHJcbiAgICBuYW1lOiBcIlNjZW5lIEhpZXJhcmNoeVwiLFxyXG4gICAgZGVzY3JpcHRpb246IFwiTm9kZSB0cmVlIG9mIHRoZSBjdXJyZW50bHkgb3BlbiBzY2VuZS4gU2hhbGxvdyAobmFtZSwgdXVpZCwgY2hpbGRyZW4pIOKAlCBmb3IgZnVsbCBkdW1wcywgdXNlIGNvY29zOi8vbm9kZS97dXVpZH0uXCIsXHJcbiAgICBhc3luYyByZWFkKCkge1xyXG4gICAgICAgIGNvbnN0IHRyZWUgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwic2NlbmVcIiwgXCJxdWVyeS1ub2RlLXRyZWVcIik7XHJcbiAgICAgICAgcmV0dXJuIHsgaGllcmFyY2h5OiB0cmVlIH07XHJcbiAgICB9LFxyXG59O1xyXG5cclxuLy8g4pSA4pSA4pSAIE5vZGUgLyBDb21wb25lbnQg4pSA4pSA4pSAXHJcblxyXG5leHBvcnQgY29uc3Qgbm9kZVJlc291cmNlOiBSZXNvdXJjZURlZiA9IHtcclxuICAgIHVyaVRlbXBsYXRlOiBcImNvY29zOi8vbm9kZS97dXVpZH1cIixcclxuICAgIG5hbWU6IFwiTm9kZSBEdW1wXCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJGdWxsIHByb3BlcnR5IGR1bXAgb2YgYSBub2RlIGJ5IFVVSUQuIEluY2x1ZGVzIGNvbXBvbmVudHMgKF9fY29tcHNfXykuXCIsXHJcbiAgICBhc3luYyByZWFkKHsgdXVpZCB9KSB7XHJcbiAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LW5vZGVcIiwgdXVpZCk7XHJcbiAgICAgICAgaWYgKCFkdW1wKSB0aHJvdyBuZXcgRXJyb3IoYE5vZGUgbm90IGZvdW5kOiAke3V1aWR9YCk7XHJcbiAgICAgICAgcmV0dXJuIGR1bXA7XHJcbiAgICB9LFxyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IG5vZGVDb21wb25lbnRzUmVzb3VyY2U6IFJlc291cmNlRGVmID0ge1xyXG4gICAgdXJpVGVtcGxhdGU6IFwiY29jb3M6Ly9ub2RlL3t1dWlkfS9jb21wb25lbnRzXCIsXHJcbiAgICBuYW1lOiBcIk5vZGUgQ29tcG9uZW50c1wiLFxyXG4gICAgZGVzY3JpcHRpb246IFwiQ29tcG9uZW50cyBvbiBhIG5vZGUgKHV1aWQgKyB0eXBlKSDigJQgbGlnaHRlciB0aGFuIHRoZSBmdWxsIG5vZGUgZHVtcC5cIixcclxuICAgIGFzeW5jIHJlYWQoeyB1dWlkIH0pIHtcclxuICAgICAgICBjb25zdCBkdW1wID0gYXdhaXQgKEVkaXRvci5NZXNzYWdlLnJlcXVlc3QgYXMgYW55KShcInNjZW5lXCIsIFwicXVlcnktbm9kZVwiLCB1dWlkKTtcclxuICAgICAgICBpZiAoIWR1bXApIHRocm93IG5ldyBFcnJvcihgTm9kZSBub3QgZm91bmQ6ICR7dXVpZH1gKTtcclxuICAgICAgICBjb25zdCBjb21wcyA9IChkdW1wLl9fY29tcHNfXyB8fCBbXSkubWFwKChjOiBhbnkpID0+ICh7XHJcbiAgICAgICAgICAgIHV1aWQ6IGMudmFsdWU/LnV1aWQ/LnZhbHVlIHx8IGMudXVpZCxcclxuICAgICAgICAgICAgdHlwZTogYy50eXBlLFxyXG4gICAgICAgIH0pKTtcclxuICAgICAgICByZXR1cm4geyB1dWlkLCBjb21wb25lbnRzOiBjb21wcyB9O1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBjb21wb25lbnRSZXNvdXJjZTogUmVzb3VyY2VEZWYgPSB7XHJcbiAgICB1cmlUZW1wbGF0ZTogXCJjb2NvczovL2NvbXBvbmVudC97dXVpZH1cIixcclxuICAgIG5hbWU6IFwiQ29tcG9uZW50IER1bXBcIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIkZ1bGwgcHJvcGVydHkgZHVtcCBvZiBhIGNvbXBvbmVudCBieSBjb21wb25lbnQgVVVJRCAobm90IG5vZGUgVVVJRCkuXCIsXHJcbiAgICBhc3luYyByZWFkKHsgdXVpZCB9KSB7XHJcbiAgICAgICAgY29uc3QgZHVtcCA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJzY2VuZVwiLCBcInF1ZXJ5LWNvbXBvbmVudFwiLCB1dWlkKTtcclxuICAgICAgICBpZiAoIWR1bXApIHRocm93IG5ldyBFcnJvcihgQ29tcG9uZW50IG5vdCBmb3VuZDogJHt1dWlkfWApO1xyXG4gICAgICAgIHJldHVybiBkdW1wO1xyXG4gICAgfSxcclxufTtcclxuXHJcbi8vIOKUgOKUgOKUgCBQcmVmYWIg4pSA4pSA4pSAXHJcblxyXG5leHBvcnQgY29uc3QgcHJlZmFiTGlzdFJlc291cmNlOiBSZXNvdXJjZURlZiA9IHtcclxuICAgIHVyaTogXCJjb2NvczovL3ByZWZhYi9saXN0XCIsXHJcbiAgICBuYW1lOiBcIlByZWZhYiBMaXN0XCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJBbGwgcHJlZmFicyBpbiB0aGUgcHJvamVjdCAodXVpZCArIHBhdGgpLlwiLFxyXG4gICAgYXN5bmMgcmVhZCgpIHtcclxuICAgICAgICBjb25zdCBhc3NldHMgPSBhd2FpdCAoRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCBhcyBhbnkpKFwiYXNzZXQtZGJcIiwgXCJxdWVyeS1hc3NldHNcIiwge1xyXG4gICAgICAgICAgICBjY1R5cGU6IFwiY2MuUHJlZmFiXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcHJlZmFiczogKEFycmF5LmlzQXJyYXkoYXNzZXRzKSA/IGFzc2V0cyA6IFtdKS5tYXAoKGE6IGFueSkgPT4gKHtcclxuICAgICAgICAgICAgICAgIHV1aWQ6IGEudXVpZCxcclxuICAgICAgICAgICAgICAgIG5hbWU6IGEubmFtZSxcclxuICAgICAgICAgICAgICAgIHVybDogYS51cmwsXHJcbiAgICAgICAgICAgIH0pKSxcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBwcmVmYWJSZXNvdXJjZTogUmVzb3VyY2VEZWYgPSB7XHJcbiAgICB1cmlUZW1wbGF0ZTogXCJjb2NvczovL3ByZWZhYi97dXVpZH1cIixcclxuICAgIG5hbWU6IFwiUHJlZmFiIEluZm9cIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIkFzc2V0IGluZm8gZm9yIGEgcHJlZmFiIGJ5IFVVSUQuXCIsXHJcbiAgICBhc3luYyByZWFkKHsgdXVpZCB9KSB7XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgdXVpZCk7XHJcbiAgICAgICAgaWYgKCFpbmZvKSB0aHJvdyBuZXcgRXJyb3IoYFByZWZhYiBub3QgZm91bmQ6ICR7dXVpZH1gKTtcclxuICAgICAgICByZXR1cm4gaW5mbztcclxuICAgIH0sXHJcbn07XHJcblxyXG4vLyDilIDilIDilIAgUHJvamVjdCAvIEVkaXRvciDilIDilIDilIBcclxuXHJcbmV4cG9ydCBjb25zdCBwcm9qZWN0SW5mb1Jlc291cmNlOiBSZXNvdXJjZURlZiA9IHtcclxuICAgIHVyaTogXCJjb2NvczovL3Byb2plY3QvaW5mb1wiLFxyXG4gICAgbmFtZTogXCJQcm9qZWN0IEluZm9cIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIlByb2plY3QgbmFtZSBhbmQgcm9vdCBwYXRoLlwiLFxyXG4gICAgYXN5bmMgcmVhZCgpIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBuYW1lOiBFZGl0b3IuUHJvamVjdC5uYW1lLFxyXG4gICAgICAgICAgICBwYXRoOiBFZGl0b3IuUHJvamVjdC5wYXRoLFxyXG4gICAgICAgICAgICB0bXBEaXI6IEVkaXRvci5Qcm9qZWN0LnRtcERpcixcclxuICAgICAgICB9O1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBwcm9qZWN0RW5naW5lUmVzb3VyY2U6IFJlc291cmNlRGVmID0ge1xyXG4gICAgdXJpOiBcImNvY29zOi8vcHJvamVjdC9lbmdpbmVcIixcclxuICAgIG5hbWU6IFwiRW5naW5lIEluZm9cIixcclxuICAgIGRlc2NyaXB0aW9uOiBcIkVuZ2luZSB2ZXJzaW9uIGFuZCBlbmdpbmUgcGF0aC5cIixcclxuICAgIGFzeW5jIHJlYWQoKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJlbmdpbmVcIiwgXCJxdWVyeS1pbmZvXCIpO1xyXG4gICAgICAgICAgICByZXR1cm4gaW5mbyB8fCB7fTtcclxuICAgICAgICB9IGNhdGNoIHtcclxuICAgICAgICAgICAgcmV0dXJuIHt9O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZWRpdG9ySW5mb1Jlc291cmNlOiBSZXNvdXJjZURlZiA9IHtcclxuICAgIHVyaTogXCJjb2NvczovL2VkaXRvci9pbmZvXCIsXHJcbiAgICBuYW1lOiBcIkVkaXRvciBJbmZvXCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJDb2NvcyBDcmVhdG9yIGVkaXRvciB2ZXJzaW9uLCBpbnN0YWxsIHBhdGgsIGFuZCBsYW5ndWFnZS5cIixcclxuICAgIGFzeW5jIHJlYWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdmVyc2lvbjogRWRpdG9yLkFwcC52ZXJzaW9uLFxyXG4gICAgICAgICAgICBwYXRoOiBFZGl0b3IuQXBwLnBhdGgsXHJcbiAgICAgICAgICAgIGhvbWU6IEVkaXRvci5BcHAuaG9tZSxcclxuICAgICAgICAgICAgbGFuZ3VhZ2U6IEVkaXRvci5JMThuPy5nZXRMYW5ndWFnZT8uKCkgfHwgXCJ1bmtub3duXCIsXHJcbiAgICAgICAgfTtcclxuICAgIH0sXHJcbn07XHJcblxyXG4vLyDilIDilIDilIAgQXNzZXQg4pSA4pSA4pSAXHJcblxyXG5leHBvcnQgY29uc3QgYXNzZXRSZXNvdXJjZTogUmVzb3VyY2VEZWYgPSB7XHJcbiAgICB1cmlUZW1wbGF0ZTogXCJjb2NvczovL2Fzc2V0L3t1dWlkfVwiLFxyXG4gICAgbmFtZTogXCJBc3NldCBJbmZvXCIsXHJcbiAgICBkZXNjcmlwdGlvbjogXCJBc3NldCBkZXRhaWxzIGJ5IFVVSUQgKHBhdGgsIHR5cGUsIGRlcGVuZGVuY2llcykuXCIsXHJcbiAgICBhc3luYyByZWFkKHsgdXVpZCB9KSB7XHJcbiAgICAgICAgY29uc3QgaW5mbyA9IGF3YWl0IChFZGl0b3IuTWVzc2FnZS5yZXF1ZXN0IGFzIGFueSkoXCJhc3NldC1kYlwiLCBcInF1ZXJ5LWFzc2V0LWluZm9cIiwgdXVpZCk7XHJcbiAgICAgICAgaWYgKCFpbmZvKSB0aHJvdyBuZXcgRXJyb3IoYEFzc2V0IG5vdCBmb3VuZDogJHt1dWlkfWApO1xyXG4gICAgICAgIHJldHVybiBpbmZvO1xyXG4gICAgfSxcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBBTExfUkVTT1VSQ0VTOiBSZXNvdXJjZURlZltdID0gW1xyXG4gICAgc2NlbmVDdXJyZW50UmVzb3VyY2UsXHJcbiAgICBzY2VuZUxpc3RSZXNvdXJjZSxcclxuICAgIHNjZW5lSGllcmFyY2h5UmVzb3VyY2UsXHJcbiAgICBub2RlUmVzb3VyY2UsXHJcbiAgICBub2RlQ29tcG9uZW50c1Jlc291cmNlLFxyXG4gICAgY29tcG9uZW50UmVzb3VyY2UsXHJcbiAgICBwcmVmYWJMaXN0UmVzb3VyY2UsXHJcbiAgICBwcmVmYWJSZXNvdXJjZSxcclxuICAgIHByb2plY3RJbmZvUmVzb3VyY2UsXHJcbiAgICBwcm9qZWN0RW5naW5lUmVzb3VyY2UsXHJcbiAgICBlZGl0b3JJbmZvUmVzb3VyY2UsXHJcbiAgICBhc3NldFJlc291cmNlLFxyXG5dO1xyXG4iXX0=