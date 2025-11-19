"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lmStudioService = void 0;
// @/lib/lm-studio/client.ts
var sdk_1 = require("@lmstudio/sdk");
/**
 * Robust LM Studio service:
 * - Forces IPv4 by default (127.0.0.1)
 * - Tries SDK first but falls back to direct HTTP fetch for health/list
 */
var LMStudioService = /** @class */ (function () {
    function LMStudioService() {
        this.client = null;
        // Default to IPv4 address to avoid ::1/IPv6 resolution issues in Node
        this.baseUrl = process.env.LMSTUDIO_BASE_URL || 'ws://127.0.0.1:1234';
    }
    LMStudioService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.client)
                    return [2 /*return*/];
                try {
                    // Pass baseUrl explicitly to SDK. If the SDK version doesn't accept it, it will ignore it,
                    // but most versions support a constructor opts object.
                    this.client = new sdk_1.LMStudioClient({ baseUrl: this.baseUrl });
                }
                catch (err) {
                    // Keep error but do not crash: we will fallback to HTTP fetch for health/list
                    console.warn('LMStudioClient construction warning:', err);
                    this.client = null;
                }
                return [2 /*return*/];
            });
        });
    };
    // Low-level fetch helper (Node/Next will use global fetch)
    LMStudioService.prototype.fetchJson = function (path_1) {
        return __awaiter(this, arguments, void 0, function (path, opts) {
            var url, res, body, e;
            if (opts === void 0) { opts = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.baseUrl.replace(/\/$/, '') + path;
                        return [4 /*yield*/, fetch(url, __assign({}, opts))];
                    case 1:
                        res = _a.sent();
                        if (!!res.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.text().catch(function () { return ''; })];
                    case 2:
                        body = _a.sent();
                        e = new Error("HTTP ".concat(res.status, " ").concat(res.statusText));
                        e.status = res.status;
                        e.body = body;
                        throw e;
                    case 3: return [2 /*return*/, res.json()];
                }
            });
        });
    };
    /**
     * Health check — try SDK first, then fallback to HTTP GET /v1/models at 127.0.0.1
     */
    LMStudioService.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sdkModels, err_1, json, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        if (!this.client) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.client.system.listDownloadedModels()];
                    case 3:
                        sdkModels = _a.sent();
                        if (Array.isArray(sdkModels))
                            return [2 /*return*/, true];
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.warn('SDK listDownloadedModels failed, will fallback to HTTP:', err_1);
                        return [3 /*break*/, 5];
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.fetchJson('/v1/models', { method: 'GET' })];
                    case 6:
                        json = _a.sent();
                        return [2 /*return*/, !!(json && Array.isArray(json.data))];
                    case 7:
                        err_2 = _a.sent();
                        console.error('HTTP fallback health check failed:', err_2);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * List models — prefer SDK, fallback to HTTP
     */
    LMStudioService.prototype.listModels = function () {
        return __awaiter(this, void 0, void 0, function () {
            var models, err_3, json, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        if (!this.client) return [3 /*break*/, 5];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.client.system.listDownloadedModels()];
                    case 3:
                        models = _a.sent();
                        return [2 /*return*/, (models || []).map(function (m) {
                                var _a, _b, _c, _d, _e;
                                return ({
                                    path: (_c = (_b = (_a = m.id) !== null && _a !== void 0 ? _a : m.path) !== null && _b !== void 0 ? _b : m.identifier) !== null && _c !== void 0 ? _c : String(m),
                                    type: (_d = m.type) !== null && _d !== void 0 ? _d : 'model',
                                    size: (_e = m.sizeBytes) !== null && _e !== void 0 ? _e : m.size,
                                    architecture: m.architecture,
                                    capabilities: ['chat', 'completion'],
                                });
                            })];
                    case 4:
                        err_3 = _a.sent();
                        console.warn('SDK listDownloadedModels failed, falling back to HTTP:', err_3);
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, this.fetchJson('/v1/models', { method: 'GET' })];
                    case 6:
                        json = _a.sent();
                        data = Array.isArray(json.data) ? json.data : [];
                        return [2 /*return*/, data.map(function (m) {
                                var _a, _b, _c, _d;
                                return ({
                                    path: (_b = (_a = m.id) !== null && _a !== void 0 ? _a : m.path) !== null && _b !== void 0 ? _b : String(m),
                                    type: (_c = m.type) !== null && _c !== void 0 ? _c : 'model',
                                    size: (_d = m.sizeBytes) !== null && _d !== void 0 ? _d : m.size,
                                    architecture: m.architecture,
                                    capabilities: ['chat', 'completion'],
                                });
                            })];
                }
            });
        });
    };
    LMStudioService.prototype.loadModel = function (modelPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connect()];
                    case 1:
                        _a.sent();
                        if (!this.client) {
                            // if SDK not available, try HTTP load via CLI or instruct user
                            throw new Error('LMStudio SDK unavailable; please load model with `lms load <model>`');
                        }
                        return [4 /*yield*/, this.client.llm.load(modelPath)];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    LMStudioService.prototype.streamChat = function (modelPath_1, messages_1) {
        return __asyncGenerator(this, arguments, function streamChat_1(modelPath, messages, options) {
            var model, validOptions, prediction, _a, prediction_1, prediction_1_1, chunk, e_1_1;
            var _b, e_1, _c, _d;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, __await(this.connect())];
                    case 1:
                        _e.sent();
                        if (!this.client) {
                            throw new Error('LMStudio SDK not available for streaming. Use HTTP chat endpoint instead.');
                        }
                        return [4 /*yield*/, __await(this.loadModel(modelPath))];
                    case 2:
                        model = _e.sent();
                        validOptions = {};
                        if (options.temperature !== undefined)
                            validOptions.temperature = options.temperature;
                        if (options.topP !== undefined)
                            validOptions.topP = options.topP;
                        if (options.stopSequences !== undefined)
                            validOptions.stopStrings = options.stopSequences;
                        prediction = model.respond(messages.map(function (m) { return ({ role: m.role, content: m.content }); }), validOptions);
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 13, 14, 19]);
                        _a = true, prediction_1 = __asyncValues(prediction);
                        _e.label = 4;
                    case 4: return [4 /*yield*/, __await(prediction_1.next())];
                    case 5:
                        if (!(prediction_1_1 = _e.sent(), _b = prediction_1_1.done, !_b)) return [3 /*break*/, 12];
                        _d = prediction_1_1.value;
                        _a = false;
                        chunk = _d;
                        if (!(typeof chunk === 'string')) return [3 /*break*/, 8];
                        return [4 /*yield*/, __await(chunk)];
                    case 6: return [4 /*yield*/, _e.sent()];
                    case 7:
                        _e.sent();
                        return [3 /*break*/, 11];
                    case 8:
                        if (!(chunk && typeof chunk === 'object' && 'content' in chunk)) return [3 /*break*/, 11];
                        return [4 /*yield*/, __await(String(chunk.content))];
                    case 9: return [4 /*yield*/, _e.sent()];
                    case 10:
                        _e.sent();
                        _e.label = 11;
                    case 11:
                        _a = true;
                        return [3 /*break*/, 4];
                    case 12: return [3 /*break*/, 19];
                    case 13:
                        e_1_1 = _e.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 19];
                    case 14:
                        _e.trys.push([14, , 17, 18]);
                        if (!(!_a && !_b && (_c = prediction_1.return))) return [3 /*break*/, 16];
                        return [4 /*yield*/, __await(_c.call(prediction_1))];
                    case 15:
                        _e.sent();
                        _e.label = 16;
                    case 16: return [3 /*break*/, 18];
                    case 17:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 18: return [7 /*endfinally*/];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    LMStudioService.prototype.chat = function (modelPath_1, messages_1) {
        return __awaiter(this, arguments, void 0, function (modelPath, messages, options) {
            var out, _a, _b, _c, chunk, e_2_1;
            var _d, e_2, _e, _f;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        out = '';
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 6, 7, 12]);
                        _a = true, _b = __asyncValues(this.streamChat(modelPath, messages, options));
                        _g.label = 2;
                    case 2: return [4 /*yield*/, _b.next()];
                    case 3:
                        if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 5];
                        _f = _c.value;
                        _a = false;
                        chunk = _f;
                        out += chunk;
                        _g.label = 4;
                    case 4:
                        _a = true;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 12];
                    case 6:
                        e_2_1 = _g.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 12];
                    case 7:
                        _g.trys.push([7, , 10, 11]);
                        if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 9];
                        return [4 /*yield*/, _e.call(_b)];
                    case 8:
                        _g.sent();
                        _g.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        if (e_2) throw e_2.error;
                        return [7 /*endfinally*/];
                    case 11: return [7 /*endfinally*/];
                    case 12: return [2 /*return*/, out];
                }
            });
        });
    };
    LMStudioService.prototype.disconnect = function () {
        this.client = null;
    };
    return LMStudioService;
}());
exports.lmStudioService = new LMStudioService();
