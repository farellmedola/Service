import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/health.js';

function response(){return{statusCode:200,headers:{},body:null,setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
const original=process.env.DATABASE_READONLY_URL;
test('health endpoint rejects non-GET requests',async()=>{const res=response();await handler({method:'POST'},res);assert.equal(res.statusCode,405);assert.equal(res.body.code,'METHOD_NOT_ALLOWED');});
test('health endpoint reports missing read-only database configuration',async()=>{delete process.env.DATABASE_READONLY_URL;const res=response();await handler({method:'GET'},res);assert.equal(res.statusCode,503);assert.equal(res.body.code,'DATABASE_READONLY_NOT_CONFIGURED');});
test('restores database environment',()=>{if(original===undefined)delete process.env.DATABASE_READONLY_URL;else process.env.DATABASE_READONLY_URL=original;assert.ok(true);});
