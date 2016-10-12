"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.testAfterPromise = testAfterPromise;
function testAfterPromise(promise, fn, done) {
    promise.then(function (p) {
        try {
            fn(p);
            done();
        } catch (err) {
            done(err);
        }
    }).catch(function (err) {
        done(new Error("Uncaught error was thrown: " + err.message));
    });
}