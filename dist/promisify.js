const isPlainObject = require('./.internals/isPlainObject');

const promisified = function(fn, args, options = {}) {
  return new Promise((resolve, reject) => {
    args.push((err, ...result) => {
      if (err) return reject(err);
      return options.multiArgs ? resolve(result) : resolve(result[0]);
    });

    fn.apply(this, args);
  });
};

const shouldPromisify = function(key, cbModule, excludeList, includeList) {
  return typeof cbModule[key] === 'function'
    && (!includeList || includeList.some((k) => k === key))
    && (!excludeList || excludeList.every((k) => k !== key));
};

const promisify = function(fn, options) {
  return function(...args) {
    return promisified.call(this, fn, args, options);
  };
};


/**
 * Promisify error first callback function
 *
 * @param {Function} fn - error first callback function we want to promisify
 * @returns {Function} Function that returns promise
 */
module.exports = promisify;

/**
 * Promisifies the entire object by going through the object's properties and creating an
 * promisified equivalent of each function on the object. It does not go through object prototype.
 *
 * @param {Object} cbModule - Module with error first callback functions we want to promisify
 * @returns {Object} Promisified module
 */
module.exports.all = (cbModule, options = {}) => {
  if (!isPlainObject(cbModule)) {
    return cbModule;
  }

  options.suffix = options.suffix || 'Async';
  const async = options.mutate === true ? cbModule : Object.assign({}, cbModule);

  Object.keys(cbModule).forEach((key) => {
    if (shouldPromisify(key, cbModule, options.exclude, options.include)) {
      async[`${key}${options.suffix}`] = promisify(cbModule[key], options);
    }
  });

  return async;
};
