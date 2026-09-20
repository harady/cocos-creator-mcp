// Run after npm run build. Also runs with Creator 3.8.3's Node 14.16.
const assert = require('assert');
const { SceneAdvancedTools } = require('../dist/tools/scene-advanced-tools');

async function main() {
    const originalEditor = global.Editor;
    const originalCrypto = Object.getOwnPropertyDescriptor(global, 'crypto');
    const scenes = [];
    const opened = [];
    let currentUuid = 'test-asset-uuid';
    Object.defineProperty(global, 'crypto', { value: undefined, configurable: true });
    global.Editor = { Message: { request: async (channel, method, ...args) => {
        if (channel === 'scene' && method === 'query-dirty') return false;
        if (channel === 'scene' && method === 'new-scene') throw new Error('Message does not exist: scene - new-scene');
        if (channel === 'asset-db' && method === 'generate-available-url') return 'db://assets/NewScene.scene';
        if (channel === 'asset-db' && method === 'create-asset') { scenes.push(JSON.parse(args[1])); return {}; }
        if (channel === 'asset-db' && method === 'query-uuid') return 'test-asset-uuid';
        if (channel === 'scene' && method === 'open-scene') { opened.push(args[0]); return; }
        if (channel === 'scene' && method === 'query-node-tree') return { uuid: currentUuid };
        throw new Error(`Unexpected message: ${channel}/${method}`);
    } } };
    try {
        const tools = new SceneAdvancedTools();
        for (const args of [{ path: 'db://assets/Compatibility.scene' }, {}]) {
            const result = await tools.execute('scene_create', args);
            assert.ok(!result.isError, JSON.stringify(result));
            assert.strictEqual(JSON.parse(result.content[0].text).success, true);
        }
        assert.strictEqual(scenes.length, 2);
        for (const scene of scenes) {
            const globals = scene[scene[1]._globals.__id__];
            assert.strictEqual(globals.__type__, 'cc.SceneGlobals');
            for (const [field, type] of Object.entries({ ambient: 'cc.AmbientInfo', shadows: 'cc.ShadowsInfo', _skybox: 'cc.SkyboxInfo', fog: 'cc.FogInfo' })) {
                assert.strictEqual(scene[globals[field].__id__].__type__, type);
            }
            const visit = value => {
                if (!value || typeof value !== 'object') return;
                if ('__id__' in value) assert.ok(scene[value.__id__], `Dangling reference ${value.__id__}`);
                Object.values(value).forEach(visit);
            };
            visit(scene);
        }
        const ids = scenes.map(scene => scene.find(item => item.__type__ === 'cc.Scene')._id);
        for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        assert.notStrictEqual(ids[0], ids[1]);
        assert.deepStrictEqual(opened, ['test-asset-uuid', 'test-asset-uuid']);
        currentUuid = 'fallback-empty-scene';
        const failedOpen = await tools.execute('scene_create', { path: 'db://assets/Failed.scene' });
        assert.strictEqual(failedOpen.isError, true);
        assert.match(failedOpen.content[0].text, /could not be opened/);
        console.log('PASS: scene creation without global crypto (explicit path and 3.8.x fallback)');
    } finally {
        global.Editor = originalEditor;
        if (originalCrypto) Object.defineProperty(global, 'crypto', originalCrypto);
        else delete global.crypto;
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
