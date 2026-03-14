const express = require('express');
const app = require('./index').app; // Might not work if index doesn't export app
const apiRoutes = require('./routes/api');

function print (path, layer) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))))
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))))
  } else if (layer.method) {
    console.log('%s /%s',
      layer.method.toUpperCase(),
      path.concat(split(layer.regexp)).filter(Boolean).join('/'))
  }
}

function split (regexp) {
  if (regexp.fast_slash) {
    return ''
  } else {
    var parts = regexp.toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '')
      .slice(1, -1)
      .split('\\/')
    return parts.length > 1 ? parts : parts[0]
  }
}

console.log('--- Registered Routes ---');
apiRoutes.stack.forEach(print.bind(null, []));
console.log('-------------------------');
