var createFBO = require('./lib/createFramebuffer')
var createTextureCube = require('glo-texture/cube')

module.exports = createFramebufferCube
function createFramebufferCube (gl, shape, opt) {
  if (!opt || typeof opt.face !== 'number') {
    throw new Error('must specify a face for this cube Framebuffer')
  }
  return createFBO(createTextureCube, gl, shape, opt)
}
