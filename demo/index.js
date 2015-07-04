var Texture2D = require('glo-texture/2d')

var near = 0.1
var far = 100

var torus = require('primitive-torus')()
var demo = require('glo-demo-primitive')(torus, {
  repeat: [8, 4],
  texture: true,
  color: [0, 1, 0, 1],
  angle: Math.PI / 1.1,
  near: near,
  far: far
})

var gl = demo.gl
// var fbo = require('gl-fbo')(gl, [gl.drawingBufferWidth, gl.drawingBufferHeight])

var Framebuffer = require('../lib/Framebuffer')
var shape = [gl.drawingBufferWidth, gl.drawingBufferHeight]
var fbo = new Framebuffer(gl, shape, {
  colors: [ Texture2D(gl, null, shape) ],
  depth: true,
  stencil: true
})
var quad = require('./glo-draw-quad')(gl)

demo.removeAllListeners('tick')
demo.on('tick', draw)
demo.start()
// draw()

function draw (dt) {
  fbo.bind()
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  demo.render(dt)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.disable(gl.CULL_FACE)

  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeighti)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clearDepth(1)
  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  
  fbo.depth.bind()
  quad.shader.bind()
  quad.shader.uniforms.near(1)
  quad.shader.uniforms.far(40)
  quad.draw()
}

// / "draw stack" idea
// / vulkan type of thing
// / execute draw commands
// / maintains state to reduce buffer binds
// / things will plug into that command queue
