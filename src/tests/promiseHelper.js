export default function testAfterPromise(promise, fn, done) {
  promise.then((p) => {
    try {
      fn(p);
      done();
    } catch (err) {
      done(err);
    }
  }).catch((err) => {
    done(new Error(`Uncaught error was thrown: ${err.message}`));
  });
}
