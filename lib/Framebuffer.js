var arrayEqual = require('array-equal')
var getExtension = require('gl-extension')

module.exports = Framebuffer
function Framebuffer (gl, color, opt) {
  this.gl = gl

  if (!Array.isArray(color)) {
    throw new Error('color must be a [width, height] or array of textures')
  }
  this.handle = gl.createFramebuffer()
  this.color = color
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle)

  var shape = color[0].shape

  // attach textures to frame buffer
  color.forEach(function (texture, i) {
    if (!arrayEqual(texture.shape, shape)) {
      throw new Error('all textures must have the same [ width, height ] shape')
    }

    var target = opt.target || texture.target
    var attachment = gl.COLOR_ATTACHMENT0 + i
    texture.bind()
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER, attachment,
      target, texture.handle, 0)
  })

  var width = shape[0]
  var height = shape[1]
  var colorBufType = gl.RGBA4
  var useStencil = Boolean(opt.stencil)
  var useDepth = Boolean(opt.depth)

  this._colorBuffer
  var numColors = color.length
  if (numColors === 0) {
    this._colorBuffer = initRenderBuffer(gl, width, height, colorBufType, gl.COLOR_ATTACHMENT0)
  } else {
    throw new Error('not yet supported')
  }

  // allocate depth/stencil buffers
  // var depthEXT = getExtension(gl, 'WEBGL_depth_texture')
  // if (depthEXT) {
  // }

  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    this.dispose()
    throwFBOError(gl, status)
  }
}

Framebuffer.prototype.dispose = function () {
  var gl = this.gl
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.deleteFramebuffer(this.handle)
  if (this.depth) {
    this.depth.dispose()
    this.depth = null
  }

  this.color.forEach(function (color) {
    color.dispose()
  })
  this.color.length = 0

  if (this._depthBuffer) {
    gl.deleteRenderbuffer(this._depthBuffer)
    this._depthBuffer = null
  }
  if (this._colorBuffer) {
    gl.deleteRenderbuffer(this._colorBuffer)
    this._colorBuffer = null
  }
}

// Initialize a render buffer object
function initRenderBuffer (gl, width, height, component, attachment) {
  var result = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, result)
  gl.renderbufferStorage(gl.RENDERBUFFER, component, width, height)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, result)
  return result
}

function throwFBOError (gl, status) {
  switch (status) {
    case gl.FRAMEBUFFER_UNSUPPORTED:
      throw new Error('Framebuffer unsupported')
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      throw new Error('Framebuffer incomplete attachment')
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      throw new Error('Framebuffer incomplete dimensions')
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      throw new Error('Framebuffer incomplete missing attachment')
    default:
      throw new Error('Framebuffer failed for unspecified reason')
  }
}
