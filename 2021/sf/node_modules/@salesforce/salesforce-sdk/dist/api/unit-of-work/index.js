"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Method = void 0;
var UnitOfWork_1 = require("./UnitOfWork");
Object.defineProperty(exports, "UnitOfWork", { enumerable: true, get: function () { return UnitOfWork_1.UnitOfWork; } });
Object.defineProperty(exports, "UnitOfWorkErrorResponse", { enumerable: true, get: function () { return UnitOfWork_1.UnitOfWorkErrorResponse; } });
Object.defineProperty(exports, "UnitOfWorkResponse", { enumerable: true, get: function () { return UnitOfWork_1.UnitOfWorkResponse; } });
Object.defineProperty(exports, "UnitOfWorkResult", { enumerable: true, get: function () { return UnitOfWork_1.UnitOfWorkResult; } });
Object.defineProperty(exports, "UnitOfWorkSuccessResponse", { enumerable: true, get: function () { return UnitOfWork_1.UnitOfWorkSuccessResponse; } });
var UnitOfWorkGraph_1 = require("./UnitOfWorkGraph");
Object.defineProperty(exports, "UnitOfWorkGraph", { enumerable: true, get: function () { return UnitOfWorkGraph_1.UnitOfWorkGraph; } });
var CompositeApi_1 = require("./CompositeApi");
Object.defineProperty(exports, "CompositeGraphResponse", { enumerable: true, get: function () { return CompositeApi_1.CompositeGraphResponse; } });
var Method;
(function (Method) {
    Method["DELETE"] = "DELETE";
    Method["GET"] = "GET";
    Method["PATCH"] = "PATCH";
    Method["POST"] = "POST";
    Method["PUT"] = "PUT";
})(Method = exports.Method || (exports.Method = {}));
//# sourceMappingURL=index.js.map