var createFBO = require('./lib/createFramebuffer')
var createTexture2D = require('glo-texture/2d')

module.exports = createFramebuffer2D
function createFramebuffer2D (gl, shape, opt) {
  return createFBO(createTexture2D, gl, shape, opt)
}
