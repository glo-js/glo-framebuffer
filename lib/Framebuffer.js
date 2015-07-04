var getExtension = require('gl-extension')
var createTexture = require('glo-texture/2d')

module.exports = Framebuffer
function Framebuffer (gl, shape, opt) {
  if (!Array.isArray(shape)) {
    throw new Error('must include [width, height] of FBO')
  }

  opt = opt || {}
  this.gl = gl
  this._drawBuffersExt = null
  this.colors = opt.colors || []

  var numColors = this.colors.length
  if (numColors > 1) {
    this._drawBuffersExt = getExtension(gl, 'WEBGL_draw_buffers')
    if (!this._drawBuffersExt) {
      throw new Error('multiple color attachments not supported')
    } else if (numColors > gl.getParameter(gl.MAX_COLOR_ATTACHMENTS)) {
      throw new Error('GL context does not support ' + numColors + ' color attachments')
    }
  }

  var width = shape[0]
  var height = shape[1]
  var useStencil = Boolean(opt.stencil)
  var useDepth = Boolean(opt.depth !== false)

  this.handle = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.handle)

  // attach textures to frame buffer
  this.colors.forEach(function (texture, i) {
    if (texture.width !== width || texture.height !== height) {
      throw new Error('all color attachments must match [width, height]')
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, 
        gl.COLOR_ATTACHMENT0 + i, 
        texture.target, 
        texture.handle, 0)
  })

  // attachment indices
  this.attachments = this.colors.map(function (t, i) {
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
          shape, gl.UNSIGNED_INT, 
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


Framebuffer.prototype.bind = function () {
  var gl = this.gl;
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

  gl.deleteFramebuffer(this.handle)
  if (this.depth) {
    this.depth.dispose()
    this.depth = null
  }

  this.colors.forEach(function (color) {
    color.dispose()
  })
  this.colors.length = 0

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
function initRenderBuffer (gl, shape, component, attachment) {
  var result = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, result)
  gl.renderbufferStorage(gl.RENDERBUFFER, component, shape[0], shape[1])
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, result)
  return result
}

function initTexture2D(gl, shape, type, format, attachment) {
  var tex = createTexture(gl, null, shape, {
    type: type,
    format: format
  })

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

function getAttachment (gl, useDepth, useStencil) {
  if (useDepth && useStencil) {
    return gl.DEPTH_STENCIL_ATTACHMENT
  } else if (useDepth && !useStencil) {
    return gl.DEPTH_ATTACHMENT
  } else if (!useDepth && useStencil) {
    return gl.STENCIL_ATTACHMENT
  }
}
