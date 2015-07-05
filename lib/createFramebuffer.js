var Framebuffer = require('./Framebuffer')

module.exports = createFramebuffer
function createFramebuffer (createTexture, gl, shape, opt) {
  if (!gl) {
    throw new Error('must specify GL context')
  }

  // defaults to 1, but user can specify
  // "false" (0) or a number (N)
  var numColors = typeof opt.color === 'undefined' ? 1 : (opt.color | 0)
  if (numColors < 0) {
    throw new Error('must specify >= 0 color attachments')
  }

  var textures = []
  for (var i = 0; i < numColors; i++) {
    textures.push(createTexture(gl, null, shape, opt))
  }

  return new Framebuffer(gl, textures, shape, opt)
}
