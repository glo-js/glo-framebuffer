var getExtension = require('gl-extension')
var createTexture = require('glo-texture/2d')
var dprop = require('dprop')

module.exports = Framebuffer
function Framebuffer (gl, textures, shape, opt) {
  if (!Array.isArray(shape)) {
    throw new Error('must include [width, height] of FBO')
  }

  opt = opt || {}
  this.gl = gl
  this._drawBuffersExt = null
  this.color = textures
  this.shape = shape

  var numColors = textures.length
  if (numColors > 1) {
    this._drawBuffersExt = getExtension(gl, 'WEBGL_draw_buffers')
    if (!this._drawBuffersExt) {
      throw new Error('multiple color attachments not supported')
    } else if (numColors > gl.getParameter(this._drawBuffersExt.MAX_COLOR_ATTACHMENTS_WEBGL)) {
      throw new Error('GL context does not support ' + numColors + ' color attachments')
    }
  }

  var useStencil = Boolean(opt.stencil)
  var useDepth = Boolean(opt.depth !== false)

  this.handle = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle)

  // attach textures to frame buffer
  textures.forEach(function (texture, i) {
    texture.bind()

    // for cube map FBO, we can just specify a
    // face to render to
    // otherwise default to texture target (eg gl.TEXTURE_2D)
    var target = texture.target
    if (target === gl.TEXTURE_CUBE_MAP) {
      target = opt.face || target
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0 + i,
      target,
      texture.handle, 0)
  })

  // attachment indices
  this.attachments = textures.map(function (t, i) {
    return gl.COLOR_ATTACHMENT0 + i
  })

  // no texture attachments, use a default render buffer storage
  if (numColors === 0) {
    // default color buffer format when colors=0
    var colorBufferType = gl.RGBA4
    this._colorBuffer = initRenderBuffer(gl, shape, colorBufferType, gl.COLOR_ATTACHMENT0)
  }

  // Allocate depth and/or stencil buffers
  this._depthExt = getExtension(gl, 'WEBGL_depth_texture')
  if (useDepth && useStencil) {
    if (this._depthExt) {
      this.depth = initTexture2D(gl,
        shape, this._depthExt.UNSIGNED_INT_24_8_WEBGL,
        gl.DEPTH_STENCIL, gl.DEPTH_STENCIL_ATTACHMENT)
    } else {
      this._renderBuffer = initRenderBuffer(gl,
        shape, gl.DEPTH_STENCIL, gl.DEPTH_STENCIL_ATTACHMENT)
    }
  } else if (useDepth && !useStencil) {
    if (this._depthExt) {
      this.depth = initTexture2D(gl,
        shape, gl.UNSIGNED_SHORT,
        gl.DEPTH_COMPONENT, gl.DEPTH_ATTACHMENT)
    } else {
      this._renderBuffer = initRenderBuffer(gl,
        shape, gl.DEPTH_COMPONENT16, gl.DEPTH_ATTACHMENT)
    }
  } else if (!useDepth && useStencil) {
    this._renderBuffer = initRenderBuffer(gl, shape, gl.STENCIL_INDEX, gl.STENCIL_ATTACHMENT)
  }

  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    this.dispose()
    throwFBOError(gl, status)
  }
}

Object.defineProperties(Framebuffer.prototype, {
  width: dprop(function () {
    return this.shape[0]
  }),

  height: dprop(function () {
    return this.shape[1]
  })
})

Framebuffer.prototype.bind = function () {
  var gl = this.gl
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle)
  if (this.attachments.length > 1) {
    this._drawBuffersExt.drawBuffersWEBGL(this.attachments)
  }
}

Framebuffer.prototype.dispose = function () {
  var gl = this.gl
  var oldBinding = gl.getParameter(gl.FRAMEBUFFER_BINDING)

  if (oldBinding === this.handle) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  this.color.forEach(function (texture) {
    texture.dispose()
  })

  gl.deleteFramebuffer(this.handle)
  if (this.depth) {
    this.depth.dispose()
    this.depth = null
  }

  if (this._renderBuffer) { // depth / stencil default
    gl.deleteRenderbuffer(this._renderBuffer)
    this._renderBuffer = null
  }
  if (this._colorBuffer) { // color buffer default
    gl.deleteRenderbuffer(this._colorBuffer)
    this._colorBuffer = null
  }
}

// Initialize a render buffer object
function initRenderBuffer (gl, shape, component, attachment) {
  var result = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, result)
  gl.renderbufferStorage(gl.RENDERBUFFER, component, shape[0], shape[1])
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, result)
  return result
}

function initTexture2D (gl, shape, type, format, attachment) {
  var tex = createTexture(gl, null, shape, {
    type: type,
    format: format,
    minFilter: gl.NEAREST,
    magFilter: gl.NEAREST
  })

  tex.bind()
  gl.framebufferTexture2D(gl.FRAMEBUFFER,
    attachment,
    tex.target,
    tex.handle, 0)
  return tex
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
