const assert = require('assert');
const { ResourceRegistry } = require('../dist/resources/registry');
const registry = new ResourceRegistry();
for (const uriTemplate of ['cocos://node/{uuid}', 'cocos://node/{uuid}/components', 'cocos://component/{uuid}']) {
    registry.register({ uriTemplate, name: uriTemplate, description: '', read: async params => params });
}
const uuid = 'example/short+uuid';
for (const template of registry.listTemplates()) {
    const match = registry.match(template.uriTemplate.replace('{uuid}', encodeURIComponent(uuid)));
    assert.ok(match);
    assert.strictEqual(match.params.uuid, uuid);
}
assert.strictEqual(registry.match('cocos://node/plain-uuid').params.uuid, 'plain-uuid');
assert.strictEqual(registry.match('cocos://node/literal%252F').params.uuid, 'literal%2F');
assert.strictEqual(registry.match('cocos://node/%ZZ'), null);
console.log('PASS: URI parameters decode exactly once, including slash and plus in Cocos UUIDs');
